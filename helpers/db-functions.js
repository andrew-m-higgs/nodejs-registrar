const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { dbFile } = require('../config.json');

const sqlCreateMembers = 'CREATE TABLE members(member_id text PRIMARY KEY, nickname text, wallet_string text, asset_ids text, numnfts integer);';
const sqlCreateAssets = 'CREATE TABLE assets(asset_id integer PRIMARY KEY, name text, ipfs text, qty integer);';
const sqlCreateRoles = 'CREATE TABLE roles(role_id text PRIMARY KEY, role_name text, numnfts integer);';
const sqlCreateInfo = 'CREATE TABLE info(key text PRIMARY KEY, value text);';
const sqlCreateConfig = 'CREATE TABLE config(collection_name text, wallet_strings text, secondary text, admin_role_id text, admin_role_name text, registered_role_id text, registered_role_name text, optin_asa_id text);';
const sqlInsertConfig = 'INSERT INTO config(collection_name, wallet_strings, secondary, admin_role_id, admin_role_name, registered_role_id, registered_role_name, optin_asa_id) VALUES("", "", "", "", "", "", "", "");';

async function doDBOpen() {
	const { open } = require('sqlite');
	return await open({
		filename: dbFile,
		driver: sqlite3.Database,
	});
}

module.exports = {
	async dbCheck() {
		// Check if dbFile exists return true if exists
		try {
			if (!fs.existsSync(dbFile)) {
				// Create the file and the DB
				const db = await doDBOpen();
				try {
					await db.run(sqlCreateMembers);
					await db.run(sqlCreateAssets);
					await db.run(sqlCreateRoles);
					await db.run(sqlCreateInfo);
					await db.run(sqlCreateConfig);
					await db.run(sqlInsertConfig);
					db.close();
					return true;
				} catch (err) {
					console.error('[ERROR]: ' + err.message);
					return false;
				}
			} else {
				// File does exist
				return true;
			}
		} catch (err) {
			console.error(err);
		}
		return false;
	},

	async dbOpen() {
		// Open the db using sqlite open for async
		return await doDBOpen();
	},
};
