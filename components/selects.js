import * as functions from '../helpers/functions.js';
import * as db_functions from '../helpers/db-functions.js';

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
	const selected = interaction.values[0].split('^*^*^');
	const nickname = selected[0];
	const wallet_string = selected[1];
	const member_id = selected[2];
	// const db = await db_functions.dbOpen();
	// const sql = 'SELECT * FROM assets WHERE asset_id = ' + selected;
	// const flexAsset = await db.get(sql);
	const content = 'Checking member with wallet ' + wallet_string + '.';
	await interaction.reply({ content: content, ephemeral: true });
	functions.updateRoles(interaction, config, nickname, wallet_string, member_id, content, 'CHECK');
}