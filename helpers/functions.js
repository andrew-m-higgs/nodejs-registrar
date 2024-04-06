import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle,
	StringSelectMenuBuilder,
} from 'discord.js';
import algosdk from 'algosdk';
import * as db_functions from './db-functions.js';
import 'dotenv/config';
import { ASA } from '../classes/asa.js';
const Green = process.env.Green;
const Red = process.env.Red;

export async function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

export async function getMember(interaction, member_id) {
	if (member_id != '') {
		return await interaction.guild.members.fetch(member_id);
	} else {
		return await interaction.guild.members.fetch(interaction.user.id);
	}
}

export async function getCreatorWallets(wallet_strings) {
	// Returns and array of creator wallets

	return wallet_strings.split(',');
}

export async function isAdmin(interaction, config) {
	// Check if the current member has the configured admin role.
	const member = await interaction.guild.members.fetch(interaction.user.id);

	if (member.roles.cache.has(config.admin_role_id)) {
		return true;
	} else {
		// If interaction user is the Owner Admin is assumed
		const owner = await interaction.guild.fetchOwner().catch(err => err);
		if (owner.user.id === interaction.user.id) {
			return true;
		}
	}
	return false;
}

export async function isRegistered(interaction, config) {
	// Check if the current member has the configured registered role.
	const member = await interaction.guild.members.fetch(interaction.user.id);

	return member.roles.cache.has(config.registered_role_id);
}

// Get the ID and NAME of a role store in the DB
export async function getConfigRole(type) {
	// type can be one of 'REGISTERED' or 'ADMIN'
	const db = await db_functions.dbOpen();
	// let role = {};
	let row = '';
	switch (type) {
	case 'REGISTERED':
		row = await db.get('SELECT registered_role_id as role_id, registered_role_name as role_name FROM config LIMIT 1');
		break;
	case 'ADMIN':
		row = await db.get('SELECT admin_role_id as role_id, admin_role_name as role_name FROM config LIMIT 1');
		break;
	}
	return {
		'role_id': `${row['role_id']}`,
		'role_name': `${row['role_name']}`,
	};
}

// getNFT()
export async function getNFT(asset_id) {
	const db = await db_functions.dbOpen();
	return await db.get('SELECT * FROM assets WHERE asset_id = ' + asset_id + ' LIMIT 1');
}

// Flex the given asset to the current channel
export async function flexAsset(interaction, config, asset, flexType) {

	const channel_id = interaction.channelId;
	const member_id = interaction.user.id;

	const assetName = asset['name'];
	const assetIPFS = asset['ipfs'];
	const assetID = asset['asset_id'];
	const assetQty = asset['qty'];
	const ipfsSites = ['https://ipfs.algonode.xyz/ipfs/', 'https://ipfs.io/ipfs/'];
	// const randIdx = Math.round(Math.random());
	// Test algonft.tools by itself. ipfs.io seemed to timeout a few times
	const linkIPFS = `${ipfsSites[0]}${assetIPFS}`;
	let colour = 0xFF9900;
	let message_content = 'Something went wrong.';
	let title = '';
	const collectionName = config.collection_name;

	switch (flexType) {
	case 'RANDOM':
		message_content = `<@!${member_id}> flexed a **random** NFT from ` + collectionName + '!';
		colour = parseInt(Red);
		title = 'Random Flex';
		break;
	case 'OWN':
		message_content = `<@!${member_id}> flexed **their** favourite NFT from ` + collectionName + '!';
		colour = parseInt(Green);
		title = 'Own Flex';
		break;
	}

	await interaction.channel.send({
		channel_id: `${channel_id}`,
		components: [
			{
				type: 1,
				components: [
					{
						style: 5,
						label: 'Flipping Algos',
						url: `https://explorer.flippingalgos.xyz/asset/${assetID}`,
						disabled: false,
						type: 2,
					},
					{
						style: 5,
						label: 'Minthol.art',
						url: `https://www.minthol.art/algo/assets/${assetID}`,
						disabled: false,
						type: 2,
					},
					{
						style: 5,
						label: 'Rand Gallery',
						url: `https://www.randgallery.com/algo-collection/?address=${assetID}`,
						disabled: false,
						type: 2,
					},
				],
			},
		],
		embeds: [
			{
				color: colour,
				title: title,
				description: message_content,
				image: {
					url: `${linkIPFS}`,
				},
				fields: [
					{
						name: `**${assetName}**`,
						value: `This asset has a quantity of ${assetQty}`,
					},
				],
				footer: {
					text: `${linkIPFS}`,
				},
			},
		],
	});
}

// Get a random colour fo fun
export async function getRandomColour() {
	// Generate a random colour
	return Math.floor(Math.random() * 16777215);
}

// WORK IN PROGRESS
export async function isOptedIn(interaction, config, wallet_string) {
	// Check if wallet_string is opted-in
	if (config.optin_token == '') {
		// If no optin_token set then assume true
		return true;
	} else {
		// Check transactions for wallet_string and confirm transaction is within tx_timeout
		const optin_token = config.optin_token;
		const tx_timeout = parseInt(config.optin_tx_timeout) * 60000;
		const finalTime = new Date(Date.now() - tx_timeout).toISOString();
		const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '');
		const response = await indexerClient
			.lookupAccountTransactions(wallet_string)
			.afterTime(finalTime)
			.do();
		const txs = response.transactions;
		for (let j = 0; j < txs.length; j++) {
			if ((txs[j]['asset-transfer-transaction'] != undefined) && (txs[j]['asset-transfer-transaction']['asset-id'] == optin_token)) {
				return true;
			}
		}
		return false;
	}
}

export async function displayOptinButton(interaction, config, content) {
	// Display a button allowing optin and one to say 'Have Opted In'
	const row = new ActionRowBuilder()
		.addComponents(
			new ButtonBuilder()
				.setLabel('Opt-in here.')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://www.randgallery.com/algo-collection/?address=${config.optin_token}`),
		);
	await interaction.editReply({ content: content + '\nAfter Optin please run **/register** again.', components: [row], ephemeral: true });
}

// Check and update roles for a wallet and discord ID
export async function updateRoles(interaction, config, nickname, wallet_string, member_id, content, type) {
	const member = await getMember(interaction, member_id);
	const creatorAssets = [];
	const colourRed = parseInt(Red);

	const memberAssets = [];
	const memberASAs = {};
	let numNFTs = 0;
	let reg_embed_content = '';
	let owner_embed_content = '';
	let asa_embed_content = '';
	const reg_title = '**__Register Information__**';
	const owner_title = '**__Owner Roles__**';
	const asa_title = '**__ASA Roles__**';
	const embeds = [
		{
			type: 'rich',
			title: reg_title,
		},
		{
			type: 'rich',
			title: owner_title,
		},
		{
			type: 'rich',
			title: asa_title,
		},
	];
	const reg_colour = 0x999933;
	const owner_colour = 0xFF9900;
	const asa_colour = 0xFF33FF;

	let keepGoing = true;
	const asaRoles = {};

	// Get Creator Assets
	const db = await db_functions.dbOpen();
	const sqlAssets = 'SELECT asset_id FROM assets ORDER BY asset_id';
	db.each(sqlAssets, async (error, row) => {
		if (error) {
			console.log('ERROR: Collecting the creator assets. (helpers/functions.js#updateRoles)');
			console.log('ERROR: Running sql. (' + sqlAssets + ').');
			console.log(error);
			keepGoing = false;
			reg_embed_content = reg_embed_content + ':no_entry: We had an issue collecting the creator assets. Please try again later or contact support.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: colourRed, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} else {
			creatorAssets.push(row['asset_id']);
		}
	});

	// Get ASA roles
	if (keepGoing) {
		const sqlASA = 'SELECT * FROM asaroles ORDER BY role_name ASC';
		await db.each(sqlASA, async (error, row) => {
			if (error) {
				console.log('ERROR: Collecting the ASA roles. (helpers/functions.js#updateRoles())');
				console.log('ERROR: Running sql. (' + sqlASA + ').');
				console.log(error);
			}

			const role_id = `${row.role_id}`;
			const role_name = `${row.role_name}`;
			const role_qty = `${row.role_qty}`;
			const asa_ids = `${row.asa_ids}`;

			if (!Object.keys(asaRoles).includes(asa_ids)) {
				asaRoles[`${asa_ids}`] = {
					roles: [],
				};
			}
			const assets = [];
			for (const asa_id of asa_ids.split(',')) {
				assets.push(asa_id);
			}
			asaRoles[`${asa_ids}`].roles.push({
				role_id: role_id,
				role_name: role_name,
				role_qty: role_qty,
				assets: assets,
			});
		});
	}
	console.log(JSON.stringify(asaRoles));

	// Get Member Assets
	if (keepGoing) {
		try {
			const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '');
			let nextToken = '';

			while (nextToken !== undefined) {
				const response = await indexerClient
					.lookupAccountAssets(wallet_string)
					.limit(500)
					.nextToken(nextToken)
					.do();

				nextToken = response['next-token'];
				const accountAssets = response.assets;
				for (let i = 0; i < accountAssets.length; i++) {
					const asset = accountAssets[i];
					if (asset.amount > 0) {
						const asa_id = asset['asset-id'];
						if (creatorAssets.includes(asa_id)) {
							memberAssets.push(asa_id);
							numNFTs++;
						}
						memberASAs[`${asa_id}`] = asset.amount;
					}
				}
			}
		} catch {
			// Error
			keepGoing = false;
			console.log('ERROR: Could not get wallet assets. (helpers/functions.js#updateRoles)');
			reg_embed_content = reg_embed_content + ':no_entry: We had an issue collecting this wallets assets. Please try again later or contact support.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: colourRed, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Insert data into Members table
	if (keepGoing) {
		const sql = `INSERT INTO members(member_id, nickname, wallet_string, asset_ids, numnfts) VALUES("${member_id}", "${nickname}", "${wallet_string}", "${memberAssets}", ${numNFTs}) ON CONFLICT(member_id) DO UPDATE set wallet_string = "${wallet_string}", nickname = "${nickname}", asset_ids = "${memberAssets}", numnfts = ${numNFTs};`;
		try {
			db.run(sql);
			reg_embed_content = reg_embed_content + ':white_check_mark: Successfully registered the wallet.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: reg_colour, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (err) {
			// Error
			keepGoing = false;
			console.log('ERROR: Could not register wallet (' + wallet_string + '). (helpers/functions.js#updateRoles)');
			reg_embed_content = reg_embed_content + ':no_entry: There was an error registering the wallet.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: colourRed, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Assign registered role
	if (keepGoing) {
		try {
			member.roles.add(`${config.registered_role_id}`);
			console.log('Role assigned: ' + config.registered_role_name + ' (' + config.registered_role_id + ')');
			reg_embed_content = reg_embed_content + ':white_check_mark: Registered role has been assigned: **' + config.registered_role_name + '**.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: reg_colour, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (err) {
			// Error
			keepGoing = false;
			console.log('ERROR: Could not assign the registered role. (helpers/functions.js#updateRoles)');
			reg_embed_content = reg_embed_content + ':no_entry: There was an error assigning the registered role.\n';
			embeds[0] = { type: 'rich', title: reg_title, color: colourRed, description: reg_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Assign necessary owner role
	if (keepGoing) {
		const row = await db.get('SELECT min(numnfts) as minnfts FROM roles');
		const lowestOwnerRole = parseInt(row.minnfts);
		console.log('lowest: ' + lowestOwnerRole);
		if (numNFTs >= lowestOwnerRole) {
			try {
				// Add owner role
				const ownerRoles = [];
				let roleAssigned = false;
				db.each('SELECT * FROM roles ORDER BY numnfts DESC', async (error, thisRow) => {
					if (error) {
						console.log(error);
					} else {
						if ((numNFTs >= parseInt(thisRow.numnfts)) && (!roleAssigned)) {
							try {
								member.roles.add(`${thisRow.role_id}`);
								console.log('Role assigned: ' + thisRow.role_name + ' (' + thisRow.role_id + ')');
								// If all_owner_roles is false (<>0) then don't change roleAssigned
								if (config.all_owner_roles != 0) {
									roleAssigned = true;
								}
								owner_embed_content = owner_embed_content + ':white_check_mark: Owner role has been assigned: **' + thisRow.role_name + '**.\n';
								embeds[1] = { type: 'rich', title: owner_title, color: owner_colour, description: owner_embed_content };
								await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
							} catch {
								// Error
								keepGoing = false;
								roleAssigned = false;
								console.log('ERROR: Could not assign owner role (' + thisRow.role_name + '). (helpers/functions.js#updateRoles)');
								owner_embed_content = owner_embed_content + ':no_entry: There was an error assigning the owner role: **' + thisRow.role_name + '**.\n';
								embeds[1] = { type: 'rich', title: owner_title, color: colourRed, description: owner_embed_content };
								await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
							}
						} else {
							// Delete role in case it was previously assigned
							try {
								member.roles.remove(`${thisRow.role_id}`);
							} catch {
								// Error removing previously assigned role
								console.log('ERROR: Unable to remove previously assigned role.');
							}
						}
						ownerRoles.push({ id: thisRow.role_id, name: thisRow.role_name, numnfts: thisRow.numnfts });
					}
				});
			} catch {
				// Error
				keepGoing = false;
				console.log('ERROR: Could not assign owners role. (helpers/functions.js#updateRoles)');
				owner_embed_content = owner_embed_content + ':no_entry: There was an error assigning the owner role.\n';
				embeds[1] = { type: 'rich', title: owner_title, color: colourRed, description: owner_embed_content };
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}
		} else {
			// Not yet an owner

			// Remove potentially existing owner roles.
			db.each('SELECT * FROM roles ORDER BY numnfts DESC', async (error, thisRow) => {
				if (error) {
					console.log(error);
				} else {
					member.roles.remove(thisRow.role_id);
				}
			});
			// keepGoing = false;
			owner_embed_content = owner_embed_content + ':construction_site: Not yet have enough NFTs to qualify for an owner role. This wallet has ' + numNFTs + ' NFTs and the lowest number to qualify is ' + lowestOwnerRole + '.\n';

			if ((type != 'CHECK') && (config.secondary != '')) {
				owner_embed_content = owner_embed_content + ':construction_site: Check out the secondary market at ' + config.secondary + ' to get some more NFTs.\n';
			}
			embeds[1] = { type: 'rich', title: owner_title, color: owner_colour, description: owner_embed_content };
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Add ASA Roles
	if (keepGoing) {
		// Delete all ASA roles managed by bot
		for (let i = 0; i < Object.keys(asaRoles).length; i++) {
			const roles = Object.values(asaRoles)[i].roles;
			for (const role of roles) {
				const role_id = role.role_id;
				await member.roles.remove(role_id);
			}
		}

		// Now assign all roles for which the member qualifies
		for (let i = 0; i < Object.keys(asaRoles).length; i++) {
			let roleAssigned = false;
			const roles = Object.values(asaRoles)[i].roles;
			const assets = roles[0].assets;
			// Go through each asset and sum the member_qty
			let member_qty = 0;
			for (const asa_id of assets) {
				if (Object.keys(memberASAs).includes(asa_id)) {
					const asa = new ASA(asa_id);
					await asa.get();
					member_qty += memberASAs[asa_id] / asa.asa_divisor;
				}
			}

			for (const role of roles) {
				const role_id = role.role_id;
				const role_name = role.role_name;
				const role_qty = role.role_qty;
				// const role_assets = role.assets;


				// Compare qty and check roleAssigned
				if ((!roleAssigned) && (member_qty >= role_qty)) {
					console.log('Role assigned: ' + role_name + '(' + role_id + ')');
					await member.roles.add(role_id);
					asa_embed_content = asa_embed_content + ':white_check_mark: Owner role has been assigned: **' + role_name + '**.\n';
					embeds[2] = { type: 'rich', title: asa_title, color: asa_colour, description: asa_embed_content };
					if (config.all_owner_roles != 0) {
						roleAssigned = true;
					}
					await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
				} else {
					// Does not qualify
				}
			}
		}
	}
}


// Multiple selects when > than 25 options
export function getSelectMenu(page, options, name) {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId(name);
	const opts = [];
	for (let i = 25 * page; i < options.length && i < 25 * (page + 1); i++) {
		opts.push(options[i]);
	}
	selectMenu.addOptions(opts);
	return selectMenu;
}

export function getButtons(page, options, show_random_btn = false) {
	const buttons = [];
	if (page > 0) {
		buttons.push(
			new ButtonBuilder()
				.setCustomId('previous_page')
				.setStyle('Secondary')
				.setEmoji('⬅'),
		);
	} else {
		buttons.push(
			new ButtonBuilder()
				.setCustomId('previous_page')
				.setStyle('Secondary')
				.setDisabled(true)
				.setEmoji('⬅'),
		);
	}
	if (show_random_btn) {
		buttons.push(
			new ButtonBuilder()
				.setCustomId('rand_flex')
				.setStyle('Danger')
				.setLabel('Random'),
		);
	}
	if (25 * (page + 1) < options.length) {
		buttons.push(
			new ButtonBuilder()
				.setCustomId('next_page')
				.setStyle('Secondary')
				.setEmoji('➡'),
		);
	} else {
		buttons.push(
			new ButtonBuilder()
				.setCustomId('next_page')
				.setStyle('Secondary')
				.setDisabled(true)
				.setEmoji('➡'),
		);
	}
	return buttons;
}

export function getComponents(page, options, name, show_random_btn = false) {
	return [
		new ActionRowBuilder()
			.addComponents([
				getSelectMenu(page, options, name),
			]),
		new ActionRowBuilder()
			.addComponents(
				getButtons(page, options, show_random_btn),
			),
	];
}
