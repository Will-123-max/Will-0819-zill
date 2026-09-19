const MATERIALS_API = 'https://studentguide-g5qp.arcada.app/api/materials'
let materialLibraryItems = []

function shortText(item) {
  const content = String(item.content || '').replace(/\s+/g, ' ').trim()
  if (content) return content.length > 150 ? `${content.slice(0, 147)}…` : content
  if (String(item.type || '').toLocaleLowerCase() === 'past question material') return 'Extra past-question document. Open it to read the written content or clear uploaded pages.'
  if (String(item.type || '').toLocaleLowerCase() === 'assignment') return 'Assignment instructions and attached study files from the admin desk.'
  return 'Open this Studentsguide library item to read the material or view the attached file.'
}

function freshUrl(path) {
  const url = new URL(path, location.origin)
  url.searchParams.set('share', Date.now().toString(36))
  return url.toString()
}

function libraryActions(item, path) {
  const wrap = document.createElement('div')
  wrap.className = 'sg-library-share'
  const copy = document.createElement('button')
  copy.type = 'button'
  copy.textContent = 'Copy link'
  copy.addEventListener('click', async () => {
    const url = freshUrl(path)
    try { await navigator.clipboard.writeText(url); copy.textContent = 'Link copied ✓' }
    catch {
      const field = document.createElement('textarea')
      field.value = url
      document.body.appendChild(field)
      field.select()
      document.execCommand('copy')
      field.remove()
      copy.textContent = 'Link copied ✓'
    }
    setTimeout(() => { copy.textContent = 'Copy link' }, 2000)
  })
  const share = document.createElement('button')
  share.type = 'button'
  share.textContent = 'Share'
  share.className = 'is-whatsapp'
  share.addEventListener('click', () => {
    const message = `${item.title}\n\n${shortText(item)}\n\n${freshUrl(path)}\n\nStudentsguide`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  })
  wrap.append(copy, share)
  return wrap
}

function enhanceMaterialCards() {
  if (location.pathname !== '/materials') return
  const page = document.querySelector('[data-source-loc="src/pages/Materials.jsx:41:4"]')
  if (!page) return
  const hero = page.querySelector('section[data-source-loc="src/components/PageHero.jsx:8:4"]')
  if (hero && !page.querySelector('.sg-library-intro')) {
    const intro = document.createElement('div')
    intro.className = 'sg-library-intro'
    intro.innerHTML = '<strong>Studentsguide Library</strong><span>Browse library cards with cover images, descriptions and shareable links. Materials are documents, not quiz questions.</span>'
    hero.insertAdjacentElement('afterend', intro)
  }
  page.querySelectorAll('article[data-source-loc="src/pages/Materials.jsx:99:12"]').forEach((card) => {
    const view = card.querySelector('a[href^="/materials/"]')
    const id = view?.getAttribute('href')?.split('/').pop()
    const item = materialLibraryItems.find((entry) => String(entry.id) === String(id))
    if (!item) return
    card.classList.add('sg-library-card')
    let description = card.querySelector('.sg-library-description')
    if (!description) {
      description = document.createElement('p')
      description.className = 'sg-library-description'
      const title = card.querySelector('[data-source-loc="src/pages/Materials.jsx:106:16"]')
      title?.insertAdjacentElement('afterend', description)
    }
    const descriptionText = shortText(item)
    if (description.textContent !== descriptionText) description.textContent = descriptionText
    if (String(item.type || '').toLocaleLowerCase() === 'past question material' || /past questions?/i.test(item.title || '')) {
      if (!card.querySelector('.sg-extra-past-badge')) {
        const badge = document.createElement('span')
        badge.className = 'sg-extra-past-badge'
        badge.textContent = 'Extra Past Question'
        card.querySelector('[data-source-loc="src/pages/Materials.jsx:103:18"]')?.insertAdjacentElement('afterend', badge)
      }
    }
    if (!card.querySelector('.sg-library-share')) card.querySelector('[data-source-loc="src/pages/Materials.jsx:109:16"]')?.insertAdjacentElement('afterend', libraryActions(item, `/materials/${item.id}`))
  })
}

async function loadMaterialLibrary() {
  try {
    const response = await fetch(MATERIALS_API, { cache: 'no-store' })
    if (!response.ok) return
    materialLibraryItems = await response.json()
    enhanceMaterialCards()
  } catch {}
}

const style = document.createElement('style')
style.textContent = `
.sg-library-intro{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:-22px 0 26px;border:1px solid rgba(21,101,200,.18);border-radius:16px;background:#eef6ff;padding:13px 15px}.sg-library-intro strong{color:#0f2744;font-size:13px}.sg-library-intro span{color:#64748b;font-size:11px}.sg-library-card{box-shadow:0 10px 30px rgba(15,39,68,.07)}.sg-library-description{display:-webkit-box;min-height:48px;margin:7px 0 0;overflow:hidden;color:#64748b;font-size:11px;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:3}.sg-extra-past-badge{display:inline-flex;margin-left:5px;border-radius:999px;background:#fff7ed;color:#c2410c;padding:3px 7px;font-size:8px;font-weight:800}.sg-library-share{display:flex;gap:6px;margin-top:9px}.sg-library-share button{min-height:34px;flex:1;border:1px solid rgba(15,39,68,.12);border-radius:9px;background:#fff;color:#0f2744;font-size:10px;font-weight:800}.sg-library-share button.is-whatsapp{border-color:#25D366;background:#25D366;color:#fff}.dark .sg-library-intro{background:rgba(21,101,200,.12)}.dark .sg-library-intro strong{color:#fffdf8}
@media(max-width:640px){.sg-library-intro{align-items:flex-start;flex-direction:column;gap:4px}}
`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceMaterialCards)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', loadMaterialLibrary)
window.setTimeout(loadMaterialLibrary, 500)
window.setInterval(loadMaterialLibrary, 15000)
