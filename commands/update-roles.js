const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('update-roles')
		.setDescription('Update your owner roles. This should be run after buying or selling NFTs related to this project.'),

	async execute(interaction) {
		await interaction.reply('/update-roles is not yet implimented!!');
	},
};