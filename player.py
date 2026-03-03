import discord
import asyncio
from config import DEFAULT_VOLUME


class MusicPlayer:
    def __init__(self, bot, guild):
        self.bot = bot
        self.guild = guild
        self.queue = []
        self.history = []
        self.volume = DEFAULT_VOLUME
        self.loop_mode = "off"
        self.voice = None
        self.current = None
        self.start_time = None
        self.twenty_four_seven = False

    async def connect(self, channel):
        if not self.voice or not self.voice.is_connected():
            self.voice = await channel.connect()

    async def add_song(self, song, ctx=None):
        self.queue.append(song)

        if self.current and ctx:
            await ctx.send(f"✅ **Next Song Added:** {song['title']}")

    async def play_next(self):
        if not self.voice:
            return

        if self.current:
            self.history.append(self.current)

        if self.loop_mode == "song" and self.current:
            pass
        else:
            if self.loop_mode == "queue" and self.current:
                self.queue.append(self.current)

            if self.queue:
                self.current = self.queue.pop(0)
            else:
                if not self.twenty_four_seven:
                    await self.voice.disconnect()
                    self.voice = None
                return

        # ✅ SPEED LOCKED AT 1x
        ffmpeg_options = {
            "before_options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5",
            "options": "-vn -filter:a atempo=1.0"
        }

        source = discord.FFmpegPCMAudio(
            self.current["url"],
            **ffmpeg_options
        )

        source = discord.PCMVolumeTransformer(
            source,
            volume=self.volume
        )

        self.start_time = asyncio.get_event_loop().time()

        self.voice.play(
            source,
            after=lambda e: asyncio.run_coroutine_threadsafe(
                self.play_next(),
                self.bot.loop
            )
        )

    def get_progress(self):
        if not self.start_time:
            return 0
        return int(asyncio.get_event_loop().time() - self.start_time)