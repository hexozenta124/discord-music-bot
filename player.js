const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus 
} = require('@discordjs/voice');

const play = require('play-dl');
const { DEFAULT_VOLUME } = require('./config');

class MusicPlayer {
    constructor(client, guild) {
        this.client = client;
        this.guild = guild;
        this.queue = [];
        this.history = [];
        this.volume = DEFAULT_VOLUME || 0.5;
        this.loopMode = "off";
        this.connection = null;
        this.player = createAudioPlayer();
        this.current = null;
        this.startTime = null;
        this.twentyFourSeven = false;

        // ✅ Auto play next when song ends
        this.player.on(AudioPlayerStatus.Idle, () => {
            this.playNext().catch(console.error);
        });

        // ✅ Prevent crash on error
        this.player.on("error", (error) => {
            console.error("Audio Player Error:", error);
            this.playNext().catch(console.error);
        });
    }

    async connect(channel) {
        if (!channel) return;

        if (!this.connection) {
            this.connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: true
            });

            this.connection.subscribe(this.player);
        }
    }

    async addSong(song) {
        if (!song) return;
        this.queue.push(song);
    }

    async playNext() {
        try {

            if (this.current)
                this.history.push(this.current);

            // ✅ Loop song
            if (this.loopMode === "song" && this.current) {
                // replay same song
            } 
            else {

                // ✅ Loop queue
                if (this.loopMode === "queue" && this.current) {
                    this.queue.push(this.current);
                }

                if (this.queue.length > 0) {
                    this.current = this.queue.shift();
                } 
                else {
                    this.current = null;

                    if (!this.twentyFourSeven && this.connection) {
                        this.connection.destroy();
                        this.connection = null;
                    }

                    return;
                }
            }

            if (!this.current) return;

            const stream = await play.stream(this.current.url);

            const resource = createAudioResource(stream.stream, {
                inputType: stream.type,
                inlineVolume: true
            });

            resource.volume.setVolume(this.volume);

            this.startTime = Date.now();

            this.player.play(resource);

        } catch (error) {
            console.error("PlayNext Error:", error);
            this.playNext();
        }
    }

    getProgress() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

module.exports = MusicPlayer;
