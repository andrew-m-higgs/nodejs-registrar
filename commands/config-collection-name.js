import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-collection-name')
	.setDescription('Config the collection name for this project.')
	.addStringOption(option =>
		option
			.setName('collection_name')
			.setDescription('The collection name to be used for this project.')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const collection_name = await interaction.options.getString('collection_name');
		const embeds = [];
		const content = 'Updating Collection Name for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `UPDATE config SET collection_name = "${collection_name}";`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: Collection name updated.',
			});

			// Update the config variable
			config.collection_name = collection_name;

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the collection name.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}