import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';

// ToDo: Check if 0 creator assets before flexing random.

export const data = new SlashCommandBuilder()
	.setName('flex-random')
	.setDescription('Flex a random NFT from the collection.');

export async function execute(interaction, config) {
	await interaction.reply('Flexing a random NFT from the collection.');

	const db = await db_functions.dbOpen();

	const sql = 'SELECT * FROM assets ORDER BY RANDOM() LIMIT 1';
	const flexAsset = await db.get(sql);

	functions.flexAsset(interaction, config, flexAsset, 'RANDOM');
}
