const { SlashCommandBuilder } = require('discord.js');
const db_functions = require('../helpers/db-functions.js');
const { Green, Red } = require('../config.json');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Get some information about the project.'),

	async execute(interaction, config) {
		const colourGreen = parseInt(Green);
		const colourRed = parseInt(Red);
		const fields = [];
		const db = await db_functions.dbOpen();
		const sql = 'SELECT * FROM info ORDER BY key ASC';
		await db.each(sql, (err, row) => {
			if (err) {
				console.log('[ERROR]: There was an error attempting to get data from info table.');
			} else {
				const new_field = {
					name: `${row.key}`,
					value: `${row.value}`,
				};
				fields.push(new_field);
			}
		});

		if (fields.length > 0) {
			await interaction.reply({
				embeds: [{
					color: colourGreen,
					title: `Info about ${config.collection_name}.`,
					fields: fields,
					footer: {
						text: 'Brought to you by Footprint 👣',
					},
				}],
			});
		} else {
			await interaction.reply({
				embeds: [{
					color: colourRed,
					title: `There seems to be no info configured for ${config.collection_name}.`,
					footer: {
						text: 'Brought to you by Footprint 👣',
					},
				}],
			});
		}
	},
};