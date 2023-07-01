import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import { logMessage } from '../helpers/admin.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-registered-role')
	.setDescription('Config the registered role for this project.')
	.addRoleOption(option =>
		option
			.setName('registered-role')
			.setDescription('The role given to members who register a wallet for this project.')
			.setRequired(true),
	);


export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const registered_role = await interaction.options.getRole('registered-role');
		console.log('ID: ' + registered_role.id);
		console.log('Name: ' + registered_role.name);
		const embeds = [];
		const content = 'Updating the registered role for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		try {
			config.registered_role_id = registered_role.id;
			config.registered_role_name = registered_role.name;
			await config.set();
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The registered role has been updated.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the registered role.',
			});
			logMessage(config.server_id, 'ERROR', 'There was a problem updating the registered role.');
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}