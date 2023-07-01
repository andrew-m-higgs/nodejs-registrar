import { deployCommands } from './helpers/admin.js';
import 'dotenv/config';
const admin_guildId = process.env.admin_guildId;

// and deploy your commands!
(async () => {
	await deployCommands(['admin-commands', 'commands'], admin_guildId, false);
})();
