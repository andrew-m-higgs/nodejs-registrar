import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import { logMessage } from '../helpers/admin.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-creator-wallets')
	.setDescription('Config the creator wallets for this project.')
	.addStringOption(option =>
		option
			.setName('creator_wallets')
			.setDescription('A comma seperated list of creator wallets.')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const wallet_strings = await interaction.options.getString('creator_wallets');
		const embeds = [];
		const content = 'Updating Creator Wallets for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		try {
			config.wallet_strings = wallet_strings.split(',');
			await config.set();
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: Creator wallets updated.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the creator wallets.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			logMessage(config.server_id, 'ERROR', 'There was a problem updating the creator wallets.');
		}

	} else {
		await interaction.reply(NoPermission);
	}
}