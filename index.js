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

client.once('clientReady', () => {
    console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {

    // ================= SLASH COMMANDS =================
    if (interaction.isChatInputCommand()) {
        try {

            // ===== PLAY =====
            if (interaction.commandName === "play") {

                await interaction.deferReply();

                const player = getPlayer(interaction.guild);
                const query = interaction.options.getString("query");

                const result = await play.search(query, { limit: 1 });

                if (!result || !result.length)
                    return await interaction.editReply("❌ No results found.");

                const info = result[0];

                if (!info.url)
                    return await interaction.editReply("❌ Could not get video URL.");

                const song = {
                    title: info.title || "Unknown Title",
                    url: info.url,
                    duration: info.durationInSec || 0,
                    thumbnail: info.thumbnails?.[0]?.url || null
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

            // ===== PAUSE =====
            else if (interaction.commandName === "pause") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.pause();
                await interaction.editReply("⏸ Paused");
            }

            // ===== RESUME =====
            else if (interaction.commandName === "resume") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.unpause();
                await interaction.editReply("▶ Resumed");
            }

            // ===== SKIP =====
            else if (interaction.commandName === "skip") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.stop();
                await interaction.editReply("⏭ Skipped");
            }

        } catch (error) {
            console.error("❌ Slash Command Error:", error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply("❌ Something went wrong.");
                }
            } catch {}
        }
    }

    // ================= BUTTONS =================
    else if (interaction.isButton()) {
        try {

            await interaction.deferUpdate();

            const player = getPlayer(interaction.guild);

            if (interaction.customId === "pause") {
                if (player.player.state.status === "playing")
                    player.player.pause();
                else
                    player.player.unpause();
            }

            else if (interaction.customId === "skip") {
                player.player.stop();
            }

            else if (interaction.customId === "stop") {
                if (player.connection) {
                    player.connection.destroy();
                    player.connection = null;
                }
            }

            else if (interaction.customId === "volup") {
                player.volume = Math.min(player.volume + 0.1, 1);
            }

            else if (interaction.customId === "voldown") {
                player.volume = Math.max(player.volume - 0.1, 0);
            }

        } catch (err) {
            console.error("❌ Button Error:", err);
        }
    }
});

client.login(TOKEN);                const player = getPlayer(interaction.guild);
                const query = interaction.options.getString("query");

                const result = await play.search(query, { limit: 1 });

                if (!result || !result.length || !result[0].url)
                    return await interaction.editReply("❌ No results found.");

                const info = result[0];

                const song = {
                    title: info.title || "Unknown Title",
                    url: info.url,
                    duration: info.durationInSec || 0,
                    thumbnail: info.thumbnails?.[0]?.url || null
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

            else if (interaction.commandName === "pause") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.pause();
                await interaction.editReply("⏸ Paused");
            }

            else if (interaction.commandName === "resume") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.unpause();
                await interaction.editReply("▶ Resumed");
            }

            else if (interaction.commandName === "skip") {
                await interaction.deferReply();
                const player = getPlayer(interaction.guild);
                player.player.stop();
                await interaction.editReply("⏭ Skipped");
            }

        } catch (error) {
            console.error("❌ Slash Command Error:", error);
            try {
                if (interaction.deferred || interaction.replied) {
                    await interaction.editReply("❌ Something went wrong.");
                }
            } catch {}
        }
    }

    // ===== BUTTONS =====
    else if (interaction.isButton()) {
        try {

            await interaction.deferUpdate();

            const player = getPlayer(interaction.guild);

            if (interaction.customId === "pause") {
                if (player.player.state.status === "playing")
                    player.player.pause();
                else
                    player.player.unpause();
            }

            else if (interaction.customId === "skip") {
                player.player.stop();
            }

            else if (interaction.customId === "stop") {
                if (player.connection) {
                    player.connection.destroy();
                    player.connection = null;
                }
            }

            else if (interaction.customId === "volup") {
                player.volume = Math.min(player.volume + 0.1, 1);
            }

            else if (interaction.customId === "voldown") {
                player.volume = Math.max(player.volume - 0.1, 0);
            }

        } catch (err) {
            console.error("❌ Button Error:", err);
        }
    }
});

client.login(TOKEN);
