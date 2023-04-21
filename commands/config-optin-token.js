import { SlashCommandBuilder } from 'discord.js' ;
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-optin-token')
	.setDescription('Config the optin token ASA for this project.')
	.addStringOption(option =>
		option
			.setName('optin-token')
			.setDescription('The optin token ASA for this project.')
			.setRequired(true),
	)
	.addNumberOption(option =>
		option
			.setName('tx-timeout')
			.setDescription('How recently should the transaction on this token be. In minutes.')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const optin_token = await interaction.options.getString('optin-token');
		const tx_timeout = await interaction.options.getNumber('tx-timeout');
		const embeds = [];
		const content = 'Updating the Optin Token ASA for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `UPDATE config SET optin_asa_id = "${optin_token}", optin_tx_timeout = ${tx_timeout};`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: Optin token ASA updated.',
			});

			// Update the config variable
			config.optin_token = optin_token;
			config.optin_tx_timeout = tx_timeout;

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the optin token ASA.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}