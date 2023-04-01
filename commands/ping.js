const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong if Bot is ALIVE!'),

	async execute(interaction) {
		await interaction.reply('Pong! It\'s **ALIVE**!!');
	},
};