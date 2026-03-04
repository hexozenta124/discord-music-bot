const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const SPOTIFY_GREEN = 0x1DB954;

function formatTime(seconds) {
    if (!seconds || seconds <= 0) return "LIVE";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function progressBar(current, total, length = 20) {
    if (!total || total <= 0) return "LIVE";
    const percent = Math.min(current / total, 1);
    const filled = Math.floor(length * percent);
    return "▰".repeat(filled) + "▱".repeat(length - filled);
}

function nowPlayingEmbed(player) {

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause").setLabel("⏯ Pause/Resume").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("skip").setLabel("⏭ Next").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("stop").setLabel("⏹ Stop").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("volup").setLabel("🔊 Volume +").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("voldown").setLabel("🔉 Volume -").setStyle(ButtonStyle.Success)
    );

    // ✅ If nothing playing
    if (!player.current) {
        const embed = new EmbedBuilder()
            .setTitle("Nothing Playing")
            .setDescription("Queue is empty.")
            .setColor(SPOTIFY_GREEN);

        return { embed, row }; // ✅ ALWAYS return object
    }

    const duration = player.current.duration || 0;
    const progress = player.getProgress();
    const bar = progressBar(progress, duration);

    const embed = new EmbedBuilder()
        .setTitle("🎵 Now Playing")
        .setDescription(`**${player.current.title || "Unknown Title"}**`)
        .setColor(SPOTIFY_GREEN)
        .addFields(
            {
                name: "⏱ Progress",
                value: `\`${formatTime(progress)} / ${formatTime(duration)}\`\n\`${bar}\``,
                inline: false
            },
            {
                name: "🔊 Volume",
                value: `${Math.floor((player.volume || 0) * 100)}%`,
                inline: true
            },
            {
                name: "🔁 Loop Mode",
                value: player.loopMode || "off",
                inline: true
            }
        );

    if (player.current.thumbnail)
        embed.setThumbnail(player.current.thumbnail);

    return { embed, row }; // ✅ ALWAYS return object
}

module.exports = { nowPlayingEmbed };
