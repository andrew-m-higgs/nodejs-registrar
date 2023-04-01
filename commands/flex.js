const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const functions = require('../helpers/functions.js');
const db_functions = require('../helpers/db-functions.js');
const { Green, Red } = require('../config.json');

// ToDo: Respond better to a registered wallet which has no NFTs and attempts to flex

module.exports = {

	data: new SlashCommandBuilder()
		.setName('flex')
		.setDescription('Flex an NFT you own from the collection.'),
	async execute(interaction, config) {
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

				if (assets.length > 0) {
					// Have assets to flex
					// Add select menu options
					const options = [];
					for (let i = 0; i < assets.length; i++) {
						const nft = await functions.getNFT(assets[i]);
						const new_opt = {
							label: `${nft.name}`,
							value: `${nft.asset_id}`,
						};
						options.push(new_opt);
					}
					message = 'You have ' + assets.length + ' assets to choose from.';
					colour = parseInt(Green);
					embeds.push({ 'type': 'rich', 'title': message, 'color': colour });
					const components = new ActionRowBuilder()
						.addComponents(
							new StringSelectMenuBuilder()
								.setCustomId('flex_select')
								.setPlaceholder('Choose an NFT')
								.addOptions(options),
						);
					await interaction.editReply({ content: content, embeds: embeds, components: [components], ephemeral: true });
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
	},
};