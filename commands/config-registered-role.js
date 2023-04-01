const { SlashCommandBuilder } = require('discord.js');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');
const { NoPermission, Green, Red } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config-registered-role')
		.setDescription('Config the registered role for this project.')
		.addRoleOption(option =>
			option
				.setName('registered-role')
				.setDescription('The role given to members who register a wallet for this project.')
				.setRequired(true),
		),


	async execute(interaction, config) {
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
			const sql = `UPDATE config SET registered_role_id = "${registered_role.id}", registered_role_name = "${registered_role.name}";`;
			try {
				const db = await db_functions.dbOpen();
				await db.run(sql);
				embeds.push({
					type: 'rich',
					color: colourGreen,
					title: ':white_check_mark: The registered role has been updated.',
				});

				// Update the config variable
				config.registered_role_id = registered_role.id;
				config.registered_role_name = registered_role.name;

				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			} catch {
				embeds.push({
					type: 'rich',
					color: colourRed,
					title: ':no_entry: There was a problem updating the registered role.',
				});
				console.log(sql);
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}

		} else {
			await interaction.reply(NoPermission);
		}
	},
};