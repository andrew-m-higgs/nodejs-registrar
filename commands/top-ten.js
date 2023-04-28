import { SlashCommandBuilder } from 'discord.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';

export const data = new SlashCommandBuilder()
	.setName('top-ten')
	.setDescription('View a list of the top ten registered holders.');

export async function execute(interaction, config) {
	const embeds = [];
	const fields = [];

	const db = await db_functions.dbOpen();
	const sql = 'SELECT nickname, numnfts FROM members ORDER BY numnfts DESC, nickname ASC LIMIT 10';
	let num = 0;
	let leaderstr = '';
	let haveleader = false;
	let fieldstr = '';
	let leadqty = 0;
	await db.each(sql, async (err, row) => {
		num++;
		let numstr = '';
		let qtystr = '';
		let namestr = '';
		namestr = '';
		if (err) {
			console.log('[ERROR]: running sql. (' + sql + ').' + config.collection_name);
		} else {
			// Fix the width of top ten position
			if (num < 10) {
				numstr = ' ' + num.toString();
			} else {
				numstr = num.toString();
			}
			// Fix the width of numnfts
			switch (row.numnfts.toString().length) {
			case 2:
				qtystr = ' ' + row.numnfts.toString();
				break;
			case 1:
				qtystr = '  ' + row.numnfts.toString();
				break;
			default:
				qtystr = row.numnfts.toString();
				break;
			}
			// Fix thie width of nickname
			if (row.nickname.length > 19) {
				namestr = row.nickname.slice(0, 17) + '...';
			} else if (row.nickname.length == 19) {
				namestr = row.nickname;
			} else {
				namestr = row.nickname;
				for (let i = row.nickname.length; i < 20; i++) {
					namestr += ' ';
				}
			}
			if (!haveleader) {
				if (leadqty < row.numnfts) {
					leadqty = row.numnfts;
					leaderstr += '' + numstr + ': ' + namestr + ' : ' + qtystr + '\n';
				} else if (leadqty == row.numnfts) {
					leaderstr += '' + numstr + ': ' + namestr + ' : ' + qtystr + '\n';
				} else {
					fieldstr += '' + numstr + ': ' + namestr + ' : ' + qtystr + '\n';
					haveleader = true;
				}
			} else {
				fieldstr += '' + numstr + ': ' + namestr + ' : ' + qtystr + '\n';
			}
		}
	});
	fields.push('```' + leaderstr + '```');
	fields.push('```' + fieldstr + '```');
	embeds.push({
		type: 'rich',
		color: 0x8261FE,
		title: 'Top Ten Holders',
		description: 'The Top Ten registered holders.\n\n' + fields.join('\n'),
	});
	await interaction.reply({ embeds: embeds });
}