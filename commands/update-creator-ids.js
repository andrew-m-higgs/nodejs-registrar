import { SlashCommandBuilder } from 'discord.js';
import algosdk from 'algosdk';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import { addrToCid } from '../helpers/algorand.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;

export const data = new SlashCommandBuilder()
	.setName('update-creator-ids')
	.setDescription('Get and update all ids from the configured creator wallets.');

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const content = 'Getting list of ASA IDs from creator wallets...';
	const embeds = [];
	await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

	if (isAdmin) {
		let numASA = 0;

		const db = await db_functions.dbOpen();

		// Get an array of creator wallets from db
		const walletStrings = config.wallet_strings;
		const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '');


		for (let i = 0; i < walletStrings.length; i++) {
			console.log(walletStrings[i]);
			let walletASANum = 0;
			let nextToken = '';

			while (nextToken !== undefined) {
				const response = await indexerClient
					.lookupAccountCreatedAssets(walletStrings[i])
					.limit(500)
					.nextToken(nextToken)
					.do();

				nextToken = response['next-token'];

				for (let j = 0; j < response.assets.length; j++) {
					const asset = response.assets[j];
					console.log(JSON.stringify(asset));
					if (!asset.deleted) {
						let ipfs = '';
						const assetUrl = asset.params.url;
						if (assetUrl) {
							walletASANum++;
							if (assetUrl.toUpperCase().startsWith('TEMPLATE-IPFS://')) {
								const address = asset.params.reserve;
								ipfs = await addrToCid(assetUrl, address);
							} else {
								ipfs = assetUrl.split('/').pop().split('#').shift();
							}
							const sql = `INSERT INTO assets(asset_id, name, ipfs, qty) VALUES("${asset.index}", "${asset.params.name}", "${ipfs}", ${asset.params.total}) ON CONFLICT(asset_id) DO UPDATE SET name = "${asset.params.name}", ipfs = "${ipfs}", qty = ${asset.params.total}`;
							try {
								db.run(sql);
							} catch (err) {
								console.log('Problem SQL: ' + sql);
								console.error(err.message);
							}
						}
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
}