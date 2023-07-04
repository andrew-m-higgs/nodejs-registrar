import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import { getAssetByID } from '../helpers/algorand.js';
import { ASA } from '../classes/asa.js';
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
	.addStringOption(option =>
		option
			.setName('asa-ids')
			.setDescription('The ASA IDs which make up the role to be given. Single or comma delimited.')
			.setRequired(true),
	)
	.addNumberOption(option =>
		option
			.setName('role-qty')
			.setDescription('The quantity needed, from the sum of the ASA IDs, for this role to be given.')
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
		let asa_ids = await interaction.options.getString('asa-ids').replaceAll(' ', '');
		const role_qty = await interaction.options.getNumber('role-qty');
		let delete_role = await interaction.options.getString('delete-role');

		const embeds = [];
		const content = 'Updating the ASA roles for this project.';

		if (delete_role == null || delete_role == 'false') {
			delete_role = false;
		} else {
			delete_role = true;
		}

		// Massage asa_ids so that they are always comparable
		console.log('1: ' + asa_ids);
		const asa_ids_arr = asa_ids.split(',').sort();
		asa_ids = asa_ids_arr.join(',');
		console.log('2: ' + asa_ids);

		// Get ASA Name
		for (const asa_id of asa_ids_arr) {
			const asa = new ASA(asa_id);
			const assetInfo = await getAssetByID(asa_id);
			// console.log(JSON.stringify(assetInfo));
			asa.asa_name = assetInfo.name;
			asa.asa_decimals = assetInfo.decimals;
			asa.asa_divisor = assetInfo.divisor;
			await asa.set();
		}

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		let sql = `INSERT INTO asaroles(role_id, role_name, asa_ids, role_qty) VALUES("${asa_role.id}", "${asa_role.name}", "${asa_ids}", ${role_qty}) ON CONFLICT(role_id, asa_ids) DO UPDATE SET role_name = "${asa_role.name}", role_qty = ${role_qty};`;
		if (delete_role) {
			sql = `DELETE FROM asaroles WHERE asa_ids = ${asa_ids} AND role_id = "${asa_role.id}";`;
		}
		// console.log(sql);
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The ASA role has been updated. Run /view-asa-roles to check.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch (error) {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the ASA roles.',
			});
			console.log('ERROR: There was an error updating ASA roles. commands/config-asa-roles.js');
			console.log('ERROR: SQL: ' + sql);
			console.log('ERROR: ' + error.message);
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}