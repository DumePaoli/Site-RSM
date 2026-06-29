/**
 * Auto-translation script for frontend/src/i18n.js
 *
 * Reads FR source keys, finds missing translations in target languages,
 * calls Claude API, and inserts the new keys into the file.
 *
 * To add a new language:
 *   1. Add it to TARGET_LANGS below
 *   2. Add its display name to LANG_NAMES
 *   3. The script will create the block if it doesn't exist yet
 */

import { readFileSync, writeFileSync } from 'fs'
import vm from 'vm'

const SOURCE_LANG = 'fr'
const TARGET_LANGS = ['en'] // add 'de', 'es', 'pt', etc. here
const I18N_PATH = process.env.I18N_PATH || 'frontend/src/i18n.js'
const API_KEY = process.env.ANTHROPIC_API_KEY

if (!API_KEY) {
  console.error('ANTHROPIC_API_KEY not set')
  process.exit(1)
}

const LANG_NAMES = {
  en: 'English',
  de: 'German',
  es: 'Spanish',
  pt: 'Portuguese (Brazil)',
  it: 'Italian',
  nl: 'Dutch',
  ru: 'Russian',
  zh: 'Simplified Chinese',
}

// ── Parse i18n.js ────────────────────────────────────────────────────────────

function parseTranslations(content) {
  // Strip export keywords and const/let/var from top-level declarations
  // so vm.runInNewContext adds them to the sandbox context object
  const stripped = content
    .replace(/^export /gm, '')
    .replace(/\b(?:const|let|var)\s+(translations)\s*=/g, '$1 =')
  const ctx = {}
  vm.runInNewContext(stripped, ctx)
  if (!ctx.translations) throw new Error('Could not parse translations object')
  return ctx.translations
}

// ── Claude API call ──────────────────────────────────────────────────────────

async function translateBatch(strings, targetLang) {
  const langName = LANG_NAMES[targetLang] || targetLang

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `You are a professional UI translator. Translate the following French strings to ${langName}.

Context: RSM Pro is a Windows desktop app for managing Rust game servers.
Rules:
- Do NOT translate: RCON, wipe, Carbon, Oxide, HWID, Discord, Steam, RSM Pro, Stripe, FTP, ZIP, CPU, RAM
- Preserve placeholders exactly: {version}, {less}, {more}, etc.
- Keep the same tone: professional, concise, action-oriented
- Return ONLY a valid JSON object — same keys, translated values. No markdown, no explanation.

${JSON.stringify(strings, null, 2)}`,
      }],
    }),
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Anthropic API ${resp.status}: ${err}`)
  }

  const data = await resp.json()
  const text = data.content[0].text.trim()
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`No JSON in API response:\n${text}`)
  return JSON.parse(match[0])
}

// ── File manipulation ────────────────────────────────────────────────────────

/** Find the index of the closing } of the block starting at startIdx,
 *  correctly skipping string contents (handles {placeholders} in values). */
function findBlockEnd(content, startIdx) {
  let depth = 0
  let i = startIdx
  let inString = false
  let stringChar = ''
  let escaped = false

  while (i < content.length) {
    const ch = content[i]
    if (escaped) {
      escaped = false
    } else if (ch === '\\' && inString) {
      escaped = true
    } else if (inString) {
      if (ch === stringChar) inString = false
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true
      stringChar = ch
    } else if (ch === '{') {
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0) return i
    }
    i++
  }
  return -1
}

/** Serialize new key/value pairs as indented lines. */
function buildLines(entries) {
  return Object.entries(entries).map(([k, v]) => {
    const escaped = String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    return `    '${k}': '${escaped}',`
  }).join('\n')
}

/** Insert translated keys into the language block (or create the block). */
function insertKeys(content, lang, newKeys) {
  if (Object.keys(newKeys).length === 0) return content

  const lines = buildLines(newKeys)
  const blockMarker = `  ${lang}: {`
  const markerIdx = content.indexOf(blockMarker)

  if (markerIdx === -1) {
    // Block doesn't exist — create it before the final closing }
    const insertPos = content.lastIndexOf('\n}')
    const block = `\n  ${lang}: {\n${lines}\n  },\n`
    return content.slice(0, insertPos) + block + content.slice(insertPos)
  }

  // Find the opening { of this block
  const openBrace = content.indexOf('{', markerIdx)
  // Find the matching closing }
  const closeBrace = findBlockEnd(content, openBrace)
  if (closeBrace === -1) throw new Error(`Could not find closing brace for [${lang}] block`)

  // Insert just before the closing brace (inside the block)
  return content.slice(0, closeBrace) + '\n' + lines + '\n  ' + content.slice(closeBrace)
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const content = readFileSync(I18N_PATH, 'utf8')
  const translations = parseTranslations(content)
  const sourceKeys = Object.keys(translations[SOURCE_LANG])

  let updatedContent = content
  let totalAdded = 0

  for (const lang of TARGET_LANGS) {
    const existing = translations[lang] || {}
    const existingKeys = new Set(Object.keys(existing))
    const missingKeys = sourceKeys.filter(k => !existingKeys.has(k))

    if (missingKeys.length === 0) {
      console.log(`[${lang}] All keys present — skipping`)
      continue
    }

    console.log(`[${lang}] ${missingKeys.length} missing key(s): ${missingKeys.join(', ')}`)

    const toTranslate = {}
    for (const k of missingKeys) toTranslate[k] = translations[SOURCE_LANG][k]

    console.log(`[${lang}] Calling Claude API…`)
    const translated = await translateBatch(toTranslate, lang)

    updatedContent = insertKeys(updatedContent, lang, translated)
    totalAdded += Object.keys(translated).length
    console.log(`[${lang}] Added ${Object.keys(translated).length} translation(s)`)
  }

  if (totalAdded > 0) {
    writeFileSync(I18N_PATH, updatedContent, 'utf8')
    console.log(`\nDone — ${totalAdded} key(s) added.`)
  } else {
    console.log('No changes needed.')
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
