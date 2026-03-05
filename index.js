require("dotenv").config();

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require("discord.js");
const { Shoukaku, Connectors } = require("shoukaku");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});

const players = new Map();

/* Lavalink Setup */
const nodes = [{
  name: "Railway",
  url: process.env.LAVALINK_URL,
  auth: process.env.LAVALINK_PASSWORD,
  secure: true
}];

const shoukaku = new Shoukaku(
  new Connectors.DiscordJS(client),
  nodes
);

/* Slash Commands */
const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play song")
    .addStringOption(option =>
      option.setName("query").setDescription("Song name or link").setRequired(true)
    ),

  new SlashCommandBuilder().setName("pause").setDescription("Pause music"),
  new SlashCommandBuilder().setName("resume").setDescription("Resume music"),
  new SlashCommandBuilder().setName("skip").setDescription("Skip song"),

  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set volume")
    .addIntegerOption(option =>
      option.setName("amount").setDescription("1-200").setRequired(true)
    )
].map(cmd => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );

  console.log("Commands deployed");
}

/* Player */
async function getPlayer(interaction) {
  if (!interaction.member.voice.channel)
    return interaction.reply("Join voice channel first");

  const guildId = interaction.guild.id;

  if (!players.has(guildId)) {
    const node = shoukaku.getNode();

    const player = await node.joinChannel({
      guildId,
      channelId: interaction.member.voice.channel.id,
      shardId: 0,
      deaf: true
    });

    players.set(guildId, { player, queue: [] });

    player.on("end", () => {
      const data = players.get(guildId);
      if (!data) return;

      if (data.queue.length > 0) {
        const next = data.queue.shift();
        data.player.playTrack({ track: next.encoded });
      } else {
        data.player.disconnect();
        players.delete(guildId);
      }
    });
  }

  return players.get(guildId);
}

/* Ready */
client.once("ready", async () => {
  console.log("Bot online");
  await deployCommands();
});

/* Commands */
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = players.get(interaction.guild.id);

  if (interaction.commandName === "play") {
    const playerData = await getPlayer(interaction);
    if (!playerData) return;

    const query = interaction.options.getString("query");
    const node = shoukaku.getNode();
    const result = await node.rest.resolve(query);

    if (!result || !result.tracks.length)
      return interaction.reply("No results found");

    const track = result.tracks[0];

    if (playerData.player.playing) {
      playerData.queue.push(track);
      return interaction.reply("Added to queue: " + track.info.title);
    }

    await playerData.player.playTrack({ track: track.encoded });
    return interaction.reply("Now playing: " + track.info.title);
  }

  if (interaction.commandName === "pause") {
    if (!data) return interaction.reply("Nothing playing");
    data.player.pause(true);
    return interaction.reply("Paused");
  }

  if (interaction.commandName === "resume") {
    if (!data) return interaction.reply("Nothing playing");
    data.player.pause(false);
    return interaction.reply("Resumed");
  }

  if (interaction.commandName === "skip") {
    if (!data) return interaction.reply("Nothing playing");
    data.player.stopTrack();
    return interaction.reply("Skipped");
  }

  if (interaction.commandName === "volume") {
    if (!data) return interaction.reply("Nothing playing");
    const amount = interaction.options.getInteger("amount");
    data.player.setGlobalVolume(amount);
    return interaction.reply("Volume set to " + amount + "%");
  }
});

client.login(process.env.TOKEN);
/* Slash Commands */

const commands = [
  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play song")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Song name or link")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause music"),

  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume music"),

  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip song"),

  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set volume")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("1-200")
        .setRequired(true)
    )

].map(cmd => cmd.toJSON());

async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash commands deployed");
}

/* Player System */

async function getPlayer(interaction) {

  if (!interaction.member.voice.channel)
    return interaction.reply("Join a voice channel first.");

  const guildId = interaction.guild.id;

  if (!players.has(guildId)) {

    const node = shoukaku.getNode();

    const player = await node.joinChannel({
      guildId,
      channelId: interaction.member.voice.channel.id,
      shardId: 0,
      deaf: true
    });

    players.set(guildId, {
      player,
      queue: []
    });

    player.on("end", () => {
      const data = players.get(guildId);
      if (!data) return;

      if (data.queue.length > 0) {
        const next = data.queue.shift();
        data.player.playTrack({ track: next.encoded });
      } else {
        data.player.disconnect();
        players.delete(guildId);
      }
    });
  }

  return players.get(guildId);
}

/* Ready */

client.once("ready", async () => {
  console.log("Bot is online");
  await deployCommands();
});

/* Command Handler */

client.on("interactionCreate", async interaction => {

  if (!interaction.isChatInputCommand()) return;

  const guildId = interaction.guild.id;
  const data = players.get(guildId);

  if (interaction.commandName === "play") {

    const playerData = await getPlayer(interaction);
    if (!playerData) return;

    const query = interaction.options.getString("query");
    const node = shoukaku.getNode();
    const result = await node.rest.resolve(query);

    if (!result || !result.tracks.length)
      return interaction.reply("No results found.");

    const track = result.tracks[0];

    if (playerData.player.playing) {
      playerData.queue.push(track);
      return interaction.reply("Added to queue: " + track.info.title);
    }

    await playerData.player.playTrack({ track: track.encoded });
    return interaction.reply("Now playing: " + track.info.title);
  }

  if (interaction.commandName === "pause") {
    if (!data) return interaction.reply("Nothing playing.");
    data.player.pause(true);
    return interaction.reply("Paused");
  }

  if (interaction.commandName === "resume") {
    if (!data) return interaction.reply("Nothing playing.");
    data.player.pause(false);
    return interaction.reply("Resumed");
  }

  if (interaction.commandName === "skip") {
    if (!data) return interaction.reply("Nothing playing.");
    data.player.stopTrack();
    return interaction.reply("Skipped");
  }

  if (interaction.commandName === "volume") {
    if (!data) return interaction.reply("Nothing playing.");

    const amount = interaction.options.getInteger("amount");
    data.player.setGlobalVolume(amount);

    return interaction.reply("Volume set to " + amount + "%");
  }

});

client.login(process.env.TOKEN);  nodes
);

/* ================= SLASH COMMANDS ================= */

const commands = [

  new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play song from YouTube or Spotify")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Song name or link")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("addnext")
    .setDescription("Add song to play next")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("Song name or link")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("pause")
    .setDescription("Pause music"),

  new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume music"),

  new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip current song"),

  new SlashCommandBuilder()
    .setName("volume")
    .setDescription("Set volume (1-200)")
    .addIntegerOption(option =>
      option.setName("amount")
        .setDescription("1 - 200")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("247")
    .setDescription("Toggle 24/7 mode")

].map(cmd => cmd.toJSON());

/* ================= DEPLOY COMMANDS ================= */

async function deployCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Slash Commands Deployed"); 
