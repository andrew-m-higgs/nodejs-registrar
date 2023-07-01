import fs from 'fs';
import path from 'node:path';
import { Client, Events, Collection, GatewayIntentBits } from 'discord.js';
import { doFlexSelect, doCheckSelect, doDeployCommands } from './components/selects.js';
import * as db_functions from './helpers/db-functions.js';
import { Config } from './classes/config.js';
import 'dotenv/config';
const token = process.env.token;
const admin_guildId = process.env.admin_guildId;

// Create a new client instance
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		// GatewayIntentBits.GuildMembers,
	],
});

client.commands = new Collection();

async function addCommands(dir) {
	const commandsPath = path.join(process.cwd(), dir);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = await import(`${filePath}`);
		// Set a new item in the collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}
addCommands('commands');

addCommands('commands');

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async (c) => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
	const dbReady = await db_functions.dbCheck();
	if (dbReady) {
		// const db = await db_functions.dbOpen();
		console.log('Database is ready.');
	} else {
		console.error('[ERROR]: There was a problem opening the database.');
		return false;
	}
	// console.log('config: ' + JSON.stringify(config));
});

client.on(Events.InteractionCreate, async (interaction) => {
	if (interaction.guild.id == admin_guildId) {
		addCommands('admin-commands');
	}
	const server_id = interaction.guild.id;
	console.log('Server ID: ' + server_id);
	const config = new Config(server_id);
	await config.get();
	// const db = await db_functions.dbOpen();
	// const row = await db.get('SELECT * FROM config WHERE server_id = ' + server_id);
	// [TODO]: Make config a class...
	/* config = {
		collection_name: row['collection_name'],
		wallet_strings: await functions.getCreatorWallets(row['wallet_strings']),
		secondary: row['secondary'],
		admin_role_id: row['admin_role_id'],
		admin_role_name: row['admin_role_name'],
		registered_role_id: row['registered_role_id'],
		registered_role_name: row['registered_role_name'],
		all_owner_roles: row['all_owner_roles'],
		optin_token: row['optin_asa_id'],
		optin_tx_timeout: row['optin_tx_timeout'],
	};*/
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
		case 'deploy_select':
			doDeployCommands(interaction, config);
			break;
		}
	} else if (interaction.isButton) {
		// No Buttons used at the moment.
	}
});

// Log in to Discord with your client's token
client.login(token);
