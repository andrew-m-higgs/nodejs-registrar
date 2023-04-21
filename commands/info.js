import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const Green = process.env.Green;
const Red = process.env.Red;


export const data = new SlashCommandBuilder()
	.setName('info')
	.setDescription('Get some information about the project.');

export async function execute(interaction, config) {
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
}