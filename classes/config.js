import { dbOpen } from '../helpers/db-functions.js';
import { logMessage } from '../helpers/admin.js';

// This class represents a single server's configuration as stored in the database

export class Config {
	constructor(server_id = 0) {
		this.server_id = server_id;
		this.collection_name = '';
		this.wallet_strings = '';
		this.secondary = '';
		this.admin_role_id = '';
		this.admin_role_name = '';
		this.registered_role_id = '';
		this.registered_role_name = '';
		this.all_owner_roles = 'F';
		this.optin_asa_id = '';
		this.optin_tx_timeout = 3;
	}

	// -----------------------------------------------------------------------
	// SET the server config
	async set() {
		const sql = `INSERT INTO config(server_id, collection_name, wallet_strings, secondary, admin_role_id, admin_role_name, registered_role_id, registered_role_name, all_owner_roles, optin_asa_id, optin_tx_timeout) VALUES("${this.server_id}", "${this.collection_name}", "${this.wallet_strings}", "${this.secondary}", "${this.admin_role_id}", "${this.admin_role_name}", "${this.registered_role_id}", "${this.registered_role_name}", "${this.all_owner_roles}", "${this.optin_asa_id}", ${this.optin_tx_timeout}) ON CONFLICT(server_id) DO UPDATE SET collection_name = "${this.collection_name}", admin_role_id = "${this.admin_role_id}", admin_role_name = "${this.admin_role_name}", registered_role_id = "${this.registered_role_id}", registered_role_name = "${this.registered_role_name}", wallet_strings = "${this.wallet_strings}", secondary = "${this.secondary}", all_owner_roles = "${this.all_owner_roles}", optin_asa_id = "${this.optin_asa_id}", optin_tx_timeout = ${this.optin_tx_timeout}`;
		// logMessage(this.server_id, 'INFO', `classes/config.js#set() - SQL: ${sql}`);
		let db = undefined;
		try {
			db = await dbOpen();
		} catch (error) {
			logMessage(this.server_id, 'ERROR', 'There was a problem opening the database.');
			logMessage(this.server_id, 'ERROR', 'In classes/config.js#set().');
			logMessage(this.server_id, 'ERROR', 'Error: ' + error.message);
		}
		try {
			await db.run(sql);
		} catch (error) {
			logMessage(this.server_id, 'ERROR', 'There was a problem setting the config data.');
			logMessage(this.server_id, 'ERROR', 'In classes/config.js#set().');
			logMessage(this.server_id, 'ERROR', 'SQL: ' + sql);
			logMessage(this.server_id, 'ERROR', 'Error: ' + error.message);
			return false;
		}
		return true;
	}

	// -----------------------------------------------------------------------
	// GET the server config
	async get() {
		const sql = `SELECT * FROM config WHERE server_id = ${this.server_id}`;
		let unknownUser = true;
		let db = undefined;
		try {
			db = await dbOpen();
		} catch (error) {
			logMessage(this.server_id, 'ERROR', 'There was a problem opening the database.');
			logMessage(this.server_id, 'ERROR', 'In classes/config.js#get().');
			logMessage(this.server_id, 'ERROR', 'Error: ' + error.message);
		}
		try {
			const row = await db.get(sql);
			this.server_id = this.server_id.toString();
			this.collection_name = row.collection_name;
			this.wallet_strings = row.wallet_strings;
			this.secondary = row.secondary;
			this.admin_role_id = row.admin_role_id;
			this.admin_role_name = row.admin_role_name;
			this.registered_role_id = row.registered_role_id;
			this.registered_role_name = row.registered_role_name;
			this.all_owner_roles = row.all_owner_roles;
			this.optin_asa_id = row.optin_asa_id;
			this.optin_tx_timeout = row.optin_tx_timeout;
			unknownUser = false;
		} catch {
			logMessage(this.server_id, 'WARNING', 'There was a problem getting the latest config.');
			logMessage(this.server_id, 'WARNING', 'In classes/config.js#get().');
			logMessage(this.server_id, 'WARNING', 'SQL: ' + sql);
		}
		if (unknownUser) {
			this.set();
		}
	}
}
