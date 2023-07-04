import { dbOpen } from '../helpers/db-functions.js';

// [TODO]: Better error reporting

export class ASA {
	constructor(asa_id = 0) {
		this.asa_id = asa_id;
		this.asa_name = '';
		this.asa_decimals = 0;
		this.asa_divisor = 1;
	}

	// -----------------------------------------------------------------------
	// SET the ASA information
	async set() {
		const sql = `INSERT INTO asas(asa_id, asa_name, asa_decimals, asa_divisor) VALUES("${this.asa_id}", "${this.asa_name}", ${this.asa_decimals}, ${this.asa_divisor}) ON CONFLICT(asa_id) DO UPDATE SET asa_name = "${this.asa_name}", asa_decimals = ${this.asa_decimals}, asa_divisor = ${this.asa_divisor}`;
		try {
			const db = await dbOpen();
			await db.run(sql);
		} catch {
			console.log('[ERROR]: There was a problem setting the ASA information.');
			console.log('[ERROR]: In classes/asa.js#set().');
			console.log('[ERROR]: SQL: ' + sql);
			return false;
		}
		return true;
	}

	// -----------------------------------------------------------------------
	// GET the ASA information
	async get() {
		const sql = `SELECT * FROM asas WHERE asa_id = "${this.asa_id}"`;
		let unknownUser = true;
		try {
			const db = await dbOpen();
			const row = await db.get(sql);
			// this.asa_id = this.asa_id;
			this.asa_name = `${row.asa_name}`;
			this.asa_decimals = row.asa_decimals;
			this.asa_divisor = row.asa_divisor;
			unknownUser = false;
		} catch {
			console.log('[ERROR]: There was a problem getting the ASA information.');
			console.log('[ERROR]: In classes/asa.js#get().');
			console.log('[ERROR]: SQL: ' + sql);
		}
		if (unknownUser) {
			this.set();
		}
	}
}
