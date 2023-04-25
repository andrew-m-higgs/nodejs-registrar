import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle,
	StringSelectMenuBuilder,
} from 'discord.js';
import fetch from 'node-fetch';
import algosdk from 'algosdk';
import { CID } from 'multiformats/cid';
import { decodeAddress as decode } from 'algosdk';
import * as digest from 'multiformats/hashes/digest';
import * as mfsha2 from 'multiformats/hashes/sha2';
import * as db_functions from './db-functions.js';
import 'dotenv/config';
const Green = process.env.Green;
const Red = process.env.Red;

export async function delay(time) {
	return new Promise(resolve => setTimeout(resolve, time));
}

export async function addrToCid(template, addr) {
	const [, , ver, codec, ,] = template.split(':');
	const mhash = digest.create(mfsha2.sha256.code, decode(addr).publicKey);
	return CID.create(ver * 1, codec == 'dag-pb' ? 0x70 : 0x55, mhash).toV1().toString();
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
	const ipfsSites = ['https://ipfs.algonft.tools/ipfs/', 'https://ipfs.io/ipfs/'];
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
						label: 'NFT Explorer ',
						url: `https://www.nftexplorer.app/asset/${assetID}`,
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
		// convert tx_timeout to milliseconds ( * 60000 )
		const tx_timeout = parseInt(config.optin_tx_timeout) * 60000;
		// const currentTime = new Date();
		// const mathTime = new Date(currentTime - tx_timeout);
		const finalTime = new Date(Date.now() - tx_timeout).toISOString();
		const response = await fetch('https://algoindexer.algoexplorerapi.io/v2/accounts/' + wallet_string + '/transactions?tx-type=axfer&after-time=' + finalTime);
		const txResult = await response.json();
		const txs = txResult.transactions;
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
	const colourGreen = parseInt(Green);

	const memberAssets = [];
	let numNFTs = 0;
	const embeds = [];
	let embed_content = '';
	let colour = colourGreen;
	let keepGoing = true;


	// Get Creator Assets
	const db = await db_functions.dbOpen();
	db.each('SELECT asset_id FROM assets ORDER BY asset_id', async (error, row) => {
		if (error) {
			console.log(error);
			keepGoing = false;
			colour = colourRed;
			embed_content = ':no_entry: We had an issue collecting the creator assets. Please try again later or contact support.';
			embeds.push({ type: 'rich', color: colour, description: embed_content });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} else {
			creatorAssets.push(row['asset_id']);
		}
	});

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
				// console.log(JSON.stringify(accountAssets));
				for (let i = 0; i < accountAssets.length; i++) {
					const asset = accountAssets[i];
					if (asset.amount > 0) {
						if (creatorAssets.includes(asset['asset-id'])) {
							memberAssets.push(asset['asset-id']);
							numNFTs++;
						}
					}
				}
			}
		} catch {
			// Error
			keepGoing = false;
			colour = colourRed;
			embed_content = ':no_entry: We had an issue collecting this wallets assets. Please try again later or contact support.';
			embeds.push({ type: 'rich', color: colour, description: embed_content });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Insert data into Members table
	if (keepGoing) {
		const sql = `INSERT INTO members(member_id, nickname, wallet_string, asset_ids, numnfts) VALUES("${member_id}", "${nickname}", "${wallet_string}", "${memberAssets}", ${numNFTs}) ON CONFLICT(member_id) DO UPDATE set wallet_string = "${wallet_string}", nickname = "${nickname}", asset_ids = "${memberAssets}", numnfts = ${numNFTs};`;
		try {
			db.run(sql);
			embed_content = ':white_check_mark: Successfully registered the wallet (' + wallet_string + ').';
			colour = colourGreen;
			embeds.push({ type: 'rich', color: colour, description: embed_content });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (err) {
			// Error
			keepGoing = false;
			embed_content = ':no_entry: There was an error registering the wallet (' + wallet_string + ').';
			colour = colourRed;
			embeds.push({ type: 'rich', color: colour, description: embed_content });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}

	// Assign registered role
	if (keepGoing) {
		try {
			member.roles.add(`${config.registered_role_id}`);
			console.log('Role assigned: ' + config.registered_role_name + ' (' + config.registered_role_id + ')');
			embed_content = ':white_check_mark: Registered role has been assigned: **' + config.registered_role_name + '**.';
			colour = colourGreen;
			embeds.push({ type: 'rich', color: colour, description: embed_content });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (err) {
			// Error
			keepGoing = false;
			embed_content = ':no_entry: There was an error assigning the registered role.';
			colour = colourRed;
			embeds.push({ type: 'rich', color: colour, description: embed_content });
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
								// If all_owner_roles is false (<>0) then don't changed roleAssigned
								if (config.all_owner_roles != 0) {
									roleAssigned = true;
								}
								colour = colourGreen;
								embed_content = ':white_check_mark: Owner role has been assigned: **' + thisRow.role_name + '**.';
								embeds.push({ type: 'rich', color: colour, description: embed_content });
								await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
							} catch {
								// Error
								keepGoing = false;
								roleAssigned = false;
								embed_content = ':no_entry: There was an error assigning the owner role: **' + thisRow.role_name + '**.';
								colour = colourRed;
								embeds.push({ type: 'rich', color: colour, description: embed_content });
								await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
							}
						} else {
							// Delete role in case it was previously assigned
							try {
								member.roles.remove(`${thisRow.role_id}`);
							} catch {
								// Error removing previously assigned role
								console.log('[ERROR]: removing previously assigned role.');
							}
						}
						ownerRoles.push({ id: thisRow.role_id, name: thisRow.role_name, numnfts: thisRow.numnfts });
					}
				});
			} catch {
				// Error
				keepGoing = false;
				embed_content = ':no_entry: There was an error assigning the owner role.';
				colour = colourRed;
				embeds.push({ type: 'rich', color: colour, description: embed_content });
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
			keepGoing = false;
			embed_content = ':construction_site: Not yet have enough NFTs to qualify for an owner role. This wallet has ' + numNFTs + ' NFTs and the lowest number to qualify is ' + lowestOwnerRole + '.';
			colour = colourRed;
			embeds.push({ type: 'rich', color: colour, description: embed_content });

			if ((type != 'CHECK') && (config.secondary != '')) {
				embed_content = ':construction_site: Check out the secondary market at ' + config.secondary + ' to get some more NFTs.';
				colour = colourGreen;
				embeds.push({ type: 'rich', color: colour, description: embed_content });
			}
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	}
}


// Multiple selects when > than 25 options
export function getSelectMenu(page, options) {
	const selectMenu = new StringSelectMenuBuilder();
	selectMenu.setCustomId('flex_select');
	const opts = [];
	for (let i = 25 * page; i < options.length && i < 25 * (page + 1); i++) {
		opts.push(options[i]);
	}
	selectMenu.addOptions(opts);
	return selectMenu;
}

export function getButtons(page, options) {
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
	buttons.push(
		new ButtonBuilder()
			.setCustomId('rand_flex')
			.setStyle('Danger')
			.setLabel('Random'),
	);
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

export function getComponents(page, options) {
	return [
		new ActionRowBuilder()
			.addComponents([
				getSelectMenu(page, options),
			]),
		new ActionRowBuilder()
			.addComponents(
				getButtons(page, options),
			),
	];
}
