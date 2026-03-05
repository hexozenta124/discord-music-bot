require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");

const { Shoukaku, Connectors } = require("shoukaku");

/* ================= CLIENT ================= */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const players = new Map();

/* ================= LAVALINK ================= */

const nodes = [
  {
    name: "Railway",
    url: process.env.LAVALINK_URL,
    auth: process.env.LAVALINK_PASSWORD,
    secure: false
  }
];

const shoukaku = new Shoukaku(
  new Connectors.DiscordJS(client),
  nodes
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

  console.log("✅ Slash 