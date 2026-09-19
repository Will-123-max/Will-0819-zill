const GUIDE_PATHS = ['/map', '/calendar', '/support', '/software', '/help', '/scholarships', '/counselling', '/it-support', '/admission', '/tips']
const GUIDE_MESSAGE = 'Open any item, pick an answer, or tap View Answer anytime. If you miss it, the correct option is highlighted.'

function addHomepageGuideMessage() {
  if (location.pathname !== '/') return
  const section = document.querySelector('[data-source-loc="src/pages/Home.jsx:128:6"]')
  if (!section || section.querySelector('.sg-guide-onboarding')) return
  const message = document.createElement('div')
  message.className = 'sg-guide-onboarding'
  message.innerHTML = `<strong>How the interactive guide works</strong><span>${GUIDE_MESSAGE}</span>`
  const grid = section.querySelector('[data-source-loc="src/pages/Home.jsx:136:8"]')
  grid?.insertAdjacentElement('beforebegin', message)
}

function markInteractiveButtons() {
  document.querySelectorAll('main a[href], main button[data-source-loc="src/components/GuideQuestion.jsx:43:6"]').forEach((element) => {
    const path = element.getAttribute('href')
    const isGuideLink = path && GUIDE_PATHS.some((item) => path === item || path.startsWith(`${item}/`))
    const isQuestion = element.matches('[data-source-loc="src/components/GuideQuestion.jsx:43:6"]')
    if (!isGuideLink && !isQuestion) return
    element.title = GUIDE_MESSAGE
    element.dataset.interactiveGuide = 'true'
    if (isGuideLink && element.closest('[data-source-loc="src/pages/Home.jsx:136:8"]') && !element.querySelector('.sg-guide-action-pill')) {
      const pill = document.createElement('span')
      pill.className = 'sg-guide-action-pill'
      pill.textContent = 'Answer or View Answer'
      element.appendChild(pill)
    }
  })
}

const style = document.createElement('style')
style.textContent = `
.sg-guide-onboarding{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:16px 0 18px;border:1px solid rgba(21,101,200,.18);border-radius:16px;background:#eef6ff;padding:13px 15px}.sg-guide-onboarding strong{flex:none;color:#0f2744;font-size:12px}.sg-guide-onboarding span{color:#64748b;font-size:11px;line-height:1.5}.sg-guide-action-pill{display:inline-flex!important;width:max-content;margin-top:10px;border-radius:999px;background:#eef6ff;color:#1565c8;padding:4px 8px;font-size:9px!important;font-weight:800}.dark .sg-guide-onboarding{border-color:rgba(142,197,255,.18);background:rgba(21,101,200,.12)}.dark .sg-guide-onboarding strong{color:#fffdf8}
@media(max-width:640px){.sg-guide-onboarding{align-items:flex-start;flex-direction:column;gap:5px}}
`
document.head.appendChild(style)

function enhanceGuideExperience() { addHomepageGuideMessage(); markInteractiveButtons() }
const observer = new MutationObserver(enhanceGuideExperience)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', enhanceGuideExperience)
window.setTimeout(enhanceGuideExperience, 400)
