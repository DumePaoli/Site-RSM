const {
  Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes,
  EmbedBuilder, PermissionFlagsBits, ChannelType,
  ActionRowBuilder, ButtonBuilder, ButtonStyle, Events
} = require('discord.js')
const axios = require('axios')

const TOKEN    = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const GUILD_ID  = process.env.DISCORD_GUILD_ID

const CHANGELOG_CHANNEL_ID  = process.env.DISCORD_CHANGELOG_CHANNEL_ID
const WELCOME_CHANNEL_ID     = process.env.DISCORD_WELCOME_CHANNEL_ID
const TICKET_CATEGORY_ID     = process.env.DISCORD_TICKET_CATEGORY_ID
const VERIFIED_ROLE_ID       = process.env.DISCORD_VERIFIED_ROLE_ID
const SUPPORT_ROLE_ID        = process.env.DISCORD_SUPPORT_ROLE_ID

const LICENSE_SERVER = process.env.LICENSE_SERVER_URL || 'https://rsm-license-server.fly.dev'
const LICENSE_SECRET = process.env.LICENSE_ADMIN_SECRET || ''

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
})

// ── Slash commands definition ──────────────────────────────────────────────
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

// ── Register slash commands ────────────────────────────────────────────────
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

// ── Release checker ────────────────────────────────────────────────────────
let lastKnownVersion = null

async function checkNewRelease() {
  try {
    const headers = { 'User-Agent': 'RSM-Bot' }
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    const { data } = await axios.get(
      'https://api.github.com/repos/DumePaoli/Rust-Server-Manger2/releases/latest',
      { headers }
    )
    if (!data.tag_name) return
    if (lastKnownVersion === null) { lastKnownVersion = data.tag_name; return }
    if (data.tag_name === lastKnownVersion) return

    lastKnownVersion = data.tag_name
    const channel = client.channels.cache.get(CHANGELOG_CHANNEL_ID)
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
  } catch (e) {
    // silently ignore
  }
}

// ── Events ─────────────────────────────────────────────────────────────────
client.once(Events.ClientReady, async () => {
  console.log(`[Bot] Connecté en tant que ${client.user.tag}`)
  await registerCommands()
  await checkNewRelease()
  setInterval(checkNewRelease, 3600_000)
})

// Welcome
client.on(Events.GuildMemberAdd, async (member) => {
  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID)
  if (!channel) return
  const embed = new EmbedBuilder()
    .setTitle('Bienvenue sur le Discord RSM Pro ! 👋')
    .setDescription(
      `Salut ${member}! Bienvenue sur le serveur officiel de **Rust Server Manager Pro**.\n\n` +
      `📋 Consulte **#faq** pour les questions fréquentes\n` +
      `🎫 Utilise **/ticket** pour ouvrir un ticket de support\n` +
      `🔑 Utilise **/verify** avec ta clé de licence pour obtenir le rôle vérifié`
    )
    .setColor(0xc12814)
    .setThumbnail(member.user.displayAvatarURL())
    .setTimestamp()
  await channel.send({ embeds: [embed] })
})

// Interactions
client.on(Events.InteractionCreate, async (interaction) => {
  // ── /ticket ──
  if (interaction.isChatInputCommand() && interaction.commandName === 'ticket') {
    const sujet = interaction.options.getString('sujet')
    const guild = interaction.guild
    const existing = guild.channels.cache.find(
      c => c.name === `ticket-${interaction.user.username.toLowerCase().replace(/\s/g, '-')}`
    )
    if (existing) {
      return interaction.reply({ content: `Tu as déjà un ticket ouvert: ${existing}`, ephemeral: true })
    }

    const perms = [
      { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    ]
    if (SUPPORT_ROLE_ID) {
      perms.push({ id: SUPPORT_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] })
    }

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
      .setDescription(
        `Bonjour ${interaction.user}! Notre équipe va te répondre dès que possible.\n\n` +
        `**Sujet:** ${sujet}\n\nDécris ton problème en détail ci-dessous.`
      )
      .setColor(0xc12814)
      .setTimestamp()

    await channel.send({ embeds: [embed], components: [row] })
    await interaction.reply({ content: `Ticket créé: ${channel}`, ephemeral: true })
  }

  // ── /verify ──
  if (interaction.isChatInputCommand() && interaction.commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true })
    const key = interaction.options.getString('cle').trim().toUpperCase()

    if (!key.match(/^RSM-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
      return interaction.editReply('❌ Format invalide. La clé doit être `RSM-XXXX-XXXX-XXXX`.')
    }

    try {
      const { data } = await axios.get(`${LICENSE_SERVER}/license/${key}`, {
        headers: { 'X-Admin-Secret': LICENSE_SECRET }
      })
      if (!data || data.detail) {
        return interaction.editReply('❌ Clé de licence introuvable ou invalide.')
      }

      if (VERIFIED_ROLE_ID) {
        const role = interaction.guild.roles.cache.get(VERIFIED_ROLE_ID)
        if (role) await interaction.member.roles.add(role)
      }

      const embed = new EmbedBuilder()
        .setTitle('✅ Licence vérifiée')
        .setDescription(`Ta clé **${key}** est valide. Le rôle **Utilisateur vérifié** t'a été attribué.`)
        .setColor(0x22c55e)
        .setTimestamp()

      await interaction.editReply({ embeds: [embed] })
    } catch {
      await interaction.editReply('❌ Clé introuvable. Vérifie ta clé dans ton espace client.')
    }
  }

  // ── /fermer ──
  if (interaction.isChatInputCommand() && interaction.commandName === 'fermer') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Cette commande est uniquement pour les tickets.', ephemeral: true })
    }
    await interaction.reply('🔒 Ticket fermé. Ce salon va être supprimé dans 5 secondes.')
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }

  // ── Bouton fermer ──
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    await interaction.reply('🔒 Ticket fermé. Ce salon va être supprimé dans 5 secondes.')
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000)
  }
})

// ── Start ──────────────────────────────────────────────────────────────────
function startBot() {
  if (!TOKEN) { console.warn('[Bot] DISCORD_TOKEN manquant — bot désactivé'); return }
  client.login(TOKEN).catch(e => console.error('[Bot] Erreur login:', e.message))
}

// ── Bot control API ────────────────────────────────────────────────────────
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

function getTextChannels() {
  if (!client.isReady()) return []
  const guild = client.guilds.cache.get(GUILD_ID)
  if (!guild) return []
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
  const channel = client.channels.cache.get(channelId)
  if (!channel) throw new Error('Channel introuvable')
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

async function triggerReleaseAnnounce() {
  try {
    const headers = { 'User-Agent': 'RSM-Bot' }
    if (process.env.GITHUB_TOKEN) headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
    const { data } = await axios.get(
      'https://api.github.com/repos/DumePaoli/Rust-Server-Manger2/releases/latest',
      { headers }
    )
    if (!data.tag_name) throw new Error('Pas de release trouvée')
    const channel = client.channels.cache.get(CHANGELOG_CHANNEL_ID)
    if (!channel) throw new Error('Channel changelog introuvable')
    const embed = new EmbedBuilder()
      .setTitle(`🚀 Rust Server Manager Pro ${data.tag_name}`)
      .setDescription(data.body ? data.body.slice(0, 4000) : 'Nouvelle version disponible.')
      .setColor(0xc12814)
      .setURL(data.html_url)
      .setTimestamp(new Date(data.published_at))
      .setFooter({ text: 'RSM Pro — Annonce manuelle' })
    await channel.send({ embeds: [embed] })
    lastKnownVersion = data.tag_name
  } catch(e) {
    throw new Error(e.message)
  }
}

module.exports = { startBot, getBotStats, getTextChannels, getOpenTickets, closeTicket, sendEmbed, triggerReleaseAnnounce }
