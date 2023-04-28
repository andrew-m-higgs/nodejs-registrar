import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('update-roles')
	.setDescription('Update your owner roles. This should be run after buying or selling NFTs related to this project.');

export async function execute(interaction, config) {
	const isRegistered = await functions.isRegistered(interaction, config);
	const nickname = interaction.member.user.username;
	const content = `${nickname}, we are attempting to update your roles`;
	const embeds = [];
	if (isRegistered) {
		const member_id = interaction.user.id;
		const db = await db_functions.dbOpen();
		const row = await db.get('SELECT wallet_string FROM members WHERE member_id = "' + member_id + '"');
		const wallet_string = row.wallet_string;
		await interaction.reply({ content: content, ephemeral: true });
		functions.updateRoles(interaction, config, nickname, wallet_string, member_id, content, 'UPDATE');
	} else {
		// Need to register to flex
		const message = 'You are not registered. Please run /register to register your wallet.';
		const colour = parseInt(Red);
		embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
	}
}