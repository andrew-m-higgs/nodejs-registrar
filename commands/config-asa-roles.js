import { SlashCommandBuilder } from 'discord.js';
import algosdk from 'algosdk';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-asa-roles')
	.setDescription('Config the ASA roles given.')
	.addRoleOption(option =>
		option
			.setName('asa-role')
			.setDescription('The role which will be given.')
			.setRequired(true),
	)
	.addNumberOption(option =>
		option
			.setName('asa-id')
			.setDescription('The ASA ID for which this role is given.')
			.setRequired(true),
	)
	.addNumberOption(option =>
		option
			.setName('asa-qty')
			.setDescription('The ASA ID quantity needed for this role to be given.')
			.setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('delete-role')
			.setDescription('This ASA and Role ID combination should be removed.')
			.setRequired(false)
			.addChoices(
				{ name: 'True', value: 'true' },
				{ name: 'False', value: 'false' },
			),
	);


export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const asa_role = await interaction.options.getRole('asa-role');
		const asa_id = await interaction.options.getNumber('asa-id');
		// Get ASA Name
		const indexerClient = new algosdk.Indexer('', 'https://mainnet-idx.algonode.cloud', '');
		const assetInfo = await indexerClient.lookupAssetByID(asa_id).do();
		const asa_name = assetInfo.asset.params.name;

		const asa_qty = await interaction.options.getNumber('asa-qty');
		const embeds = [];
		const content = 'Updating the ASA roles for this project.';
		let delete_role = await interaction.options.getString('delete-role');
		if (delete_role == null || delete_role == 'false') {
			delete_role = false;
		} else {
			delete_role = true;
		}

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		let sql = `INSERT INTO asaroles(role_id, role_name, asa_id, asa_name, asa_qty) VALUES("${asa_role.id}", "${asa_role.name}", ${asa_id}, "${asa_name}", ${asa_qty}) ON CONFLICT(role_id, asa_id) DO UPDATE SET role_name = "${asa_role.name}", asa_qty = ${asa_qty}, asa_name = "${asa_name}";`;
		if (delete_role) {
			sql = `DELETE FROM asaroles WHERE asa_id = ${asa_id} AND role_id = "${asa_role.id}";`;
		}
		console.log(sql);
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The ASA roles have been updated. Run /view-asa-roles to check them.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (err) {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the ASA roles.',
				description: `**Error**: ${err.message}`,
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}