const { SlashCommandBuilder } = require('discord.js');
const { NoPermission } = require('../config.json');
const { Green } = require('../config.json');
const fetch = require('node-fetch');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update-creator-ids')
		.setDescription('Get and update all ids from the configured creator wallets.'),

	async execute(interaction, config) {
		const isAdmin = await functions.isAdmin(interaction, config);
		const content = 'Getting list of ASA IDs from creator wallets...';
		const embeds = [];
		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

		if (isAdmin) {
			let numASA = 0;

			const db = await db_functions.dbOpen();

			// Get an array of creator wallets from db
			const walletStrings = config.wallet_strings;

			for (let i = 0; i < walletStrings.length; i++) {
				console.log(walletStrings[i]);
				let walletASANum = 0;
				const url = `https://algoindexer.algoexplorerapi.io/v2/accounts/${walletStrings[i]}/created-assets?limit=1000`;
				console.log(url);
				const response = await fetch(url);
				const assetResult = await response.json();
				for (let j = 0; j < assetResult.assets.length; j++) {
					const asset = assetResult.assets[j];
					if (!asset.deleted) {
						walletASANum++;
						const ipfs = asset.params.url.split('/').pop().split('#').shift();
						const sql = `INSERT INTO assets(asset_id, name, ipfs, qty) VALUES("${asset.index}", "${asset.params.name}", "${ipfs}", ${asset.params.total}) ON CONFLICT(asset_id) DO UPDATE SET name = "${asset.params.name}", ipfs = "${ipfs}", qty = ${asset.params.total}`;
						try {
							db.run(sql);
						} catch (err) {
							console.log('Problem SQL: ' + sql);
							console.error(err.message);
						}
					}
				}
				const embed = {
					'type': 'rich',
					'title': walletStrings[i],
					'description': 'This wallet has **' + walletASANum + '** assets in it.',
					'color': parseInt(Green),
				};
				embeds.push(embed);
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });

				numASA += walletASANum;
			}
			// console.log('EMBEDS: ' + JSON.stringify(embeds));
			embeds.push({
				type: 'rich',
				title: 'All Done.',
				description: ':white_check_mark: Assets have been updated. A total of **' + numASA + '** have been added or updated.',
				color: 0xFF9900,
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} else {
			// Not an admin
			await interaction.editReply(NoPermission);
		}
	},
};