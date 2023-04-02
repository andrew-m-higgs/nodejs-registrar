const { SlashCommandBuilder } = require('discord.js');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('update-roles')
		.setDescription('Update your owner roles. This should be run after buying or selling NFTs related to this project.'),

	async execute(interaction, config) {
		const member_id = interaction.user.id;
		const db = await db_functions.dbOpen();
		const row = await db.get('SELECT wallet_string FROM members WHERE member_id = "' + member_id + '"');
		const wallet_string = row.wallet_string;
		const nickname = interaction.member.user.username;
		const content = `${nickname}, we are attempting to update your roles`;
		await interaction.reply({ content: content, ephemeral: true });
		functions.updateRoles(interaction, config, nickname, wallet_string, member_id, content, 'UPDATE');
	},
};