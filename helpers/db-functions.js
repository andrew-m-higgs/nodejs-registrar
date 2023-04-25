import fs from 'fs';
import sqlite3 from 'sqlite3';
import 'dotenv/config';

const sqlCreateMembers = 'CREATE TABLE members(member_id text PRIMARY KEY, nickname text, wallet_string text, asset_ids text, numnfts integer);';
const sqlCreateAssets = 'CREATE TABLE assets(asset_id integer PRIMARY KEY, name text, ipfs text, qty integer);';
const sqlCreateRoles = 'CREATE TABLE roles(role_id text PRIMARY KEY, role_name text, numnfts integer);';
const sqlCreateInfo = 'CREATE TABLE info(key text PRIMARY KEY, value text);';
const sqlCreateConfig = 'CREATE TABLE config(collection_name text, wallet_strings text, secondary text, admin_role_id text, admin_role_name text, registered_role_id text, registered_role_name text, all_owner_roles integer, optin_asa_id text, optin_tx_timeout integer);';
const sqlInsertConfig = 'INSERT INTO config(collection_name, wallet_strings, secondary, admin_role_id, admin_role_name, registered_role_id, registered_role_name, all_owner_roles, optin_asa_id, optin_tx_timeout) VALUES("", "", "", "", "", "", "", 0, "", 0);';
const dbFile = process.env.dbFile;

export async function dbOpen() {
	const { open } = await import('sqlite');
	return await open({
		filename: dbFile,
		driver: sqlite3.Database,
	});
}

export async function dbCheck() {
	// Check if dbFile exists return true if exists
	try {
		if (!fs.existsSync(dbFile)) {
			// Create the file and the DB
			const db = await dbOpen();
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
}