import { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandsOnlyBuilder } from "@discordjs/builders";

import { CommandInteraction, MessageActionRow, MessageButton, MessageComponentInteraction, MessageEmbed, PermissionResolvable } from "discord.js";
import { createHelp, log } from "../helper/util";
import { BotClient } from "./client";
import { PermissionManager } from "./permission";

const perms = ["REGULAR", "SUPPORTER", "MODERATOR", "ADMINISTRATOR", "OWNER"];

export class Command {
    [index: string]: any;
    public data: SlashCommandSubcommandsOnlyBuilder | SlashCommandSubcommandGroupBuilder;
    public permit_level: 1 | 2 | 3 | 4 | 5;
    public _description?: string;
    public _channel: 1 | 2 | 3; // 1 - Text Channel only 2 - DM channel only 3 - Both;
    public _bot_permission: PermissionResolvable[];
    public _developer: boolean;
    public client: BotClient;
    public module: string;

    constructor(option: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder, client: BotClient) {
        // option.addSubcommand(cmd => cmd.setName('help').setDescription('Get help message for the command.'));
        this.data = option;
        this._channel = 1;
        this._bot_permission = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS", "USE_APPLICATION_COMMANDS"];
        this._developer = false;
        this.client = client;
        this.module = 'General';
        this.permit_level = client.util.config.commandPermission[this.data.name] || 1;
    }
    
    async _have_problem(interaction: CommandInteraction) {
        return false;
    }

    async _check_bypass(interaction: CommandInteraction) {
        return false;
    }

    getPermitLevel(guildID?: string) {
        if(this._developer) return Infinity;
        if(!guildID) return this.permit_level
        const permit = new PermissionManager(this.client, guildID);
        return permit.get(this.data.name, "COMMAND", this.permit_level);
    }

    async help(interaction: CommandInteraction) {
        const embeds = this.client.util.createHelpEmbed(this.toJSON(), { 
            permit_level: this.getPermitLevel(interaction.guild?.id),
            description: this._description
        });

        if(embeds.length > 1) this.client.util.createMenu(interaction, embeds);
        else interaction.reply({ embeds: embeds });
    }

    async _help(interaction: CommandInteraction) {
        const permit_level = this.getPermitLevel(interaction.guild ? interaction.guild.id : undefined);

        let description_1: string = `${this.data.description}
        
        Permit Level: \`${permit_level === Infinity ? `Almighty`: perms[permit_level - 1]}\`\n\n`;
        if(this._description) description_1 += this._description + '\n';
        const description = createHelp(this.toJSON());
        
        const helpEmbed = new MessageEmbed()
        .setTitle(this.data.name)
        .setThumbnail(this.client.user?.displayAvatarURL())
        .setColor('BLURPLE');

        if(this._description) {
            helpEmbed.setDescription(description_1)

            const filter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
            
            const nextButton = new MessageButton().setCustomId('next').setStyle('PRIMARY').setLabel('Next');
            const prevButton = new MessageButton().setCustomId('prev').setLabel('Previous').setStyle('SECONDARY');
            const closeButton = new MessageButton().setCustomId('close').setLabel("X").setStyle('DANGER');

            const row = new MessageActionRow()
            .addComponents([
                prevButton,
                nextButton,
                closeButton
            ]);

            interaction.reply({ embeds: [helpEmbed], components: [row] });

            const collector = interaction.channel?.createMessageComponentCollector({ filter, time: 60000, componentType: 'BUTTON' });

            collector?.on('collect', async i => {
                if(i.customId === 'next') {
                    i.update({ embeds: [helpEmbed.setDescription(description)] })
                } else if(i.customId === 'prev') {
                    i.update({
                        embeds: [helpEmbed.setDescription(description_1)] });
                } else {
                    i.update({ components: [] });
                    collector.stop('CLOSED_BY_X');
                }
            });

        } else return interaction.reply({ embeds: [helpEmbed.setDescription(description_1 + description)] });
    }

    isAllowed(interaction: CommandInteraction) {
        const member = interaction.guild?.members.cache.get(interaction.client.user?.id);
        return member?.permissions.has(this._bot_permission);
    }

    async _check(interaction: CommandInteraction) {
        if(this._developer) return (process.env.OWNER_ID === interaction.user.id);
        if(!interaction.guildId) return true;
        const guild_perms = new PermissionManager(interaction.client, interaction.guildId);
        return (await guild_perms.getMemberLevel(interaction.user.id)) >= this.getPermitLevel(interaction.guildId);
    }

    async exec(interaction: CommandInteraction) {
        interaction.reply({ content: "Command is still in progress. Please wait for some more time.", ephemeral: true });
    }

    toJSON() {
        return this.data.toJSON();
    }
}

// export class ExampleCommand extends Command {
//     constructor() {
//         super({
//             name: 'name',
//             description: 'description'
//         });
//     }

//     exec(interaction: CommandInteraction) {
//         interaction.reply({ content: `content` });
//     }
// }