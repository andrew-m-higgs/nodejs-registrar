import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
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
		const sql = `UPDATE config SET wallet_strings = "${wallet_strings}";`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: Creator wallets updated.',
			});

			// Update the config variable
			config.wallet_strings = wallet_strings.split(',');

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the creator wallets.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}