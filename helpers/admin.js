import fs from 'node:fs';
import path from 'node:path';
import { REST, Routes } from 'discord.js';
import 'dotenv/config';
const admin_guildId = process.env.admin_guildId;
const clientId = process.env.clientId;
const token = process.env.token;

// Log messages more consistenly to assist with rsyslog reporting
export function logMessage(server_id, type, message) {
	console.log(`${type}: SERVER (${server_id}): ${message}`);
}

async function makeCommandArray(commandFiles, commandsPath, server_id) {
	const commands = [];
	for (const filePath of commandFiles) {
		const command = await import(`${commandsPath}/${filePath}`);
		if (command.data && command.execute) {
			commands.push(command.data.toJSON());
		} else {
			logMessage(server_id, 'WARNING', `The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
	return commands;
}

export async function deployCommands(dirs = ['commands'], server_id = admin_guildId, interaction) {
	let commands = [];
	let dir = '';
	for (const idx in dirs) {
		dir = dirs[idx];
		const commandsPath = path.join(process.cwd(), dir);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
		commands = commands.concat(await makeCommandArray(commandFiles, commandsPath, server_id));
	}
	try {
		logMessage(server_id, 'INFO', `Started refreshing ${commands.length} application (/) commands.`);
		const rest = new REST({ version: '10' }).setToken(token);
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, server_id),
			{ body: commands },
		);
		logMessage(server_id, 'INFO', `Successfully reloaded ${data.length} application (/) commands.`);
		if (interaction) {
			// await interaction.editReply();
			console.log('Interaction: ' + interaction.guild.id);
		}
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		logMessage(server_id, 'ERROR', error.message);
	}

}
