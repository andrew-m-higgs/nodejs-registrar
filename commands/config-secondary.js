const { SlashCommandBuilder } = require('discord.js');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');
const { NoPermission, Green, Red } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('config-secondary')
		.setDescription('Config the secondary link for this project.')
		.addStringOption(option =>
			option
				.setName('secondary')
				.setDescription('The secondary link for this project.')
				.setRequired(true),
		),

	async execute(interaction, config) {
		const isAdmin = await functions.isAdmin(interaction, config);
		const colourRed = parseInt(Red);
		const colourGreen = parseInt(Green);

		if (isAdmin) {
			const secondary = await interaction.options.getString('secondary');
			const embeds = [];
			const content = 'Updating the secondary link for this project.';

			await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
			const sql = `UPDATE config SET secondary = "${secondary}";`;
			try {
				const db = await db_functions.dbOpen();
				await db.run(sql);
				embeds.push({
					type: 'rich',
					color: colourGreen,
					title: ':white_check_mark: Secondary link updated.',
				});

				// Update the config variable
				config.secondary = secondary;

				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			} catch {
				embeds.push({
					type: 'rich',
					color: colourRed,
					title: ':no_entry: There was a problem updating the secondary link.',
				});
				console.log(sql);
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}

		} else {
			await interaction.reply(NoPermission);
		}
	},
};