const API_URL = 'https://studentguide-g5qp.arcada.app/api/articles'
const DISMISSED_KEY = 'studentsguide-dismissed-update-v1'
const BANNER_ID = 'studentsguide-update-notice'

function latestArticle(items) {
  return [...items].sort((first, second) => {
    const firstDate = new Date(first.published_at || 0).getTime()
    const secondDate = new Date(second.published_at || 0).getTime()
    return secondDate - firstDate || Number(second.id || 0) - Number(first.id || 0)
  })[0]
}

function dismissArticle(article, banner) {
  try { localStorage.setItem(DISMISSED_KEY, String(article.id || article.slug)) } catch {}
  banner.classList.add('sg-update-notice--leaving')
  window.setTimeout(() => banner.remove(), 240)
}

function showNotice(article) {
  const articleKey = String(article.id || article.slug)
  let dismissed = ''
  try { dismissed = localStorage.getItem(DISMISSED_KEY) || '' } catch {}
  if (!articleKey || dismissed === articleKey) return

  const existing = document.getElementById(BANNER_ID)
  if (existing?.dataset.articleKey === articleKey) return
  if (existing) existing.remove()

  const banner = document.createElement('aside')
  banner.id = BANNER_ID
  banner.dataset.articleKey = articleKey
  banner.className = 'sg-update-notice'
  banner.setAttribute('role', 'status')
  banner.setAttribute('aria-live', 'polite')

  const accent = document.createElement('div')
  accent.className = 'sg-update-notice__accent'

  const content = document.createElement('div')
  content.className = 'sg-update-notice__content'

  const brandRow = document.createElement('div')
  brandRow.className = 'sg-update-notice__brand-row'
  const brand = document.createElement('a')
  brand.className = 'sg-update-notice__brand'
  brand.href = 'https://studentsguide-ebsu-d590.arcada.app/'
  brand.target = '_blank'
  brand.rel = 'noopener noreferrer'
  brand.textContent = 'Studentsguide'
  brand.setAttribute('aria-label', 'Studentsguide home')
  const website = document.createElement('a')
  website.className = 'sg-update-notice__website'
  website.href = 'https://studentsguide-ebsu-d590.arcada.app/'
  website.target = '_blank'
  website.rel = 'noopener noreferrer'
  website.textContent = 'https://studentsguide-ebsu-d590.arcada.app'
  brandRow.append(brand, website)

  const label = document.createElement('div')
  label.className = 'sg-update-notice__label'
  const pulse = document.createElement('span')
  pulse.className = 'sg-update-notice__pulse'
  label.append(pulse, document.createTextNode(`New from the Studentguide desk${article.category ? ` · ${article.category}` : ''}`))

  const title = document.createElement('a')
  title.className = 'sg-update-notice__title'
  const postPath = `/updates/${encodeURIComponent(article.slug)}`
  title.href = postPath
  title.textContent = article.title || 'A new Studentsguide update is available'
  title.addEventListener('click', (event) => {
    event.preventDefault()
    openFullPost()
  })

  function openFullPost() {
    try { localStorage.setItem(DISMISSED_KEY, articleKey) } catch {}
    banner.remove()
    if (window.location.pathname !== postPath) {
      window.history.pushState({}, '', postPath)
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
  banner.tabIndex = 0
  banner.setAttribute('aria-label', `Open full update: ${title.textContent}`)
  banner.addEventListener('click', (event) => {
    if (event.target instanceof Element && event.target.closest('a, button')) return
    openFullPost()
  })
  banner.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openFullPost()
    }
  })

  const summaryText = String(article.excerpt || article.body || '').replace(/\s+/g, ' ').trim()
  const summary = document.createElement('p')
  summary.className = 'sg-update-notice__summary'
  summary.textContent = summaryText.length > 170 ? `${summaryText.slice(0, 167)}…` : summaryText

  const meta = document.createElement('p')
  meta.className = 'sg-update-notice__meta'
  const published = article.published_at ? new Date(article.published_at) : null
  const dateText = published && !Number.isNaN(published.getTime())
    ? published.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Just posted'
  meta.textContent = `${dateText} · Read the full update for details`

  const actions = document.createElement('div')
  actions.className = 'sg-update-notice__actions'
  const read = document.createElement('a')
  read.className = 'sg-update-notice__read'
  read.href = title.href
  read.textContent = 'Read update'
  read.addEventListener('click', (event) => {
    event.preventDefault()
    openFullPost()
  })
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'sg-update-notice__close'
  close.setAttribute('aria-label', 'Remove update notification')
  close.textContent = 'Dismiss'
  close.addEventListener('click', () => dismissArticle(article, banner))
  actions.append(read, close)

  content.append(brandRow, label, title)
  if (summaryText) content.appendChild(summary)
  content.append(meta, actions)
  banner.append(accent, content)
  document.body.appendChild(banner)
  requestAnimationFrame(() => banner.classList.add('sg-update-notice--shown'))
}

async function checkForUpdate() {
  if (location.pathname.startsWith('/admin')) return
  try {
    const response = await fetch(API_URL, { headers: { Accept: 'application/json' } })
    if (!response.ok) return
    const items = await response.json()
    if (!Array.isArray(items) || !items.length) return
    const latest = latestArticle(items)
    if (latest) showNotice(latest)
  } catch {}
}

const style = document.createElement('style')
style.textContent = `
.sg-update-notice{position:fixed;top:82px;left:50%;z-index:60;width:min(820px,calc(100vw - 32px));display:flex;overflow:hidden;border:1px solid rgba(15,39,68,.13);border-radius:20px;background:#fff;color:#0f2744;box-shadow:0 22px 60px rgba(7,19,32,.22);opacity:0;transform:translate(-50%,-16px) scale(.98);transition:opacity .22s ease,transform .22s ease;font-family:Outfit,system-ui,sans-serif;cursor:pointer}
.sg-update-notice:focus-visible{outline:3px solid rgba(21,101,200,.35);outline-offset:3px}
.sg-update-notice--shown{opacity:1;transform:translate(-50%,0) scale(1)}
.sg-update-notice--leaving{opacity:0;transform:translate(-50%,-12px) scale(.98)}
.sg-update-notice__accent{width:6px;flex:none;background:linear-gradient(180deg,#e8c547,#1565c8)}
.sg-update-notice__content{min-width:0;flex:1;padding:15px 16px 14px}
.sg-update-notice__brand-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px}.sg-update-notice__brand{color:#0f2744;font-size:15px;font-weight:800;letter-spacing:-.02em;text-decoration:none}.sg-update-notice__brand::after{content:'guide';color:#1565c8}.sg-update-notice__brand{font-size:0}.sg-update-notice__brand::before{content:'Students';color:#0f2744;font-size:15px}.sg-update-notice__brand::after{font-size:15px}.sg-update-notice__website{overflow:hidden;color:#64748b;font-size:10px;font-weight:700;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.sg-update-notice__website:hover{color:#1565c8;text-decoration:underline}
.sg-update-notice__label{display:flex;align-items:center;gap:7px;color:#1565c8;font-size:11px;line-height:1.2;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
.sg-update-notice__pulse{width:8px;height:8px;border-radius:999px;background:#22c55e;box-shadow:0 0 0 0 rgba(34,197,94,.5);animation:sgUpdatePulse 1.8s infinite}
.sg-update-notice__title{display:-webkit-box;margin-top:7px;overflow:hidden;color:#0f2744;font-family:'Source Serif 4',Georgia,serif;font-size:18px;line-height:1.3;font-weight:700;text-decoration:none;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.sg-update-notice__title:hover{color:#1565c8}
.sg-update-notice__summary{display:-webkit-box;margin:6px 0 0;overflow:hidden;color:#475569;font-size:12px;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2}
.sg-update-notice__meta{margin:6px 0 0;color:#94a3b8;font-size:10px;font-weight:600}
.sg-update-notice__actions{display:flex;align-items:center;justify-content:flex-start;gap:8px;margin-top:11px}
.sg-update-notice__read{display:inline-flex;align-items:center;min-height:34px;border-radius:999px;background:#0f2744;color:#fff;padding:7px 14px;font-size:12px;font-weight:700;text-decoration:none}
.sg-update-notice__read:hover{background:#1565c8}
.sg-update-notice__close{display:inline-flex;min-height:34px;align-items:center;justify-content:center;border:1px solid rgba(15,39,68,.12);border-radius:999px;background:transparent;color:#64748b;padding:7px 13px;font:700 12px/1 Outfit,system-ui,sans-serif;cursor:pointer}
.sg-update-notice__close:hover{background:#f1f5f9;color:#0f2744}
.dark .sg-update-notice{border-color:rgba(255,255,255,.12);background:#0b1a2e;color:#fffdf8}
.dark .sg-update-notice__brand::before{color:#fffdf8}.dark .sg-update-notice__website{color:#94a3b8}
.dark .sg-update-notice__title{color:#fffdf8}
.dark .sg-update-notice__summary{color:#cbd5e1}
.dark .sg-update-notice__close{border-color:rgba(255,255,255,.15);color:#cbd5e1}
.dark .sg-update-notice__close:hover{background:rgba(255,255,255,.08);color:#fff}
@keyframes sgUpdatePulse{0%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}70%{box-shadow:0 0 0 7px rgba(34,197,94,0)}100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}}
@media(max-width:640px){.sg-update-notice{top:78px;left:50%;width:calc(100vw - 24px)}.sg-update-notice__website{max-width:54vw}}
@media(prefers-reduced-motion:reduce){.sg-update-notice,.sg-update-notice__pulse{animation:none;transition:none}}
`
document.head.appendChild(style)

window.setTimeout(checkForUpdate, 1200)
window.setInterval(checkForUpdate, 20000)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') checkForUpdate()
})
