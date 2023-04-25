import { SlashCommandBuilder } from 'discord.js' ;
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-all-owner-roles')
	.setDescription('Config whether or not members get all owner roles for which they qualify or just the highest one.')
	.addNumberOption(option =>
		option
			.setName('all-owner-roles')
			.setDescription('Config whether or not members get all owner roles for which they qualify or just the highest one.')
			.setRequired(true)
			.addChoices(
				{ name: 'True', value: 0 },
				{ name: 'False', value: 1 },
			),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const all_owner_roles = await interaction.options.getNumber('all-owner-roles');
		const embeds = [];
		const content = 'Updating the all owner roles config for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `UPDATE config SET all_owner_roles = "${all_owner_roles}";`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: All owner roles updated.',
			});

			// Update the config variable
			config.all_owner_roles = all_owner_roles;

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the all owners role config.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}