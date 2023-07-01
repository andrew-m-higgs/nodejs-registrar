import { SlashCommandBuilder } from 'discord.js' ;
import * as functions from '../helpers/functions.js';
import { logMessage } from '../helpers/admin.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-all-owner-roles')
	.setDescription('Config whether or not members get all owner roles for which they qualify or just the highest one.')
	.addStringOption(option =>
		option
			.setName('all-owner-roles')
			.setDescription('Config whether or not members get all owner roles for which they qualify or just the highest one.')
			.setRequired(true)
			.addChoices(
				{ name: 'True', value: 'T' },
				{ name: 'False', value: 'F' },
			),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const all_owner_roles = await interaction.options.getString('all-owner-roles');
		const embeds = [];
		const content = 'Updating the all owner roles config for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		try {
			config.all_owner_roles = all_owner_roles;
			await config.set();
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: All owner roles updated.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the all owners role config.',
			});
			logMessage(config.server_id, 'ERROR', 'There was a problem updating the all owners role config.');
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}