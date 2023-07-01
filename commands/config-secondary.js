import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import { logMessage } from '../helpers/admin.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-secondary')
	.setDescription('Config the secondary link for this project.')
	.addStringOption(option =>
		option
			.setName('secondary')
			.setDescription('The secondary link for this project.')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const secondary = await interaction.options.getString('secondary');
		const embeds = [];
		const content = 'Updating the secondary link for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		try {
			config.secondary = secondary;
			await config.set();
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: Secondary link updated.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the secondary link.',
			});
			logMessage(config.server_id, 'ERROR', 'There was a problem updating the secondary link.');
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}