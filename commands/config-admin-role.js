import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-admin-role')
	.setDescription('Config the admin role for this project.')
	.addRoleOption(option =>
		option
			.setName('admin-role')
			.setDescription('The role which is allowed to run admin features for this project.')
			.setRequired(true),
	);


export async function execute(interaction, config) {
	// Need to check for Owner because admin-role might not be configured yet?
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const admin_role = await interaction.options.getRole('admin-role');
		console.log('ID: ' + admin_role.id);
		console.log('Name: ' + admin_role.name);
		const embeds = [];
		const content = 'Updating the admin role for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `UPDATE config SET admin_role_id = "${admin_role.id}", admin_role_name = "${admin_role.name}";`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The admin role has been updated.',
			});

			// Update the config variable
			config.admin_role_id = admin_role.id;
			config.admin_role_name = admin_role.name;

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the admin role.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}