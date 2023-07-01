import fs from 'fs';
import sqlite3 from 'sqlite3';
import 'dotenv/config';

const sqlCreateMembers = 'CREATE TABLE members(server_id text, member_id text, nickname text, wallet_string text, asset_ids text, numnfts integer, UNIQUE(server_id, member_id));';
const sqlCreateAssets = 'CREATE TABLE assets(server_id text, asset_id integer, name text, ipfs text, qty integer, UNIQUE(server_id, asset_id));';
const sqlCreateOwnerRoles = 'CREATE TABLE owner_roles(server_id text, role_id text, role_name text, numnfts integer, UNIQUE(server_id, role_id));';
const sqlCreateASARoles = 'CREATE TABLE asa_roles(server_id text, role_id text, role_name text, asa_id integer, asa_name text, asa_qty real,	UNIQUE(server_id, role_id, asa_id));';
const sqlCreateInfo = 'CREATE TABLE info(server_id text, key text, value text, UNIQUE(server_id, key));';
const sqlCreateConfig = 'CREATE TABLE config(server_id text PRIMARY KEY, collection_name text, wallet_strings text, secondary text, admin_role_id text, admin_role_name text, registered_role_id text, registered_role_name text, all_owner_roles text, optin_asa_id text, optin_tx_timeout integer);';
const sqlCreateMembers_IDX = 'CREATE UNIQUE INDEX "Members_IDX" ON "members" ("server_id",	"member_id");';
const sqlCreateAssets_IDX = 'CREATE UNIQUE INDEX "Assets_IDX" ON "assets" ("server_id",	"asset_id");';
const sqlCreateOwnerRoles_IDX = 'CREATE UNIQUE INDEX "OwnerRoles_IDX" ON "owner_roles" ("server_id", "role_id");';
const sqlCreateASARoles_IDX = 'CREATE UNIQUE INDEX "AsaRoles_IDX" ON "asa_roles" ("server_id", "role_id");';
const sqlCreateInfo_IDX = 'CREATE UNIQUE INDEX "Info_IDX" ON "info" ("server_id",	"key");';
// const sqlInsertConfig = 'INSERT INTO config(server_id text, collection_name, wallet_strings, secondary, admin_role_id, admin_role_name, registered_role_id, registered_role_name, all_owner_roles, optin_asa_id, optin_tx_timeout) VALUES("", "", "", "", "", "", "", 0, "", 0);';
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
				await db.run(sqlCreateOwnerRoles);
				await db.run(sqlCreateASARoles);
				await db.run(sqlCreateInfo);
				await db.run(sqlCreateConfig);
				await db.run(sqlCreateMembers_IDX);
				await db.run(sqlCreateAssets_IDX);
				await db.run(sqlCreateOwnerRoles_IDX);
				await db.run(sqlCreateASARoles_IDX);
				await db.run(sqlCreateInfo_IDX);
				// await db.run(sqlInsertConfig);
				db.close();
				return true;
			} catch (err) {
				console.error('ERROR: ' + err.message);
				return false;
			}
		} else {
			// File does exist
			return true;
		}
	} catch (err) {
		console.error('ERROR: ' + err.message);
	}
	return false;
}