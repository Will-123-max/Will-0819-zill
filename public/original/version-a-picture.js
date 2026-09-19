const VERSION_A_SELECTOR = '[data-source-loc="src/pages/About.jsx:8:4"]'

function showVersionAPicture(container) {
  if (container.dataset.versionAPicture === 'true') return
  container.dataset.versionAPicture = 'true'

  const section = document.createElement('section')
  section.className = 'sg-version-a'
  const copy = document.createElement('div')
  copy.className = 'sg-version-a__copy'
  const kicker = document.createElement('p')
  kicker.textContent = 'Selected website version'
  const title = document.createElement('h2')
  title.textContent = 'Version A · Studentsguide'
  const text = document.createElement('p')
  text.textContent = 'This is the Studentsguide website version currently being edited.'
  copy.append(kicker, title, text)

  const link = document.createElement('a')
  link.href = 'https://studentguide-g5qp.arcada.app/'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.className = 'sg-version-a__picture'
  const image = document.createElement('img')
  image.src = '/images/version-a-reference.jpg'
  image.alt = 'Version A Studentsguide website preview'
  image.loading = 'lazy'
  link.appendChild(image)

  section.append(copy, link)
  container.appendChild(section)
}

function enhanceAboutPage() {
  document.querySelectorAll(VERSION_A_SELECTOR).forEach(showVersionAPicture)
}

const style = document.createElement('style')
style.textContent = `
.sg-version-a{margin-top:42px;overflow:hidden;border:1px solid rgba(15,39,68,.1);border-radius:28px;background:#fff;box-shadow:0 18px 50px rgba(15,39,68,.1)}
.sg-version-a__copy{padding:20px 22px}.sg-version-a__copy>p:first-child{margin:0;color:#d4a017;font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.sg-version-a__copy h2{margin:4px 0 0;color:#0f2744;font-family:'Source Serif 4',Georgia,serif;font-size:28px;line-height:1.15}.sg-version-a__copy>p:last-child{margin:7px 0 0;color:#64748b;font-size:13px}
.sg-version-a__picture{display:block;overflow:hidden;border-top:1px solid rgba(15,39,68,.08);background:#e8eef6}.sg-version-a__picture img{display:block;width:100%;height:auto;transition:transform .35s ease}.sg-version-a__picture:hover img{transform:scale(1.015)}
.dark .sg-version-a{border-color:rgba(255,255,255,.1);background:#0b1a2e}.dark .sg-version-a__copy h2{color:#fffdf8}.dark .sg-version-a__picture{border-color:rgba(255,255,255,.08)}
`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceAboutPage)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(enhanceAboutPage, 500)
