import discord
from discord.ui import View

SPOTIFY_GREEN = 0x1DB954

def format_time(seconds):
    if not seconds:
        return "LIVE"
    m, s = divmod(int(seconds), 60)
    return f"{m:02}:{s:02}"

def progress_bar(current, total, length=20):
    if not total:
        return "LIVE"
    percent = current / total
    filled = int(length * percent)
    bar = "▰" * filled + "▱" * (length - filled)
    return bar

def now_playing_embed(player):
    if not player.current:
        return discord.Embed(
            title="Nothing Playing",
            color=SPOTIFY_GREEN
        )

    duration = player.current.get("duration", 0)
    progress = player.get_progress()
    bar = progress_bar(progress, duration)

    embed = discord.Embed(
        title="🎵 Now Playing",
        description=f"**{player.current['title']}**",
        color=SPOTIFY_GREEN
    )

    # ✅ Thumbnail show karne ke liye
    if "thumbnail" in player.current and player.current["thumbnail"]:
        embed.set_thumbnail(url=player.current["thumbnail"])

    embed.add_field(
        name="⏱ Progress",
        value=f"`{format_time(progress)} / {format_time(duration)}`\n`{bar}`",
        inline=False
    )

    embed.add_field(
        name="🔊 Volume",
        value=f"{int(player.volume * 100)}%",
        inline=True
    )

    embed.add_field(
        name="🔁 Loop Mode",
        value=player.loop_mode.capitalize(),
        inline=True
    )

    return embed

# -------- BUTTONS --------

class MusicControls(View):
    def __init__(self, player):
        super().__init__(timeout=None)
        self.player = player

    @discord.ui.button(label="⏯ Pause/Resume", style=discord.ButtonStyle.primary)
    async def pause_resume(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.player.voice and self.player.voice.is_playing():
            self.player.voice.pause()
        elif self.player.voice:
            self.player.voice.resume()
        await interaction.response.defer()

    @discord.ui.button(label="⏭ Next", style=discord.ButtonStyle.secondary)
    async def skip(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.player.voice:
            self.player.voice.stop()
        await interaction.response.defer()

    @discord.ui.button(label="⏹ Stop", style=discord.ButtonStyle.danger)
    async def stop(self, interaction: discord.Interaction, button: discord.ui.Button):
        if self.player.voice:
            await self.player.voice.disconnect()
            self.player.voice = None
        await interaction.response.defer()

    @discord.ui.button(label="🔊 Volume +", style=discord.ButtonStyle.success)
    async def volume_up(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.player.volume = min(self.player.volume + 0.1, 1.0)
        if self.player.voice and self.player.voice.source:
            self.player.voice.source.volume = self.player.volume
        await interaction.response.defer()

    @discord.ui.button(label="🔉 Volume -", style=discord.ButtonStyle.success)
    async def volume_down(self, interaction: discord.Interaction, button: discord.ui.Button):
        self.player.volume = max(self.player.volume - 0.1, 0.0)
        if self.player.voice and self.player.voice.source:
            self.player.voice.source.volume = self.player.volume
        await interaction.response.defer()