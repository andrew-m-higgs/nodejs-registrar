import { SlashCommandBuilder } from 'discord.js';
import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import 'dotenv/config';
const NoPermission = process.env.NoPermission;
const Green = process.env.Green;
const Red = process.env.Red;

export const data = new SlashCommandBuilder()
	.setName('config-owner-roles')
	.setDescription('Config the owner roles given based on number of NFTs owned from this project.')
	.addRoleOption(option =>
		option
			.setName('owner-role')
			.setDescription('The role which will be given.')
			.setRequired(true),
	)
	.addNumberOption(option =>
		option
			.setName('num-nfts')
			.setDescription('The minimum required number of NFTs to get this role.')
			.setRequired(true),
	);


export async function execute(interaction, config) {
	const isAdmin = await functions.isAdmin(interaction, config);
	const colourRed = parseInt(Red);
	const colourGreen = parseInt(Green);

	if (isAdmin) {
		const owner_role = await interaction.options.getRole('owner-role');
		const num_nfts = await interaction.options.getNumber('num-nfts');
		const embeds = [];
		const content = 'Updating the owner roles for this project.';

		await interaction.reply({ content: content, embeds: embeds, ephemeral: true });
		const sql = `INSERT INTO roles(role_id, role_name, numnfts) VALUES("${owner_role.id}", "${owner_role.name}", ${num_nfts}) ON CONFLICT(role_id) DO UPDATE SET role_name = "${owner_role.name}", numnfts = ${num_nfts};`;
		try {
			const db = await db_functions.dbOpen();
			await db.run(sql);
			embeds.push({
				type: 'rich',
				color: colourGreen,
				title: ':white_check_mark: The owner roles have been updated. Run /view-owner-roles to check them.',
			});

			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		} catch {
			embeds.push({
				type: 'rich',
				color: colourRed,
				title: ':no_entry: There was a problem updating the owner roles.',
			});
			await interaction.editReply({ content: content, embeds: embeds, ephemeral: true });
		}

	} else {
		await interaction.reply(NoPermission);
	}
}