const { SlashCommandBuilder } = require('discord.js');
// const sqlite3 = require('sqlite3').verbose();
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');

// ToDo: Check if 0 creator assets before flexing random.

module.exports = {

	data: new SlashCommandBuilder()
		.setName('flex-random')
		.setDescription('Flex a random NFT from the collection.'),
	async execute(interaction, config) {
		await interaction.reply('Flexing a random NFT from the collection.');

		const db = await db_functions.dbOpen();

		const sql = 'SELECT * FROM assets ORDER BY RANDOM() LIMIT 1';
		const flexAsset = await db.get(sql);
		console.log('SQL: ' + sql);

		functions.flexAsset(interaction, config, flexAsset, 'RANDOM');
	},
};
