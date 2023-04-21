import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('view-owner-roles')
	.setDescription('View a list of owner roles given based on the number of NFTs held.');

export async function execute(interaction, config) {
	const content = 'Viewing the owner roles for ' + config.collection_name + '.';
	const embeds = [];
	await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
	const db = await db_functions.dbOpen();
	const colourGreen = parseInt(Green);
	const colourRed = parseInt(Red);
	let rows = 0;

	const sql = 'SELECT * FROM roles ORDER BY numnfts DESC';
	await db.each(sql, async (err, row) => {
		if (err) {
			console.log('[ERROR]: running sql. (' + sql + ').');
		}
		rows++;
		embeds.push({
			type: 'rich',
			color: colourGreen,
			title: `${row.role_name}`,
			description: `The number of NFTs required for this role is **${row.numnfts}**.`,
			footer: {
				text: `(ID: ${row.role_id})`,
			},
		});
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
	});

	if (rows == 0) {
		embeds.push({
			type: 'rich',
			color: colourRed,
			title: 'Owner Roles',
			description: 'There are no owner roles configured in ' + config.collection_name + '.',
		});
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
	}
}