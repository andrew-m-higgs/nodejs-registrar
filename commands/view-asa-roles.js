import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import { ASA } from '../classes/asa.js';
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

	const sql = 'SELECT * FROM asaroles ORDER BY role_name COLLATE NOCASE ASC, role_qty DESC';
	await db.each(sql, async (error, row) => {
		if (error) {
			console.log('[ERROR]: running sql. (' + sql + ').');
		}
		rows++;
		const asa_array = row.asa_ids.split(',');
		const asas = [];
		for (const asa_id of asa_array) {
			const asa = new ASA(asa_id);
			await asa.get();
			asas.push(`${asa.asa_name}#$#${asa.asa_id}`);
		}
		description = description + `**__${row.role_name}__**\n`;
		for (const line of asas) {
			const asa_info = line.split('#$#');
			description += `🔸**${asa_info[0]}** (${asa_info[1]}).\n`;
		}
		description += `\t**Qty:** ${row.role_qty}.\n\n`;
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