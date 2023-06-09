import { SlashCommandBuilder } from 'discord.js';
import { displayOptinButton } from '../helpers/functions.js';
import * as functions from '../helpers/functions.js';

export const data = new SlashCommandBuilder()
	.setName('register')
	.setDescription('Register your wallet and get roles based on ownership.')
	.addStringOption(option =>
		option
			.setName('wallet')
			.setDescription('The wallet address you wish to register')
			.setRequired(true),
	);

export async function execute(interaction, config) {
	// interaction.guild is the object representing the Guild in which the command was run
	const wallet_string = await interaction.options.getString('wallet');
	const nickname = interaction.member.user.username;
	const content = `${nickname}, we are attempting to register your **wallet**: ${wallet_string}.`;
	const member_id = interaction.user.id;
	await interaction.reply({ content: content, ephemeral: true });

	const isOptedIn = await functions.isOptedIn(interaction, config, wallet_string);
	if (isOptedIn) {
		functions.updateRoles(interaction, config, nickname, wallet_string, member_id, content, 'UPDATE');
	} else {
		displayOptinButton(interaction, config, content);
	}
}
