const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');
const { NoPermission, Green, Red } = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('check')
		.setDescription('Check if roles are correct for the given registered member.'),

	async execute(interaction, config) {
		const isAdmin = await functions.isAdmin(interaction, config);
		const colourRed = parseInt(Red);
		const colourGreen = parseInt(Green);
		let message = '';
		let colour = 0xFF9900;
		const content = 'Getting a list of registered members.';
		const embeds = [];
		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

		if (isAdmin) {
			// Is an admin or owner
			const sql = 'SELECT nickname, wallet_string, member_id FROM members ORDER BY nickname ASC';
			const db = await db_functions.dbOpen();

			try {
				const options = [];
				let rows = 0;
				await db.each(sql, async (err, row) => {
					rows++;
					if (err) {
						console.log('[ERROR]: running sql. (' + sql + ').');
					}
					const new_opt = {
						label: `${row.nickname}`,
						value: `${row.nickname}^*^*^${row.wallet_string}^*^*^${row.member_id}`,
					};
					options.push(new_opt);
				});

				message = 'You have ' + rows + ' members to choose from.';
				colour = colourGreen;
				embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
				const components = new ActionRowBuilder()
					.addComponents(
						new StringSelectMenuBuilder()
							.setCustomId('check_select')
							.setPlaceholder('Choose an NFT')
							.addOptions(options),
					);
				await interaction.editReply({ content: content, embeds: embeds, components: [components], ephemeral: true });
			} catch {
				console.log('[ERROR]: There seem to be no members to check.');
				message = ':no_entry: There seem to be no members to check.';
				colour = colourRed;
				embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
				await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
			}
		} else {
			await interaction.reply(NoPermission);
		}
	},
};