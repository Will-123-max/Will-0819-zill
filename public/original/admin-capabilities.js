const ADMIN_TOOLS = [
  ['Site appearance & text', 'Site'],
  ['Website pictures', 'Pictures'],
  ['Library uploads', 'Materials'],
  ['Guide question bank', 'Guide questions'],
  ['School updates', 'Updates'],
  ['Past Questions Bank (Q&A)', 'Past questions'],
  ['CBT quizzes', 'CBT quizzes'],
  ['Scholarships', 'Scholarships'],
  ['Store', 'Store'],
  ['All listings', 'Listings'],
  ['Contact messages', 'Messages'],
]

function normalizeAdminTabs() {
  document.querySelectorAll('button[data-source-loc="src/pages/Admin.jsx:133:10"]').forEach((button) => {
    button.type = 'button'
  })
}

function openAdminTool(tabName) {
  const button = [...document.querySelectorAll('button[data-source-loc="src/pages/Admin.jsx:133:10"]')]
    .find((item) => (item.textContent || '').trim() === tabName)
  button?.click()
  button?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function addAdminCapabilities() {
  if (location.pathname !== '/admin') return
  normalizeAdminTabs()
  const content = document.querySelector('[data-source-loc="src/pages/Admin.jsx:129:6"]')
  if (!content || content.querySelector('.sg-admin-capabilities')) return
  const panel = document.createElement('details')
  panel.className = 'sg-admin-capabilities'
  panel.open = true
  const summary = document.createElement('summary')
  summary.textContent = 'All admin tools'
  const intro = document.createElement('p')
  intro.textContent = 'Open any website-management function below. Uploaded materials can be re-edited through the reliable uploader.'
  const grid = document.createElement('div')
  ADMIN_TOOLS.forEach(([label, tab]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = label
    button.addEventListener('click', () => openAdminTool(tab))
    grid.appendChild(button)
  })
  panel.append(summary, intro, grid)
  const tabs = content.querySelector('[data-source-loc="src/pages/Admin.jsx:131:6"]')
  tabs?.insertAdjacentElement('beforebegin', panel)
}

const style = document.createElement('style')
style.textContent = `
.sg-admin-capabilities{margin:12px 0 18px;border:1px solid rgba(15,39,68,.1);border-radius:18px;background:#fff;padding:13px 14px}.sg-admin-capabilities summary{color:#0f2744;font-size:14px;font-weight:800;cursor:pointer}.sg-admin-capabilities>p{margin:5px 0 10px;color:#64748b;font-size:10px}.sg-admin-capabilities>div{display:flex;flex-wrap:wrap;gap:6px}.sg-admin-capabilities button{min-height:34px;border:1px solid rgba(21,101,200,.18);border-radius:999px;background:#eef6ff;color:#0f2744;padding:6px 11px;font-size:10px;font-weight:700;cursor:pointer}.sg-admin-capabilities button:hover{border-color:#1565c8;color:#1565c8}.dark .sg-admin-capabilities{border-color:rgba(255,255,255,.1);background:#0b1a2e}.dark .sg-admin-capabilities summary{color:#fffdf8}
`
document.head.appendChild(style)

const observer = new MutationObserver(() => { normalizeAdminTabs(); addAdminCapabilities() })
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(() => { normalizeAdminTabs(); addAdminCapabilities() }, 500)
