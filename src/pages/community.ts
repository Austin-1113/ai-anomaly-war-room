import { COMMUNITY_ITEMS, type CommunityItem, type CommunityKind, type CommunityStatus } from '../data/community-content'

const KIND_LABELS: Record<CommunityKind, string> = {
  qa: 'QA 案例',
  guide: '操作說明',
  faq: '常見問題',
}

const STATUS_LABELS: Record<CommunityStatus, string> = {
  proposed: '待審核',
  reviewing: '審核中',
  accepted: '已收錄',
  promoted: '已納入正式測試',
}

function makeOption(value: string, label: string): HTMLOptionElement {
  const option = document.createElement('option')
  option.value = value
  option.textContent = label
  return option
}

function makeSelect(labelText: string, options: Array<[string, string]>): { label: HTMLLabelElement; select: HTMLSelectElement } {
  const label = document.createElement('label')
  label.className = 'community-filter'
  label.textContent = `${labelText} `
  const select = document.createElement('select')
  options.forEach(([value, text]) => select.append(makeOption(value, text)))
  label.append(select)
  return { label, select }
}

function createCard(item: CommunityItem): HTMLElement {
  const article = document.createElement('article')
  article.className = 'community-card'

  const heading = document.createElement('h2')
  heading.textContent = `${item.id}｜${item.title}`
  article.append(heading)

  const meta = document.createElement('p')
  meta.className = 'community-meta'
  const labels = [KIND_LABELS[item.kind], item.scenario, item.stage, item.status ? STATUS_LABELS[item.status] : undefined]
    .filter(Boolean)
    .join('・')
  meta.textContent = `${labels}｜投稿者：${item.author}｜建立：${item.created}`
  article.append(meta)

  item.sections.forEach((section) => {
    const sectionHeading = document.createElement('h3')
    sectionHeading.textContent = section.heading
    const content = document.createElement('p')
    content.className = 'community-section-content'
    // Markdown 內容一律以 textContent 輸出，避免投稿內容成為 HTML／XSS 邊界。
    content.textContent = section.content
    article.append(sectionHeading, content)
  })

  return article
}

export function renderCommunity(root: HTMLElement): void {
  const page = document.createElement('section')
  page.className = 'community-page'

  const title = document.createElement('h1')
  title.textContent = 'QA 與使用說明'
  const intro = document.createElement('p')
  intro.className = 'meta'
  intro.textContent = '內容由 repository 內的 Markdown 於建置時內嵌。投稿內容須經維護者審核；此頁不取代正式測試計畫與測試結果。'
  page.append(title, intro)

  const stats = document.createElement('p')
  stats.className = 'community-stats'
  const proposedCount = COMMUNITY_ITEMS.filter((item) => item.status === 'proposed').length
  const promotedCount = COMMUNITY_ITEMS.filter((item) => item.status === 'promoted').length
  stats.textContent = `共 ${COMMUNITY_ITEMS.length} 筆內容｜待審核 ${proposedCount} 筆｜已納入正式測試 ${promotedCount} 筆`
  page.append(stats)

  const controls = document.createElement('div')
  controls.className = 'community-controls'
  const kindOptions: Array<[string, string]> = [['', '全部'], ...Object.entries(KIND_LABELS)]
  const scenarioOptions: Array<[string, string]> = [
    ['', '全部'],
    ...['EVT-001', 'EVT-002', 'EVT-003', 'EVT-004', 'EVT-005'].map((id): [string, string] => [id, id]),
  ]
  const statusOptions: Array<[string, string]> = [['', '全部'], ...Object.entries(STATUS_LABELS)]
  const kindControl = makeSelect('類型', kindOptions)
  const scenarioControl = makeSelect('情境', scenarioOptions)
  const statusControl = makeSelect('狀態', statusOptions)
  const searchLabel = document.createElement('label')
  searchLabel.className = 'community-filter'
  searchLabel.textContent = '搜尋 '
  const search = document.createElement('input')
  search.type = 'search'
  search.placeholder = '標題、編號或文字內容'
  search.setAttribute('aria-label', '搜尋 QA 與使用說明')
  searchLabel.append(search)
  controls.append(kindControl.label, scenarioControl.label, statusControl.label, searchLabel)
  page.append(controls)

  const results = document.createElement('div')
  results.className = 'community-results'
  page.append(results)

  const renderResults = () => {
    const keyword = search.value.trim().toLocaleLowerCase('zh-Hant')
    const visibleItems = COMMUNITY_ITEMS.filter((item) => {
      const text = [item.id, item.title, item.scenario, item.stage, ...item.sections.map((section) => section.content)]
        .filter(Boolean)
        .join('\n')
        .toLocaleLowerCase('zh-Hant')
      return (
        (!kindControl.select.value || item.kind === kindControl.select.value) &&
        (!scenarioControl.select.value || item.scenario === scenarioControl.select.value) &&
        (!statusControl.select.value || item.status === statusControl.select.value) &&
        (!keyword || text.includes(keyword))
      )
    })

    results.replaceChildren()
    if (!visibleItems.length) {
      const empty = document.createElement('p')
      empty.className = 'community-empty'
      empty.textContent = '沒有符合條件的內容。'
      results.append(empty)
      return
    }
    visibleItems.forEach((item) => results.append(createCard(item)))
  }

  ;[kindControl.select, scenarioControl.select, statusControl.select].forEach((control) => control.addEventListener('change', renderResults))
  search.addEventListener('input', renderResults)
  renderResults()
  root.append(page)
}
