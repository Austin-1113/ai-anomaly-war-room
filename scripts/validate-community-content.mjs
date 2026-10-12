import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('docs/community')
const directories = [
  ['qa', 'qa'],
  ['guides', 'guide'],
  ['faq', 'faq'],
]
const requiredQaSections = ['測試目的', '前置條件', '操作步驟', '預期結果', '實際觀察']
const scenarioIds = new Set(['EVT-001', 'EVT-002', 'EVT-003', 'EVT-004', 'EVT-005'])
const stageIds = new Set(['baseline', 'sensing', 'diagnosis', 'decision'])
const statuses = new Set(['proposed', 'reviewing', 'accepted', 'promoted'])
const ids = new Set()
const errors = []

function fail(file, message) {
  errors.push(`${file}: ${message}`)
}

function parse(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) {
    fail(file, '缺少 front matter。')
    return null
  }
  const fields = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) {
      fail(file, `front matter 格式錯誤：${line}`)
      return null
    }
    fields[line.slice(0, separator).trim()] = line.slice(separator + 1).trim()
  }
  return { fields, body: match[2].trim() }
}

for (const [directory, expectedKind] of directories) {
  const directoryPath = path.join(root, directory)
  const files = (await readdir(directoryPath)).filter((file) => file.endsWith('.md')).sort()
  for (const filename of files) {
    const relative = path.join('docs/community', directory, filename)
    const parsed = parse(await readFile(path.join(directoryPath, filename), 'utf8'), relative)
    if (!parsed) continue
    const { fields, body } = parsed
    const expectedId = path.basename(filename, '.md')

    for (const key of ['kind', 'id', 'title', 'author', 'created']) {
      if (!fields[key]) fail(relative, `缺少必要欄位 ${key}。`)
    }
    if (fields.kind !== expectedKind) fail(relative, `kind 應為 ${expectedKind}。`)
    if (fields.id !== expectedId) fail(relative, 'id 必須與檔名相同。')
    if (ids.has(fields.id)) fail(relative, `id 重複：${fields.id}。`)
    ids.add(fields.id)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.created ?? '')) fail(relative, 'created 必須為 YYYY-MM-DD。')
    if (body.length < 80) fail(relative, '正文過短，請提供可審查的內容。')
    if (/<\/?[a-z][^>]*>/i.test(body) || /https?:\/\//i.test(body)) fail(relative, '不允許原始 HTML 或外部網址。')
    if (/\b[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}\b/.test(body) || /[A-Za-z]\d{7}/.test(body)) fail(relative, '不得包含 email 或學號。')

    if (expectedKind === 'qa') {
      if (!scenarioIds.has(fields.scenario)) fail(relative, 'scenario 必須是 EVT-001～EVT-005。')
      if (!stageIds.has(fields.stage)) fail(relative, 'stage 必須是 baseline、sensing、diagnosis 或 decision。')
      if (!statuses.has(fields.status)) fail(relative, 'status 不合法。')
      const headings = Array.from(body.matchAll(/^##\s+(.+?)\s*$/gm)).map((match) => match[1].trim())
      for (const section of requiredQaSections) {
        if (!headings.includes(section)) fail(relative, `缺少章節「${section}」。`)
      }
    } else if (!/^##\s+說明\s*$/m.test(body)) {
      fail(relative, '說明或 FAQ 必須包含「## 說明」。')
    }
  }
}

if (errors.length) {
  console.error(`社群內容驗證失敗（${errors.length} 項）：`)
  errors.forEach((error) => console.error(`- ${error}`))
  process.exit(1)
}

console.log(`社群內容驗證通過：${ids.size} 份 Markdown。`)
