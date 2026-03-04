const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, StreamType } = require('@discordjs/voice');
const play = require('play-dl');
const ffmpeg = require('ffmpeg-static');
const { DEFAULT_VOLUME } = require('./config');

class MusicPlayer {
    constructor(client, guild) {
        this.client = client;
        this.guild = guild;
        this.queue = [];
        this.history = [];
        this.volume = DEFAULT_VOLUME;
        this.loopMode = "off";
        this.connection = null;
        this.player = createAudioPlayer();
        this.current = null;
        this.startTime = null;
        this.twentyFourSeven = false;

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.playNext();
        });
    }

    async connect(channel) {
        if (!this.connection) {
            this.connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator
            });
            this.connection.subscribe(this.player);
        }
    }

    async addSong(song) {
        this.queue.push(song);
    }

    async playNext() {
        if (this.current) this.history.push(this.current);

        if (this.loopMode === "song" && this.current) {
            // replay same
        } else {
            if (this.loopMode === "queue" && this.current) {
                this.queue.push(this.current);
            }

            if (this.queue.length > 0) {
                this.current = this.queue.shift();
            } else {
                if (!this.twentyFourSeven && this.connection) {
                    this.connection.destroy();
                    this.connection = null;
                }
                return;
            }
        }

        const stream = await play.stream(this.current.url);

        const resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
        });

        resource.volume.setVolume(this.volume);

        this.startTime = Date.now();

        this.player.play(resource);
    }

    getProgress() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
}

module.exports = MusicPlayer;