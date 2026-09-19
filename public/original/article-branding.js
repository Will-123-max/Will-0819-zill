const ARTICLE_SELECTOR = 'article[data-source-loc="src/pages/Article.jsx:63:4"]'
const WEBSITE_URL = 'https://studentguide-g5qp.arcada.app/'

function brandName(className) {
  const link = document.createElement('a')
  link.className = className
  link.href = WEBSITE_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.setAttribute('aria-label', 'Studentsguide home')
  const students = document.createElement('span')
  students.textContent = 'Students'
  const guide = document.createElement('span')
  guide.textContent = 'guide'
  guide.className = 'sg-article-brand__guide'
  link.append(students, guide)
  return link
}

function websiteLink(className, label = 'https://studentguide-g5qp.arcada.app') {
  const link = document.createElement('a')
  link.className = className
  link.href = WEBSITE_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = label
  return link
}

function addArticleBranding(article) {
  if (article.dataset.articleBranding === 'true') return
  article.dataset.articleBranding = 'true'

  const header = document.createElement('header')
  header.className = 'sg-article-brand sg-article-brand--header'
  const headerCopy = document.createElement('div')
  const headerKicker = document.createElement('p')
  headerKicker.className = 'sg-article-brand__kicker'
  headerKicker.textContent = 'Full update from'
  headerCopy.append(headerKicker, brandName('sg-article-brand__name'))
  header.append(headerCopy, websiteLink('sg-article-brand__website'))

  const footer = document.createElement('footer')
  footer.className = 'sg-article-brand sg-article-brand--footer'
  const footerCopy = document.createElement('div')
  footerCopy.className = 'sg-article-brand__footer-copy'
  const footerName = brandName('sg-article-brand__name sg-article-brand__name--footer')
  const footerText = document.createElement('p')
  footerText.textContent = 'The public campus companion for EBSU students.'
  footerCopy.append(footerName, footerText)
  footer.append(footerCopy, websiteLink('sg-article-brand__visit', 'Visit Studentsguide website'))

  article.prepend(header)
  article.append(footer)
}

function enhanceArticlePages() {
  document.querySelectorAll(ARTICLE_SELECTOR).forEach(addArticleBranding)
}

const style = document.createElement('style')
style.textContent = `
.sg-article-brand{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid rgba(15,39,68,.1);border-radius:18px;font-family:Outfit,system-ui,sans-serif}
.sg-article-brand--header{margin-bottom:20px;padding:13px 15px;background:linear-gradient(135deg,#f8fbff,#eef6ff)}
.sg-article-brand__kicker{margin:0 0 2px;color:#64748b;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}
.sg-article-brand__name{color:#0f2744;font-size:20px;font-weight:800;letter-spacing:-.035em;text-decoration:none}.sg-article-brand__guide{color:#1565c8}
.sg-article-brand__website{max-width:52%;overflow:hidden;color:#1565c8;font-size:11px;font-weight:700;text-decoration:none;text-overflow:ellipsis;white-space:nowrap}.sg-article-brand__website:hover{text-decoration:underline}
.sg-article-brand--footer{margin-top:48px;padding:20px;background:#071320;color:#fffdf8}.sg-article-brand__name--footer{color:#fffdf8}.sg-article-brand__footer-copy p{margin:4px 0 0;color:rgba(255,253,248,.62);font-size:11px}
.sg-article-brand__visit{display:inline-flex;min-height:38px;align-items:center;border:1px solid rgba(232,197,71,.35);border-radius:999px;color:#e8c547;padding:8px 14px;font-size:11px;font-weight:800;text-decoration:none}.sg-article-brand__visit:hover{background:rgba(232,197,71,.1)}
.dark .sg-article-brand--header{border-color:rgba(255,255,255,.1);background:linear-gradient(135deg,rgba(21,101,200,.14),rgba(255,255,255,.04))}.dark .sg-article-brand__kicker{color:#94a3b8}.dark .sg-article-brand__name{color:#fffdf8}
@media(max-width:600px){.sg-article-brand{align-items:flex-start;flex-direction:column}.sg-article-brand__website{max-width:100%}.sg-article-brand__visit{width:100%;justify-content:center}}
`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceArticlePages)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(enhanceArticlePages, 500)
