import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;
const admin_guildId = process.env.admin_guildId;

export const data = new SlashCommandBuilder()
	.setName('add-server')
	.setDescription('Add a new server to the Bot.')
	.addStringOption(option =>
		option
			.setName('server_id')
			.setDescription('The new servers server_id.')
			.setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('server_name')
			.setDescription('The new servers name.')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	if (config.server_id == admin_guildId) {
		const isAdmin = await functions.isAdmin(interaction, config);
		const colourRed = parseInt(Red);
		const colourGreen = parseInt(Green);

		if (isAdmin) {
			const server_id = await interaction.options.getString('server_id');
			const server_name = await interaction.options.getString('server_name');
			const embeds = [];
			const content = 'Adding the new server.';

			await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
			const sql = `INSERT INTO config (server_id, collection_name, wallet_strings, secondary, admin_role_id, admin_role_name, registered_role_id, registered_role_name, all_owner_roles, optin_asa_id, optin_tx_timeout) VALUES("${server_id}", "${server_name}", "", "", "", "", "", "", "F", "", 3);`;
			try {
				const db = await db_functions.dbOpen();
				await db.run(sql);
				embeds.push({
					type: 'rich',
					color: colourGreen,
					title: ':white_check_mark: The server has been added.',
				});

				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			} catch {
				embeds.push({
					type: 'rich',
					color: colourRed,
					title: ':no_entry: There was a problem adding the new server.',
				});
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}

		} else {
			await interaction.reply(NoPermission);
		}
	} else {
		await interaction.reply(NoPermission);
	}
}