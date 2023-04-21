import { SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('ping')
	.setDescription('Replies with Pong if Bot is ALIVE!');

export async function execute(interaction) {
	await interaction.reply('Pong! It\'s **ALIVE**!!');
}