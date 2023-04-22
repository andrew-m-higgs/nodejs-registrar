import { SlashCommandBuilder, StringSelectMenuOptionBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const Green = process.env.Green;
const Red = process.env.Red;

// ToDo: Respond better to a registered wallet which has no NFTs and attempts to flex

export const data = new SlashCommandBuilder()
	.setName('flex')
	.setDescription('Flex an NFT you own from the collection.');

export async function execute(interaction, config) {
	const content = 'Flexing an NFT you own from the collection.';
	const embeds = [];
	await interaction.reply({ content: content, embeds: embeds, ephemeral: true });

	// Check if member is registered
	// const member = await interaction.guild.members.fetch(interaction.user.id);
	// await functions.getMember(interaction);
	let message = '';
	let colour = 0xFF9900;

	const isRegistered = await functions.isRegistered(interaction, config);
	if (isRegistered) {
		// We can attempt to flex
		message = ':white_check_mark: You are registered.';
		colour = parseInt(Green);
		embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		const sql = 'SELECT asset_ids FROM members WHERE member_id = ' + interaction.user.id;
		let assets = [];
		const db = await db_functions.dbOpen();
		const row = await db.get(sql);

		try {
			assets = row.asset_ids.split(',');
			assets.sort();

			if (assets.length > 0) {
				// Have assets to flex
				// Add select menu options
				const options = [];
				for (let i = 0; i < assets.length; i++) {
					const nft = await functions.getNFT(assets[i]);
					const new_opt = new StringSelectMenuOptionBuilder()
						.setLabel(`${nft.name}`)
						.setValue(`${nft.asset_id}`);
					// };
					options.push(new_opt);
				}
				message = 'You have ' + assets.length + ' assets to choose from.';
				colour = parseInt(Green);
				embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
				let page = 0;
				await interaction.editReply({
					content: content,
					embeds: embeds,
					components: functions.getComponents(page, options),
					ephemeral: true,
				});
				const msg = await interaction.fetchReply();
				const buttonListener = async (buttonInteraction) => {
					if (!buttonInteraction.isButton()) return;
					if (buttonInteraction.message.id != msg.id) return;

					switch (buttonInteraction.customId) {
					case 'previous_page':
						page--;
						break;
					case 'next_page':
						page++;
						break;
					case 'rand_flex':
						functions.flexAsset(interaction, config, await functions.getNFT(assets[Math.round(Math.random() * assets.length)]), 'OWN');
						break;
					}

					await buttonInteraction.update({
						content: content,
						embeds: embeds,
						components: functions.getComponents(page, options),
					});
				};
				interaction.client.on('interactionCreate', buttonListener);
			}
		} catch {
			console.log('[ERROR]: There seem to be no assets to flex.');
			message = ':no_entry: There seem to be no assets to flex.';
			colour = parseInt(Red);
			embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}
	} else {
		// Need to register to flex
		message = 'You are not registered. Please run /register to register your wallet.';
		colour = parseInt(Red);
		embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
		await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
	}
}