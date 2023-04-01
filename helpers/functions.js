const fetch = require('node-fetch');
const { Green, Red } = require('../config.json');
const db_functions = require('./db-functions.js');

async function getMember(interaction, member_id) {
	if (member_id != '') {
		return await interaction.guild.members.fetch(member_id);
	} else {
		return await interaction.guild.members.fetch(interaction.user.id);
	}
}

module.exports = {
	async getCreatorWallets(wallet_strings) {
		// Returns and array of creator wallets

		return wallet_strings.split(',');
	},

	async isAdmin(interaction, config) {
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
	},

	async isRegistered(interaction, config) {
		// Check if the current member has the configured registered role.
		const member = await interaction.guild.members.fetch(interaction.user.id);

		return member.roles.cache.has(config.registered_role_id);
	},

	// Get the ID and NAME of a role store in the DB
	async getConfigRole(type) {
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

	},

	// Get a member from the given interaction
	getMember: async (interaction) => {
		return getMember(interaction, '');
	},

	getNFT: async (asset_id) => {
		const db = await db_functions.dbOpen();
		return await db.get('SELECT * FROM assets WHERE asset_id = ' + asset_id + ' LIMIT 1');
	},

	// Flex the given asset to the current channel
	flexAsset: async (interaction, config, flexAsset, flexType) => {

		const channel_id = interaction.channelId;
		const member_id = interaction.user.id;

		const assetName = flexAsset['name'];
		const assetIPFS = flexAsset['ipfs'];
		const assetID = flexAsset['asset_id'];
		const assetQty = flexAsset['qty'];
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

		await interaction.editReply({
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
						url: `https://ipfs.io/ipfs/${assetIPFS}`,
					},
					fields: [
						{
							name: `**${assetName}**`,
							value: `This asset has a quantity of ${assetQty}`,
						},
					],
				},
			],
		});
	},

	// Get a random colour fo fun
	getRandomColour: () => {
		// Generate a random colour
		return Math.floor(Math.random() * 16777215);
	},

	isOptedIn: (interaction, config) => {
		// Check if wallet_string is opted-in
		if (config.optin_token == '') {
			// If no optin_token set then assume true
			return true;
		} else {
			//
		}
	},

	displayOptinButton: (interaction, config) => {
		// Display a button allowing optin and one to say 'Have Opted In'

	},

	// Check and update roles for a wallet and discord ID
	updateRoles: async (interaction, config, nickname, wallet_string, member_id, content, type) => {
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
				const response = await fetch('https://algoindexer.algoexplorerapi.io/v2/accounts/' + wallet_string + '/assets');
				const assetResult = await response.json();
				for (let j = 0; j < assetResult.assets.length; j++) {
					const asset = assetResult.assets[j];
					if (asset.amount > 0) {
						if (creatorAssets.includes(asset['asset-id'])) {
							memberAssets.push(asset['asset-id']);
							numNFTs++;
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
			let lowestOwnerRole = parseInt(row.minnfts);
			console.log('lowest: ' + lowestOwnerRole);
			if (numNFTs > lowestOwnerRole) {
				try {
					// Add owner role
					const ownerRoles = [];
					db.each('SELECT * FROM roles ORDER BY numnfts DESC', async (error, thisRow) => {
						if (error) {
							console.log(error);
						} else {
							if (lowestOwnerRole < thisRow.numnfts) {
								lowestOwnerRole = thisRow.numnfts;
							}
							if (numNFTs >= parseInt(thisRow.numnfts)) {
								try {
									member.roles.add(`${thisRow.role_id}`);
									console.log('Role assigned: ' + thisRow.role_name + ' (' + thisRow.role_id + ')');
									colour = colourGreen;
									embed_content = ':white_check_mark: Owner role has been assigned: **' + thisRow.role_name + '**.';
									embeds.push({ type: 'rich', color: colour, description: embed_content });
									await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
								} catch {
									// Error
									keepGoing = false;
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
	},
};
