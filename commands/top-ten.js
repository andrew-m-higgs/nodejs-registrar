import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';

export const data = new SlashCommandBuilder()
	.setName('top-ten')
	.setDescription('View a list of the top ten registered holders.');

export async function execute(interaction, config) {
	const embeds = [];
	const fields = [];
	let first = true;

	const db = await db_functions.dbOpen();
	const sql = 'SELECT nickname, numnfts FROM members ORDER BY numnfts DESC LIMIT 10';
	await db.each(sql, async (err, row) => {
		if (err) {
			console.log('[ERROR]: running sql. (' + sql + ').' + config.collection_name);
		} else if (first) {
			fields.push(`**__${row.numnfts} : ${row.nickname}__**`);
			first = false;
		} else {
			fields.push(`${row.numnfts} : ${row.nickname}`);
		}
	});
	embeds.push({
		type: 'rich',
		color: 0x8261FE,
		title: 'Top Ten Holders',
		description: 'The Top Ten registered holders.\n\n' + fields.join('\n'),
	});
	await interaction.reply({ embeds: embeds });
}