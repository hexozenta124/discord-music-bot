const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, InteractionType } = require('discord.js');
const play = require('play-dl');
const { TOKEN } = require('./config');
const MusicPlayer = require('./player');
const { nowPlayingEmbed } = require('./ui');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});

const players = new Map();

function getPlayer(guild) {
    if (!players.has(guild.id)) {
        players.set(guild.id, new MusicPlayer(client, guild));
    }
    return players.get(guild.id);
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

    if (interaction.isChatInputCommand()) {

        const player = getPlayer(interaction.guild);

        if (interaction.commandName === "play") {

            await interaction.deferReply();

            const query = interaction.options.getString("query");

            const result = await play.search(query, { limit: 1 });
            if (!result.length) return interaction.editReply("No results.");

            const info = result[0];

            const song = {
                title: info.title,
                url: info.url,
                duration: info.durationInSec,
                thumbnail: info.thumbnails[0]?.url
            };

            await player.connect(interaction.member.voice.channel);
            await player.addSong(song);

            if (!player.current)
                await player.playNext();

            const { embed, row } = nowPlayingEmbed(player);
            await interaction.editReply({ embeds: [embed], components: [row] });
        }

        if (interaction.commandName === "pause") {
            player.player.pause();
            interaction.reply("⏸ Paused");
        }

        if (interaction.commandName === "resume") {
            player.player.unpause();
            interaction.reply("▶ Resumed");
        }

        if (interaction.commandName === "skip") {
            player.player.stop();
            interaction.reply("⏭ Skipped");
        }
    }

    if (interaction.isButton()) {
        const player = getPlayer(interaction.guild);

        if (interaction.customId === "pause") {
            if (player.player.state.status === "playing")
                player.player.pause();
            else
                player.player.unpause();
        }

        if (interaction.customId === "skip")
            player.player.stop();

        if (interaction.customId === "stop") {
            if (player.connection) {
                player.connection.destroy();
                player.connection = null;
            }
        }

        if (interaction.customId === "volup") {
            player.volume = Math.min(player.volume + 0.1, 1);
        }

        if (interaction.customId === "voldown") {
            player.volume = Math.max(player.volume - 0.1, 0);
        }

        await interaction.deferUpdate();
    }
});

client.login(TOKEN);