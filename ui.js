const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const SPOTIFY_GREEN = 0x1DB954;

function formatTime(seconds) {
    if (!seconds) return "LIVE";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function progressBar(current, total, length = 20) {
    if (!total) return "LIVE";
    const percent = current / total;
    const filled = Math.floor(length * percent);
    return "▰".repeat(filled) + "▱".repeat(length - filled);
}

function nowPlayingEmbed(player) {
    if (!player.current) {
        return new EmbedBuilder()
            .setTitle("Nothing Playing")
            .setColor(SPOTIFY_GREEN);
    }

    const duration = player.current.duration || 0;
    const progress = player.getProgress();
    const bar = progressBar(progress, duration);

    const embed = new EmbedBuilder()
        .setTitle("🎵 Now Playing")
        .setDescription(`**${player.current.title}**`)
        .setColor(SPOTIFY_GREEN)
        .addFields(
            {
                name: "⏱ Progress",
                value: `\`${formatTime(progress)} / ${formatTime(duration)}\`\n\`${bar}\``,
                inline: false
            },
            {
                name: "🔊 Volume",
                value: `${Math.floor(player.volume * 100)}%`,
                inline: true
            },
            {
                name: "🔁 Loop Mode",
                value: player.loopMode,
                inline: true
            }
        );

    if (player.current.thumbnail)
        embed.setThumbnail(player.current.thumbnail);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("pause").setLabel("⏯ Pause/Resume").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("skip").setLabel("⏭ Next").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("stop").setLabel("⏹ Stop").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("volup").setLabel("🔊 Volume +").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("voldown").setLabel("🔉 Volume -").setStyle(ButtonStyle.Success)
    );

    return { embed, row };
}

module.exports = { nowPlayingEmbed };