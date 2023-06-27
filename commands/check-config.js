import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import 'dotenv/config';

const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('check-config')
	.setDescription('Check the status of you config.');

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	if (isAdmin) {
		await interaction.reply({ content: 'Checking your configuration.', ephemeral: true });
		const embeds = [];
		let all_owner_roles = 'False';
		if (config.all_owner_roles == 0) {
			all_owner_roles = 'True';
		}
		const embed_details = [
			{
				title: config.collection_name,
				field: 'Collection Name',
				command: '/config-collection-name',
			},
			{
				title: config.wallet_strings,
				field: 'Creator Wallets',
				command: '/config-creator-wallets',
			},
			{
				title: config.secondary,
				field: 'Secondary Link',
				command: '/config-secondary',
			},
			{
				title: config.admin_role_name,
				field: 'Admin Role',
				command: '/config-admin-role',
			},
			{
				title: config.registered_role_name,
				field: 'Registered Role',
				command: '/config-registered-role',
			},
			{
				title: all_owner_roles,
				field: 'Give all owner roles for which the member qualifies',
				command: '/config-all-owner-roles',
			},
			{
				title: `${config.optin_token}\nMinutes: ${config.optin_tx_timeout}\nLink: https://algoxnft.com/asset/${config.optin_token}`,
				field: 'Optin Token',
				command: '/config-optin-token',
			},
		];
		for (let i = 0; i < embed_details.length; i++) {
			let colour = 0xFF9900;
			if (embed_details[i].title == '') {
				colour = parseInt(Red);
			} else {
				colour = parseInt(Green);
			}
			const title = embed_details[i].title;
			const field = embed_details[i].field;
			const command = embed_details[i].command;
			embeds.push({
				type: 'rich',
				color: colour,
				description: `${field}:\n**${title}**`,
				footer: {
					text: `Change this using the ${command} command`,
				},
			});
		}
		console.log(JSON.stringify(embeds));
		await interaction.editReply({ content: 'Checking your configuration.', embeds: embeds, ephemeral: true });
	} else {
		await interaction.reply(NoPermission);
	}
}
