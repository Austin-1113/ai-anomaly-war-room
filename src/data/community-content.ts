export type CommunityKind = 'qa' | 'guide' | 'faq'
export type CommunityStatus = 'proposed' | 'reviewing' | 'accepted' | 'promoted'

export interface CommunitySection {
  heading: string
  content: string
}

export interface CommunityItem {
  kind: CommunityKind
  id: string
  title: string
  author: string
  created: string
  scenario?: string
  stage?: string
  status?: CommunityStatus
  sections: CommunitySection[]
}

const markdownModules = import.meta.glob('../../docs/community/{qa,guides,faq}/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>

function parseFrontMatter(raw: string): { fields: Record<string, string>; body: string } | null {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null

  const fields: Record<string, string> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':')
    if (separator < 1) return null
    const key = line.slice(0, separator).trim()
    const value = line.slice(separator + 1).trim()
    if (!key || !value) return null
    fields[key] = value
  }
  return { fields, body: match[2].trim() }
}

function parseSections(body: string): CommunitySection[] {
  const matches = Array.from(body.matchAll(/^##\s+(.+?)\s*$/gm))
  return matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? body.length) : body.length
    return { heading: match[1].trim(), content: body.slice(start, end).trim() }
  })
}

function parseItem(raw: string): CommunityItem | null {
  const parsed = parseFrontMatter(raw)
  if (!parsed) return null
  const { fields, body } = parsed
  if (!['qa', 'guide', 'faq'].includes(fields.kind)) return null
  if (!fields.id || !fields.title || !fields.author || !fields.created) return null

  return {
    kind: fields.kind as CommunityKind,
    id: fields.id,
    title: fields.title,
    author: fields.author,
    created: fields.created,
    scenario: fields.scenario,
    stage: fields.stage,
    status: fields.status as CommunityStatus | undefined,
    sections: parseSections(body),
  }
}

export const COMMUNITY_ITEMS: CommunityItem[] = Object.entries(markdownModules)
  .map(([, raw]) => parseItem(raw))
  .filter((item): item is CommunityItem => item !== null)
  .sort((a, b) => a.id.localeCompare(b.id, 'en'))
