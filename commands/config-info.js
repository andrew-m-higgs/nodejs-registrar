import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-info')
	.setDescription('Config info this project. The Key Value pairs set up here will be displayed when running /info.')
	.addStringOption(option =>
		option
			.setName('key')
			.setDescription('The key will be used as the title.')
			.setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('value')
			.setDescription('The value will be the description.')
			.setRequired(true),
	);


export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const key = await interaction.options.getString('key');
		const value = await interaction.options.getString('value');
		const embeds = [];
		const content = 'Updating the info for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `INSERT INTO info(key, value) VALUES("${key}", "${value}") ON CONFLICT(key) DO UPDATE SET value = "${value}";`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The info has been updated. Run /info to check them.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the info.',
			});
			console.log(sql);
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}