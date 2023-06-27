import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('view-asa-roles')
	.setDescription('View a list of roles given based on the quantity of other ASAs held.');

export async function execute(interaction, config) {
	const content = 'Viewing the asa roles for ' + config.collection_name + '.';
	let embeds = [];
	await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
	const db = await db_functions.dbOpen();
	const colourGreen = parseInt(Green);
	const colourRed = parseInt(Red);
	let rows = 0;
	let description = '';
	const title = 'ASA Roles';

	const sql = 'SELECT * FROM asaroles ORDER BY asa_name ASC, role_name ASC, asa_qty DESC';
	await db.each(sql, async (err, row) => {
		if (err) {
			console.log('[ERROR]: running sql. (' + sql + ').');
		}
		rows++;
		description = description + `**__${row.role_name}__**\n**${row.asa_name}** (${row.asa_id})\nThe quantity required for this role is **${row.asa_qty}**.\n \n `;
		embeds = [{
			type: 'rich',
			color: colourGreen,
			title: title,
			description: description,
			footer: {
				text: '👣 footprint bots',
			},
		}];
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
	});

	if (rows == 0) {
		embeds.push({
			type: 'rich',
			color: colourRed,
			title: title,
			description: 'There are no ASA roles configured in ' + config.collection_name + '.',
		});
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
	}
}