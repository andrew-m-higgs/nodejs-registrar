import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';
import { deployCommands } from '../helpers/admin.js';
import 'dotenv/config';
const admin_guildId = process.env.admin_guildId;

export async function doFlexSelect(interaction, config) {
	const selected = interaction.values[0];
	const db = await db_functions.dbOpen();
	const sql = 'SELECT * FROM assets WHERE asset_id = ' + selected;
	const flexAsset = await db.get(sql);
	await interaction.reply('Flexing one of your NFTs from ' + config.collection_name + '.');
	functions.flexAsset(interaction, config, flexAsset, 'OWN');
}

// Check the roles assigned to a member and compare to the assets they have
export async function doCheckSelect(interaction, config) {
	const member_id = interaction.values[0];
	const db = await db_functions.dbOpen();
	const sql = 'SELECT nickname, wallet_string FROM members WHERE member_id = ' + member_id;
	const member = await db.get(sql);
	const nickname = member.nickname;
	const wallet_string = member.wallet_string;
	// const db = await db_functions.dbOpen();
	// const sql = 'SELECT * FROM assets WHERE asset_id = ' + selected;
	// const flexAsset = await db.get(sql);
	const content = 'Checking member with wallet ' + wallet_string + '.';
	await interaction.reply({ content: content, ephemeral: true });
	functions.updateRoles(interaction, config, nickname, wallet_string, member_id, content, 'CHECK');
}

export async function doDeployCommands(interaction) {
	if (interaction.guild.id == admin_guildId) {
		// Deploy commands to a given server ID
		const server_id = interaction.values[0];
		const content = 'Deploying commands to ' + server_id + '.';
		await interaction.reply({ content: content, ephemeral: true });
		await deployCommands(['commands'], server_id, interaction);
	}
}