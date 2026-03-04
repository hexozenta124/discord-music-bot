const { Client, GatewayIntentBits } = require('discord.js');
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
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

    // ✅ Handle Slash Commands
    if (interaction.isChatInputCommand()) {

        try {
            const player = getPlayer(interaction.guild);

            // ================= PLAY =================
            if (interaction.commandName === "play") {

                await interaction.deferReply(); // ✅ instant response

                const query = interaction.options.getString("query");

                const result = await play.search(query, { limit: 1 });
                if (!result.length)
                    return await interaction.editReply("❌ No results found.");

                const info = result[0];

                const song = {
                    title: info.title,
                    url: info.url,
                    duration: info.durationInSec,
                    thumbnail: info.thumbnails[0]?.url
                };

                if (!interaction.member.voice.channel)
                    return await interaction.editReply("❌ Join a voice channel first.");

                await player.connect(interaction.member.voice.channel);
                await player.addSong(song);

                if (!player.current)
                    await player.playNext();

                const { embed, row } = nowPlayingEmbed(player);
                await interaction.editReply({ embeds: [embed], components: [row] });
            }

            // ================= PAUSE =================
            else if (interaction.commandName === "pause") {

                await interaction.deferReply();
                player.player.pause();
                await interaction.editReply("⏸ Paused");
            }

            // ================= RESUME =================
            else if (interaction.commandName === "resume") {

                await interaction.deferReply();
                player.player.unpause();
                await interaction.editReply("▶ Resumed");
            }

            // ================= SKIP =================
            else if (interaction.commandName === "skip") {

                await interaction.deferReply();
                player.player.stop();
                await interaction.editReply("⏭ Skipped");
            }

        } catch (error) {
            console.error("❌ Slash Command Error:", error);

            if (interaction.deferred || interaction.replied) {
                await interaction.editReply("❌ Something went wrong.");
            } else {
                await interaction.reply("❌ Something went wrong.");
            }
        }
    }

    // ✅ Handle Buttons
    if (interaction.isButton()) {

        const player = getPlayer(interaction.guild);

        try {
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

        } catch (err) {
            console.error("❌ Button Error:", err);
        }
    }
});

client.login(TOKEN);
