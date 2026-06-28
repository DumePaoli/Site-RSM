const {
  Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes,
  EmbedBuilder, PermissionFlagsBits, ChannelType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events,
  ModalBuilder, TextInputBuilder, TextInputStyle
} = require('discord.js')
const axios = require('axios')
const fs = require('fs')
const path = require('path')

const TOKEN    = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const GUILD_ID  = process.env.DISCORD_GUILD_ID

const CHANGELOG_CHANNEL_ID  = process.env.DISCORD_CHANGELOG_CHANNEL_ID
const WELCOME_CHANNEL_ID     = process.env.DISCORD_WELCOME_CHANNEL_ID
const TICKET_CATEGORY_ID     = process.env.DISCORD_TICKET_CATEGORY_ID
const VERIFIED_ROLE_ID       = process.env.DISCORD_VERIFIED_ROLE_ID
const SUPPORT_ROLE_ID        = process.env.DISCORD_SUPPORT_ROLE_ID
const CUSTOMER_ROLE_ID       = process.env.DISCORD_CUSTOMER_ROLE_ID || '1518016182307917954'

const LICENSE_SERVER = process.env.LICENSE_SERVER_URL || 'https://rsm-license-server.fly.dev'
const LICENSE_SECRET = process.env.LICENSE_ADMIN_SECRET || ''

const CONFIG_FILE = path.join(__dirname, 'welcome_config.json')

let _db = null
function getDb() { return _db }
function setDb(db) { _db = db }

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
  ]
})

// ── Slash commands definition
const commands = [
  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Ouvrir un ticket de support')
    .addStringOption(o => o.setName('sujet').setDescription('Décris ton problème').setRequired(true)),
  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Vérifier ta licence RSM Pro')
    .addStringOption(o => o.setName('cle').setDescription('Ta clé de licence (RSM-XXXX-XXXX-XXXX)').setRequired(true)),
  new SlashCommandBuilder()
    .setName('fermer')
    .setDescription('Fermer ce ticket de support'),
].map(c => c.toJSON())

async function registerCommands() {
  if (!TOKEN || !CLIENT_ID || !GUILD_ID) return
  try {
    const rest = new REST({ version: '10' }).setToken(TOKEN)
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands })
    console.log('[Bot] Slash commands enregistrées')
  } catch (e) {
    console.error('[Bot] Erreur enregistrement commandes:', e.message)
  }
}

// ── Welcome/Goodbye config (persistée sur disque)
const DEFAULT_WELCOME = {
  enabled: true,
  title: 'Bienvenue sur le Discord RSM Pro ! 👋',
  description: `Salut {user}! Bienvenue sur le serveur officiel de **Rust Server Manager Pro**.\n\n📋 Consulte **#faq** pour les questions fréquentes\n🎫 Utilise **/ticket** pour ouvrir un ticket de support\n🔑 Utilise **/verify** avec ta clé de licence pour obtenir le rôle vérifié`,
  color: '#c12814',
  footer: '',
  thumbnail: true,
}
const DEFAULT_GOODBYE = {
  enabled: false,
  channelId: '',
  title: 'Au revoir 👋',
  description: `{username} a quitté le serveur.`,
  color: '#6b7280',
  footer: '',
}

let welcomeConfig = { ...DEFAULT_WELCOME }
let goodbyeConfig = { ...DEFAULT_GOODBYE }

function loadWelcomeConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
      if (saved.welcome) Object.assign(welcomeConfig, saved.welcome)
      if (saved.goodbye) Object.assign(goodbyeConfig, saved.goodbye)
    }
  } catch (e) {
    console.error('[Bot] Erreur chargement welcome_config.json:', e.message)
  }
}

function saveWelcomeConfig() {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ welcome: welcomeConfig, goodbye: goodbyeConfig }, null, 2))
  } catch (e) {
    console.error('[Bot] Erreur sauvegarde welcome_config.json:', e.message)
  }
}

loadWelcomeConfig()

// ── Release checker
let lastKnownVersion = null

async function checkNewRelease() {
  try {
    const { data } = await axios.get(
      'https://api.github.com/repos/DumePaoli/Rust-Server-Manger2/releases/latest',
      { headers: { 'User-Agent': 'RSM-Bot' } }
    )
    if (!data.tag_name) return
    if (lastKnownVersion === null) { lastKnownVersion = data.tag_name; return }
    if (data.tag_name === lastKnownVersion) return
    lastKnownVersion = data.tag_name
    const guild = client.guilds.cache.get(GUILD_ID)
    const channel = guild?.channels.cache.get(CHANGELOG_CHANNEL_ID)
      ?? await guild?.channels.fetch(CHANGELOG_CHANNEL_ID).catch(() => null)
    if (!channel) return
    const embed = new EmbedBuilder()
      .setTitle(`🚀 Rust Server Manager Pro ${data.tag_name}`)
      .setDescription(data.body ? data.body.slice(0, 4000) : 'Nouvelle version disponible.')
      .setColor(0xc12814)
      .setURL(data.html_url)
      .setTimestamp(new Date(data.published_at))
      .setFooter({ text: 'RSM Pro — Mise à jour automatique' })
    await channel.send({ embeds: [embed] })
    console.log(`[Bot] Annonce release ${data.tag_name}`)
  } catch {}
}

// ── Helper: verify a license key and assign roles
async function verifyLicenseKey(key, member) {
  const { data } = await axios.get(`${LICENSE_SERVER}/license/${key}`, {
    headers: { 'X-Admin-Secret': LICENSE_SECRET }
  })
  if (!data || data.detail) throw new Error('Clé introuvable')
  if (VERIFIED_ROLE_ID) {
    const role = member.guild.roles.cache.get(VERIFIED_ROLE_ID)
    if (role) await member.roles.add(role)
  }
  if (CUSTOMER_ROLE_ID) {
    const customerRole = member.guild.roles.cache.get(CUSTOMER_ROLE_ID)
    if (customerRole) await member.roles.add(customerRole)
  }
}

// ── Events
client.once(Events.ClientReady, async () => {
  console.log(`[Bot] Connecté en tant que ${client.user.tag}`)
  try {
    const guild = client.guilds.cache.get(GUILD_ID)
    if (guild) await guild.channels.fetch()
  } catch(e) { console.error('[Bot] Erreur fetch channels:', e.message) }
  await registerCommands()
  await checkNewRelease()
  setInterval(checkNewRelease, 3600_000)
})

// Welcome avec dedup DB
client.on(Events.GuildMemberAdd, async (member) => {
  if (!welcomeConfig.enabled) return
  const db = getDb()

  if (db) {
    try {
      const result = await db.run(
        'INSERT IGNORE INTO discord_welcomes (discord_id, sent_at) VALUES (?, NOW())',
        [member.id]
      )
      if (result.affectedRows === 0) return
      await db.run("DELETE FROM discord_welcomes WHERE sent_at < NOW() - INTERVAL 60 SECOND").catch(() => {})
    } catch (e) {
      console.error('[Bot] Erreur dedup welcome:', e.message)
    }
  }

  const guild = member.guild
  await guild.channels.fetch().catch(() => {})
  const channel = guild.channels.cache.get(WELCOME_CHANNEL_ID)
  if (!channel) return
  const desc = welcomeConfig.description
    .replace(/{user}/g, `${member}`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{memberCount}/g, guild.memberCount)
  const embed = new EmbedBuilder()
    .setDescription(desc)
    .setColor(parseInt((welcomeConfig.color || '#c12814').replace('#', ''), 16))
    .setTimestamp()
  if (welcomeConfig.title) embed.setTitle(welcomeConfig.title)
  if (welcomeConfig.footer) embed.setFooter({ text: welcomeConfig.footer })
  if (welcomeConfig.thumbnail) embed.setThumbnail(member.user.displayAvatarURL())
  await channel.send({ embeds: [embed] }).catch(() => {})
})

client.on(Events.GuildMemberRemove, async (member) => {
  if (!goodbyeConfig.enabled) return
  const guild = member.guild
  await guild.channels.fetch().catch(() => {})
  const channelId = goodbyeConfig.channelId || WELCOME_CHANNEL_ID
  const channel = guild.channels.cache.get(channelId)
  if (!channel) return
  const desc = goodbyeConfig.description
    .replace(/{user}/g, `${member}`)
    .replace(/{username}/g, member.user.username)
    .replace(/{server}/g, guild.name)
    .replace(/{memberCount}/g, guild.memberCount)
  const embed = new EmbedBuilder()
    .setDescription(desc)
    .setColor(parseInt((goodbyeConfig.color || '#6b7280').replace('#', ''), 16))
    .setTimestamp()
  if (goodbyeConfig.title) embed.setTitle(goodbyeConfig.title)
  if (goodbyeConfig.footer) embed.setFooter({ text: goodbyeConfig.footer })
  await channel.send({ embeds: [embed] }).catch(() => {})
})

// Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // ── /ticket
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
    const sujet = interaction.options.getString('sujet')
    const guild = interaction.guild
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username.toLowerCase().replace(/\s/g, '-')}`
    )
    if (existing) return interaction.reply({ content: `Tu as déjà un ticket ouvert: ${existing}`, ephemeral: true })
    const perms = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]
    if (SUPPORT_ROLE_ID) perms.push({ id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })
    const channel = await guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase().replace(/\s/g, '-')}`,
      type: ChannelType.GuildText,
      parent: TICKET_CATEGORY_ID || null,
      permissionOverwrites: perms,
    })
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
    )
    const embed = new EmbedBuilder()
      .setTitle(`🎫 Ticket — ${sujet}`)
      .setDescription(`Bonjour ${interaction.user}! Notre équipe va te répondre dès que possible.\n\n**Sujet:** ${sujet}\n\nDécris ton problème en détail ci-dessous.`)
      .setColor(0xc12814).setTimestamp()
    await channel.send({ embeds: [embed], components: [row] })
    await interaction.reply({ content: `Ticket créé: ${channel}`, ephemeral: true })
  }

  // ── /verify
  if (interaction.isChatInputCommand() && interaction.commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true })
    const key = interaction.options.getString('cle').trim().toUpperCase()
    if (!key.match(/^RSM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return interaction.editReply('❌ Format invalide. La clé doit être `RSM-XXXX-XXXX-XXXX`.')
    }
    try {
      await verifyLicenseKey(key, interaction.member)
      const embed = new EmbedBuilder()
        .setTitle('✅ Licence vérifiée')
        .setDescription(`Ta clé **${key}** est valide. Le rôle **Utilisateur vérifié** t'a été attribué.`)
        .setColor(0x22c55e).setTimestamp()
      await interaction.editReply({ embeds: [embed] })
    } catch {
      await interaction.editReply('❌ Clé introuvable. Vérifie ta clé dans ton espace client.')
    }
  }

  // ── /fermer
  if (interaction.isChatInputCommand() && interaction.commandName === 'fermer') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Cette commande est uniquement pour les tickets.', ephemeral: true })
    }
    await interaction.reply('🔒 Ticket fermé. Ce salon va être supprimé dans 5 secondes.')
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }

  // ── Bouton ouvrir ticket
  if (interaction.isButton() && interaction.customId === 'open_ticket') {
    const modal = new ModalBuilder().setCustomId('ticket_modal').setTitle('Ouvrir un ticket')
    const sujetInput = new TextInputBuilder()
      .setCustomId('ticket_sujet').setLabel('Décris ton problème')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ex: Problème de connexion, question sur une fonctionnalité...')
      .setRequired(true).setMaxLength(500)
    modal.addComponents(new ActionRowBuilder().addComponents(sujetInput))
    await interaction.showModal(modal)
  }

  // ── Bouton vérifier licence
  if (interaction.isButton() && interaction.customId === 'verify_key') {
    const modal = new ModalBuilder().setCustomId('verify_modal').setTitle('Vérifier ma licence RSM Pro')
    const keyInput = new TextInputBuilder()
      .setCustomId('verify_key_input')
      .setLabel('Clé de licence')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('RSM-XXXX-XXXX-XXXX')
      .setRequired(true)
      .setMinLength(16)
      .setMaxLength(20)
    modal.addComponents(new ActionRowBuilder().addComponents(keyInput))
    await interaction.showModal(modal)
  }

  // ── Modal ticket soumis
  if (interaction.isModalSubmit() && interaction.customId === 'ticket_modal') {
    await interaction.deferReply({ ephemeral: true })
    try {
      const sujet = interaction.fields.getTextInputValue('ticket_sujet')
      const guild = interaction.guild
      const existing = guild.channels.cache.find(
        c => c.name === `ticket-${interaction.user.username.toLowerCase().replace(/\s/g, '-')}`
      )
      if (existing) return interaction.editReply({ content: `Tu as déjà un ticket ouvert: ${existing}` })
      const perms = [
        { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
      ]
      if (SUPPORT_ROLE_ID) perms.push({ id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })
      const channel = await guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase().replace(/\s/g, '-')}`,
        type: ChannelType.GuildText,
        parent: TICKET_CATEGORY_ID || null,
        permissionOverwrites: perms,
      })
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('Fermer le ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
      )
      const embed = new EmbedBuilder()
        .setTitle(`🎫 Ticket — ${sujet}`)
        .setDescription(`Bonjour ${interaction.user}! Notre équipe va te répondre dès que possible.\n\n**Sujet:** ${sujet}\n\nDécris ton problème en détail ci-dessous.`)
        .setColor(0xc12814).setTimestamp()
      await channel.send({ embeds: [embed], components: [row] })
      await interaction.editReply({ content: `Ticket créé: ${channel}` })
    } catch(e) {
      await interaction.editReply({ content: `❌ Erreur: ${e.message}` }).catch(() => {})
    }
  }

  // ── Modal vérification licence soumis
  if (interaction.isModalSubmit() && interaction.customId === 'verify_modal') {
    await interaction.deferReply({ ephemeral: true })
    const key = interaction.fields.getTextInputValue('verify_key_input').trim().toUpperCase()
    if (!key.match(/^RSM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return interaction.editReply('❌ Format invalide. La clé doit être au format `RSM-XXXX-XXXX-XXXX`.')
    }
    try {
      await verifyLicenseKey(key, interaction.member)
      const embed = new EmbedBuilder()
        .setTitle('✅ Licence vérifiée !')
        .setDescription(`Ta clé **${key}** est valide.\nLe rôle **Client vérifié** t'a été attribué.`)
        .setColor(0x22c55e)
        .setTimestamp()
      await interaction.editReply({ embeds: [embed] })
    } catch {
      await interaction.editReply('❌ Clé introuvable ou invalide. Vérifie ta clé dans ton espace client sur **rustservermanagerpro.com**.')
    }
  }

  // ── Bouton fermer
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.reply('🔒 Ticket fermé. Ce salon va être supprimé dans 5 secondes.')
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }
})

// ── Start
function startBot(db) {
  if (!TOKEN) { console.warn('[Bot] DISCORD_TOKEN manquant — bot désactivé'); return }
  if (db) setDb(db)
  client.login(TOKEN).catch(e => console.error('[Bot] Erreur login:', e.message))
}

// ── Bot control API
function getBotStats() {
  if (!client.isReady()) return { online: false }
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) return { online: true, guild: null }
  return {
    online: true,
    tag: client.user.tag,
    memberCount: guild.memberCount,
    channelCount: guild.channels.cache.size,
    roleCount: guild.roles.cache.size,
    guildName: guild.name,
    guildIcon: guild.iconURL({ size: 64 }),
    uptime: Math.floor(client.uptime / 1000),
  }
}

async function getTextChannels() {
  if (!client.isReady()) return []
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) return []
  await guild.channels.fetch().catch(() => {})
  return guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({ id: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

function getOpenTickets() {
  if (!client.isReady()) return []
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) return []
  return guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText && c.name.startsWith('ticket-'))
    .map(c => ({ id: c.id, name: c.name, createdAt: c.createdAt }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

async function closeTicket(channelId) {
  const channel = client.channels.cache.get(channelId)
  if (!channel) throw new Error('Channel introuvable')
  await channel.send('🔒 Ticket fermé par un administrateur.')
  await new Promise(r => setTimeout(r, 2000))
  await channel.delete()
}

async function sendEmbed(channelId, { title, description, color, footer, image, thumbnail }) {
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) throw new Error('Guild introuvable')
  await guild.channels.fetch().catch(() => {})
  const channel = guild.channels.cache.get(channelId)
  if (!channel) throw new Error(`Channel ${channelId} introuvable (${guild.channels.cache.size} channels en cache)`)
  const embed = new EmbedBuilder()
    .setDescription(description || '')
    .setColor(parseInt((color || '#c12814').replace('#', ''), 16))
    .setTimestamp()
  if (title) embed.setTitle(title)
  if (footer) embed.setFooter({ text: footer })
  if (image) embed.setImage(image)
  if (thumbnail) embed.setThumbnail(thumbnail)
  await channel.send({ embeds: [embed] })
}

async function triggerReleaseAnnounce({ tag_name, body, html_url, published_at }) {
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) throw new Error('Guild introuvable')
  await guild.channels.fetch().catch(() => {})
  const channel = guild.channels.cache.get(CHANGELOG_CHANNEL_ID)
  if (!channel) throw new Error(`Channel ${CHANGELOG_CHANNEL_ID} introuvable (${guild.channels.cache.size} channels en cache)`)
  const embed = new EmbedBuilder()
    .setTitle(`🚀 Rust Server Manager Pro ${tag_name}`)
    .setDescription(body ? body.slice(0, 4000) : 'Nouvelle version disponible.')
    .setColor(0xc12814).setURL(html_url)
    .setTimestamp(new Date(published_at))
    .setFooter({ text: 'RSM Pro — Annonce manuelle' })
  try { await channel.send({ embeds: [embed] }) } catch(e) { throw new Error(`Envoi Discord échoué: ${e.message}`) }
  lastKnownVersion = tag_name
}

async function sendTicketEmbed(channelId, { title, description, color, footer, image, thumbnail }) {
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) throw new Error('Guild introuvable')
  await guild.channels.fetch().catch(() => {})
  const channel = guild.channels.cache.get(channelId)
  if (!channel) throw new Error(`Channel ${channelId} introuvable (${guild.channels.cache.size} channels en cache)`)
  const embed = new EmbedBuilder()
    .setDescription(description || 'Clique sur le bouton ci-dessous pour ouvrir un ticket.')
    .setColor(parseInt((color || '#c12814').replace('#', ''), 16))
    .setTimestamp()
  if (title) embed.setTitle(title)
  if (footer) embed.setFooter({ text: footer })
  if (image) embed.setImage(image)
  if (thumbnail) embed.setThumbnail(thumbnail)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('open_ticket').setLabel('Ouvrir un ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫')
  )
  await channel.send({ embeds: [embed], components: [row] })
}

async function sendVerifyEmbed(channelId, { title, description, color, footer, image, thumbnail }) {
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) throw new Error('Guild introuvable')
  await guild.channels.fetch().catch(() => {})
  const channel = guild.channels.cache.get(channelId)
  if (!channel) throw new Error(`Channel ${channelId} introuvable (${guild.channels.cache.size} channels en cache)`)
  const embed = new EmbedBuilder()
    .setDescription(description || 'Clique sur le bouton ci-dessous pour vérifier ta clé de licence et obtenir le rôle Client.')
    .setColor(parseInt((color || '#c12814').replace('#', ''), 16))
    .setTimestamp()
  if (title) embed.setTitle(title)
  if (footer) embed.setFooter({ text: footer })
  if (image) embed.setImage(image)
  if (thumbnail) embed.setThumbnail(thumbnail)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('verify_key').setLabel('Vérifier ma licence').setStyle(ButtonStyle.Success).setEmoji('🔑')
  )
  await channel.send({ embeds: [embed], components: [row] })
}

function getWelcomeConfig() { return { welcome: welcomeConfig, goodbye: goodbyeConfig } }
function setWelcomeConfig(data) {
  if (data.welcome) Object.assign(welcomeConfig, data.welcome)
  if (data.goodbye) Object.assign(goodbyeConfig, data.goodbye)
  saveWelcomeConfig()
}

function getBotDebug() {
  return {
    ready: client.isReady(),
    GUILD_ID,
    CHANGELOG_CHANNEL_ID,
    guildFound: !!client.guilds.cache.get(GUILD_ID),
    changelogChannelFound: !!client.channels.cache.get(CHANGELOG_CHANNEL_ID),
    allChannels: client.isReady() && client.guilds.cache.get(GUILD_ID)
      ? client.guilds.cache.get(GUILD_ID).channels.cache.map(c => ({ id: c.id, name: c.name, type: c.type }))
      : [],
  }
}

async function assignCustomerRole(discordId) {
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) throw new Error('Guild non trouvé')
  const member = await guild.members.fetch(discordId).catch(() => null)
  if (!member) throw new Error('Membre Discord introuvable — assure-toi d\'être dans le serveur')
  const role = guild.roles.cache.get(CUSTOMER_ROLE_ID)
  if (!role) throw new Error('Rôle Customer introuvable')
  await member.roles.add(role)
}

module.exports = { startBot, getBotStats, getTextChannels, getOpenTickets, closeTicket, sendEmbed, sendTicketEmbed, sendVerifyEmbed, triggerReleaseAnnounce, getBotDebug, getWelcomeConfig, setWelcomeConfig, assignCustomerRole }
