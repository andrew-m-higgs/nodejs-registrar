// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, Collection, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');
const { doFlexSelect, doCheckSelect } = require('./components/selects.js');

// Use sqlite3 module
// const sqlite3 = require('sqlite3').verbose();
const db_functions = require('./helpers/db-functions.js');
const functions = require('./helpers/functions.js');
let config = {};

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		// GatewayIntentBits.GuildMembers,
	],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}
// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	const dbReady = await db_functions.dbCheck();
	if (dbReady) {
		const db = await db_functions.dbOpen();
		console.log('Database is ready.');
		const row = await db.get('SELECT * FROM config');
		// console.log('Config row: ' + JSON.stringify(row));
		config = {
			collection_name: row['collection_name'],
			wallet_strings: await functions.getCreatorWallets(row['wallet_strings']),
			secondary: row['secondary'],
			admin_role_id: row['admin_role_id'],
			admin_role_name: row['admin_role_name'],
			registered_role_id: row['registered_role_id'],
			registered_role_name: row['registered_role_name'],
			optin_token: row['optin_asa_id'],
		};
		console.log('Config is set.');
	} else {
		console.error('[ERROR]: There was a problem opening the database.');
		return false;
	}
	// console.log('config: ' + JSON.stringify(config));
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
		try {
			await command.execute(interaction, config);
		} catch (error) {
			console.error(error);
			if (interaction.replied || interaction.deffered) {
				await interaction.followUp({ content: ':no_entry: There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: ':no_entry: There was an error while executing this command!', ephemeral: true });
			}
		}
	} else if (interaction.isStringSelectMenu()) {
		switch (interaction.customId) {
		case 'flex_select':
			doFlexSelect(interaction, config);
			break;
		case 'check_select':
			doCheckSelect(interaction, config);
			break;
		}
	}
});

// Log in to Discord with your client's token
client.login(token);
