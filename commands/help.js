const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Tries to assist in understanding what the different commands do.'),

	async execute(interaction, config) {
		const fields = [
			{
				value: '/register',
				name: 'Register a wallet which is used by the project to determine the roles you receive based on the NFTs you hold from ' + config.collection_name + '.',
			},
			{
				value: '/update-roles',
				name: '**NOT YET**: Used to confirm that your roles are still correct. Typically used after buying or selling NFTs from ' + config.collection_name + '.',
			},
			{
				value: '/view-owner-roles',
				name: 'View a list of owner roles you can achieve in ' + config.collection_name + '.',
			},
			{
				value: '/flex',
				name: 'Flex your favourite NFT from ' + config.collection_name + '.',
			},
			{
				value: '/flex-random',
				name: 'Flex a random NFT from ' + config.collection_name + '.',
			},
			{
				value: '/info',
				name: 'Show some information about the server and project.',
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
	},
};