import { REST, Routes } from 'discord.js';
import fs from 'node:fs';
import path from 'node:path';
import 'dotenv/config';
const clientId = process.env.clientId;
const guildId = process.env.guildId;
const token = process.env.token;

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandsPath = path.join(process.cwd(), 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
async function addCommands() {
	for (const filePath of commandFiles) {
		const command = await import(`./commands/${filePath}`);
		if (command.data && command.execute) {
			commands.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
	await addCommands();
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// The put method is used to fully refresh all commands in the guild with the current set
		const data = await rest.put(
			Routes.applicationGuildCommands(clientId, guildId),
			{ body: commands },
		);

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		// And of course, make sure you catch and log any errors!
		console.error(error);
	}
})();
