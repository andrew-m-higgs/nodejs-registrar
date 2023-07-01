import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;
const admin_guildId = process.env.admin_guildId;

export const data = new SlashCommandBuilder()
	.setName('deploy-commands')
	.setDescription('Deploy bot commands to a server.');

export async function execute(interaction, config) {
	if (config.server_id == admin_guildId) {
		const isOwner = await functions.isOwner(interaction);
		const colourRed = parseInt(Red);
		const colourGreen = parseInt(Green);
		let message = '';
		let colour = 0xFF9900;
		const content = 'Getting a list of servers.';
		const embeds = [];
		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

		if (isOwner) {
			// Is an admin or owner
			const sql = 'SELECT collection_name, server_id FROM config ORDER BY collection_name COLLATE NOCASE ASC';
			const db = await db_functions.dbOpen();

			try {
				const options = [];
				let rows = 0;
				await db.each(sql, async (err, row) => {
					rows++;
					if (err) {
						console.log('[ERROR]: running sql. (' + sql + ').');
					}
					const new_opt = {
						label: `${row.collection_name}`,
						value: `${row.server_id}`,
					};
					options.push(new_opt);
				});

				message = 'You have ' + rows + ' servers to choose from.';
				colour = colourGreen;
				embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
				let page = 0;
				await interaction.editReply({
					content: content,
					embeds: embeds,
					components: functions.getComponents(page, options, 'deploy_select', false),
					ephemeral: true,
				});
				const msg = await interaction.fetchReply();
				const buttonListener = async (buttonInteraction) => {
					if (!buttonInteraction.isButton()) return;
					if (buttonInteraction.message.id != msg.id) return;

					switch (buttonInteraction.customId) {
					case 'previous_page':
						page--;
						break;
					case 'next_page':
						page++;
						break;
					}

					await buttonInteraction.update({
						content: content,
						embeds: embeds,
						components: functions.getComponents(page, options, 'deploy_select', false),
					});
				};
				interaction.client.on('interactionCreate', buttonListener);
			} catch (error) {
				console.log('ERROR: There seem to be no servers to deploy to.');
				console.log('ERROR: ' + error.message);
				message = ':no_entry: There seem to be no servers to deploy to.';
				colour = colourRed;
				embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}
		} else {
			await interaction.reply(NoPermission);
		}
	} else {
		await interaction.reply(NoPermission);
	}
}