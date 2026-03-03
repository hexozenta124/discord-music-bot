import discord
from discord.ext import commands, tasks
from discord import app_commands
import yt_dlp
import asyncio

from config import TOKEN
from player import MusicPlayer
from ui import now_playing_embed, MusicControls

intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True

bot = commands.Bot(command_prefix="!", intents=intents)
tree = bot.tree

players = {}
now_playing_messages = {}

ytdl = yt_dlp.YoutubeDL({
    "format": "bestaudio/best",
    "quiet": True
})


def get_player(guild):
    if guild.id not in players:
        players[guild.id] = MusicPlayer(bot, guild)
    return players[guild.id]


# ================= AUTO UPDATE EMBED =================

@tasks.loop(seconds=5)
async def update_embeds():
    for guild_id, player in players.items():
        if (
            guild_id in now_playing_messages
            and player.voice
            and player.voice.is_playing()
            and player.current
        ):
            try:
                message = now_playing_messages[guild_id]
                embed = now_playing_embed(player)
                view = MusicControls(player)
                await message.edit(embed=embed, view=view)
            except:
                pass


# ================= READY =================

@bot.event
async def on_ready():
    await tree.sync()

    if not update_embeds.is_running():
        update_embeds.start()

    print(f"Logged in as {bot.user}")


# ================= PLAY =================

@tree.command(name="play", description="Play a song")
async def play(interaction: discord.Interaction, query: str):
    await interaction.response.defer()

    if not interaction.user.voice:
        await interaction.followup.send("Join a voice channel first.")
        return

    player = get_player(interaction.guild)
    await player.connect(interaction.user.voice.channel)

    info = ytdl.extract_info(f"ytsearch:{query}", download=False)["entries"][0]

    song = {
        "title": info["title"],
        "url": info["url"],
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail")  # ✅ Thumbnail added
    }

    await player.add_song(song, interaction.followup)

    if not player.voice.is_playing():
        await player.play_next()

    embed = now_playing_embed(player)
    view = MusicControls(player)

    if interaction.guild.id in now_playing_messages:
        try:
            await now_playing_messages[interaction.guild.id].delete()
        except:
            pass

    message = await interaction.followup.send(embed=embed, view=view)
    now_playing_messages[interaction.guild.id] = message


# ================= ADD NEXT (NEW COMMAND) =================

@tree.command(name="addnext", description="Add song to queue")
async def addnext(interaction: discord.Interaction, query: str):
    await interaction.response.defer()

    if not interaction.user.voice:
        await interaction.followup.send("Join a voice channel first.")
        return

    player = get_player(interaction.guild)

    info = ytdl.extract_info(f"ytsearch:{query}", download=False)["entries"][0]

    song = {
        "title": info["title"],
        "url": info["url"],
        "duration": info.get("duration", 0),
        "thumbnail": info.get("thumbnail")  # ✅ Thumbnail added
    }

    await player.add_song(song, interaction.followup)

    await interaction.followup.send(
        f"✅ **Added to Queue:** {song['title']}"
    )


# ================= PAUSE =================

@tree.command(name="pause", description="Pause music")
async def pause(interaction: discord.Interaction):
    player = get_player(interaction.guild)
    if player.voice:
        player.voice.pause()
        await interaction.response.send_message("⏸ Paused")


# ================= RESUME =================

@tree.command(name="resume", description="Resume music")
async def resume(interaction: discord.Interaction):
    player = get_player(interaction.guild)
    if player.voice:
        player.voice.resume()
        await interaction.response.send_message("▶ Resumed")


# ================= SKIP =================

@tree.command(name="skip", description="Skip song")
async def skip(interaction: discord.Interaction):
    player = get_player(interaction.guild)
    if player.voice:
        player.voice.stop()
        await interaction.response.send_message("⏭ Skipped")


# ================= VOLUME =================

@tree.command(name="volume", description="Set volume 1-100")
async def volume(interaction: discord.Interaction, level: int):
    player = get_player(interaction.guild)

    if 1 <= level <= 100:
        player.volume = level / 100
        if player.voice and player.voice.source:
            player.voice.source.volume = player.volume
        await interaction.response.send_message(f"🔊 Volume set to {level}%")
    else:
        await interaction.response.send_message("Use 1-100 only.")


# ================= 24/7 MODE =================

@tree.command(name="247", description="Toggle 24/7 mode")
async def twentyfourseven(interaction: discord.Interaction):
    player = get_player(interaction.guild)

    player.twenty_four_seven = not player.twenty_four_seven
    status = "ON" if player.twenty_four_seven else "OFF"

    await interaction.response.send_message(f"🔥 24/7 Mode: {status}")


# 🚀 RUN BOT
bot.run(TOKEN)