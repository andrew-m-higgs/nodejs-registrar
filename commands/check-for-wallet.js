import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('check-for-wallet')
	.setDescription('Check if wallet address exists in DB.')
	.addNumberOption(option =>
		option
			.setName('search_type')
			.setDescription('Give a match type for the provided search string.')
			.setRequired(true)
			.addChoices(
				{ name: 'Starts with', value: 0 },
				{ name: 'Ends with', value: 1 },
				{ name: 'Contains', value: 2 },
				{ name: 'Is', value: 3 },
			),
	)
	.addStringOption(option =>
		option
			.setName('search_string')
			.setDescription('The seacrh string to match the wallet against.')
			.setRequired(true)
			.setMinLength(3)
			.setMaxLength(58),
	);


export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);
	let message = '';
	let colour = 0xFF9900;
	const content = 'Getting a list of wallets which match your search criteria.';
	const embeds = [];
	let search_string = await interaction.options.getString('search_string');
	const search_type = await interaction.options.getNumber('search_type');

	switch (search_type) {
	case 0:
		search_string = search_string + '%';
		break;
	case 1:
		search_string = '%' + search_string;
		break;
	case 2:
		search_string = '%' + search_string + '%';
		break;
	default:
		break;
	}

	await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

	if (isAdmin) {
		// Is an admin or owner
		const sql = 'SELECT nickname, wallet_string, member_id FROM members WHERE wallet_string LIKE "' + search_string + '" ORDER BY nickname COLLATE NOCASE ASC';
		const db = await db_functions.dbOpen();

		try {
			let content_string = '';
			let rows = 0;
			await db.each(sql, async (err, row) => {
				rows++;
				if (err) {
					console.log('[ERROR]: running sql. (' + sql + ').');
				}
				content_string += '**' + row.wallet_string + '**\n' + row.nickname + '\n\n';
			});

			message = 'You have ' + rows + ' matching wallets.\n\n';
			console.log('Message: ' + message);
			console.log('Content: ' + content_string);
			colour = colourGreen;
			embeds.push({
				type: 'rich',
				description: content_string,
				color: colour,
			});

			await interaction.editReply({
				content: message,
				embeds: embeds,
				ephemeral: true,
			});
		} catch {
			console.log('[ERROR]: There seem to be no wallets which match.');
			message = ':no_entry: There seem to be no wallets which match.';
			colour = colourRed;
			// embeds.push({ 'type': 'rich', 'description': message, 'color': colour });
			await interaction.editReply({ content: message, ephemeral: true });
		}
	} else {
		await interaction.reply(NoPermission);
	}
}