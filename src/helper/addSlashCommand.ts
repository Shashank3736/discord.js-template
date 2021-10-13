import { APIApplicationCommandOption, ApplicationCommandOptionType } from "discord-api-types";
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const log = content => process.env.DEBUG && console.log(content);
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

export async function addGlobalCommands(commands: ({
    name: string;
    description: string;
    options: APIApplicationCommandOption[];
    default_permission: boolean | undefined;
} | {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    options: APIApplicationCommandOption[];
})[]) {
    log('Started refreshing application (/) commands.');
    log(commands);
    const data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands}
    );
    log(data);
    log('Successfully reloaded application (/) commands.');
}

export async function addGuildCommands(commands: ({
    name: string;
    description: string;
    options: APIApplicationCommandOption[];
    default_permission: boolean | undefined;
} | {
    type: ApplicationCommandOptionType;
    name: string;
    description: string;
    options: APIApplicationCommandOption[];
})[], guildID: string = process.env.MAIN_SERVER_ID) {

    log('Started refreshing application (/) commands.');
    log(commands);
    await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, guildID),
        { body: commands }
    );

    log('Successfully reloaded application (/) commands.');
}
