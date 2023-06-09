import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;

export const data = new SlashCommandBuilder()
	.setName('help-admin')
	.setDescription('Tries to assist in understanding what the different commands do.');

export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	if (isAdmin) {
		const fields = [
			{
				name: '/config-creator-wallets',
				value: 'A comma seperated list of creator wallets which hold NFTs from this project.',
			},
			{
				name: '/config-collection-name',
				value: 'Set the collection name to be used by the Bot.',
			},
			{
				name: '/config-admin-role',
				value: 'The role assigned to members who are allowed to configure this Bot.',
			},
			{
				name: '/config-all-owner-roles',
				value: 'Set whether or not members get all the roles for which they qualify or just the highest one.',
			},
			{
				name: '/config-registered-role',
				value: 'The role given to all members who register a wallet in this project.',
			},
			{
				name: '/config-secondary',
				value: 'The link to this projects secondary sales market. Shown to members who register a wallet with no NFTs from this project.',
			},
			{
				name: '/config-optin-token',
				value: 'The token used to confirm ownership of the account being registered.',
			},
			{
				name: '/update-creator-ids',
				value: 'Run this command to add / update the NFTs for this project. This should be done after running /config-creator-wallets.',
			},
			{
				name: '/config-owner-roles',
				value: 'The roles given to members when they /register a wallet containing NFTs from this project.',
			},
			{
				name: '/config-asa-roles',
				value: 'The roles given to members who own certain ASA IDs and meet the quantities requirements.',
			},
			{
				name: '/check',
				value: 'Used to check anyone who has a registered wallet. This will run through and check owned assets and update roles if necessary.',
			},
			{
				name: '/check-config',
				value: 'Used to view the current configurtion of this project.',
			},
			{
				name: '/check-for-wallet',
				value: 'Used to search the database for a specific wallet address.',
			},
			{
				name: '/config-info',
				value: 'Add key value pairs to display when someone runs the /info command.',
			},
		];

		const embed = [{
			type: 'rich',
			color: 0xFF9900,
			title: 'Command help.',
			description: 'Some basic help with the admin commands available on this server.',
			fields: fields,
			footer: { text: 'Brought to you by Footprint 👣' },
		}];
		await interaction.reply({ content: 'Admin command usage.', embeds: embed, ephemeral: true });
	} else {
		await interaction.reply(NoPermission);
	}
}