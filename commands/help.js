import { SlashCommandBuilder } from 'discord.js';


export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Tries to assist in understanding what the different commands do.');

export async function execute(interaction, config) {
	const fields = [
		{
			name: '/register',
			value: 'Register a wallet which is used by the project to determine the roles you receive based on the NFTs you hold from ' + config.collection_name + '.',
		},
		{
			name: '/update-roles',
			value: 'Used to confirm that your roles are still correct. Typically used after buying or selling NFTs from ' + config.collection_name + '.',
		},
		{
			name: '/view-owner-roles',
			value: 'View a list of owner roles you can achieve in ' + config.collection_name + '.',
		},
		{
			name: '/view-asa-roles',
			value: 'View a list of roles you can achieve based on ASA ID ownership.',
		},
		{
			name: '/flex',
			value: 'Flex your favourite NFT from ' + config.collection_name + '.',
		},
		{
			name: '/flex-random',
			value: 'Flex a random NFT from ' + config.collection_name + '.',
		},
		{
			name: '/info',
			value: 'Show some information about the server and project.',
		},
		{
			name: '/ping',
			value: 'Simple way to confirm Bot is running.',
		},
	];
	const embed = [{
		type: 'rich',
		color: 0xFF9900,
		title: 'Command help.',
		description: 'Some basic help with the commands available on this server.',
		fields: fields,
		footer: { text: 'Brought to you by Footprint 👣' },
	}];
	await interaction.reply({ content: 'Basic command usage.', embeds: embed, ephemeral: true });
}