const HOME_SECTIONS = [
  'src/pages/Home.jsx:128:6',
  'src/pages/Home.jsx:150:6',
  'src/pages/Home.jsx:168:6',
  'src/pages/Home.jsx:182:6',
  'src/pages/Home.jsx:208:6',
  'src/pages/Home.jsx:230:6',
]

function modernizeHomepage() {
  const onHome = location.pathname === '/'
  document.body.classList.toggle('sg-home-modern', onHome)
  if (!onHome) return

  const hero = document.querySelector('[data-source-loc="src/pages/Home.jsx:77:6"]')
  const stats = document.querySelector('[data-source-loc="src/pages/Home.jsx:114:6"]')
  hero?.classList.add('sg-modern-hero')
  stats?.classList.add('sg-modern-stats')

  const heroContent = hero?.querySelector('[data-source-loc="src/pages/Home.jsx:80:8"]')
  if (heroContent && !heroContent.querySelector('.sg-home-badge')) {
    const badge = document.createElement('div')
    badge.className = 'sg-home-badge'
    badge.innerHTML = '<span></span>EBSU student resource hub'
    heroContent.prepend(badge)
  }

  HOME_SECTIONS.forEach((source, index) => {
    const section = document.querySelector(`[data-source-loc="${source}"]`)
    if (!section) return
    section.classList.add('sg-modern-section', `sg-modern-section-${index + 1}`)
  })

  document.querySelectorAll('.sg-modern-section .sg-card, .sg-modern-section>a, .sg-modern-section article').forEach((card) => card.classList.add('sg-modern-card'))
}

const style = document.createElement('style')
style.textContent = `
.sg-home-modern{background:#f5f8fc!important}.sg-home-modern>div>div{overflow-x:clip}.sg-home-modern header{border-bottom:1px solid rgba(15,39,68,.08);background:rgba(255,255,255,.9)!important;backdrop-filter:blur(14px)}
.sg-modern-hero{min-height:620px;display:flex;align-items:center;background:linear-gradient(135deg,#071320 0%,#0f2744 48%,#1565c8 100%)!important}.sg-modern-hero>img{opacity:.22!important;filter:saturate(.8) contrast(1.05)}.sg-modern-hero::after{content:'';position:absolute;inset:0;background:radial-gradient(circle at 18% 25%,rgba(232,197,71,.18),transparent 30%),radial-gradient(circle at 82% 75%,rgba(142,197,255,.18),transparent 35%);pointer-events:none}.sg-modern-hero>[data-source-loc="src/pages/Home.jsx:80:8"]{position:relative;z-index:2;width:100%;padding-top:76px!important;padding-bottom:110px!important}.sg-home-badge{display:inline-flex;align-items:center;gap:8px;margin:0 auto 18px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.78);padding:7px 12px;font-size:9px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}.sg-home-badge span{width:7px;height:7px;border-radius:50%;background:#e8c547;box-shadow:0 0 0 5px rgba(232,197,71,.12)}.sg-modern-hero h1{font-size:clamp(44px,6vw,76px)!important;letter-spacing:-.045em}.sg-modern-hero form{border:1px solid rgba(255,255,255,.15)!important;box-shadow:0 20px 55px rgba(0,0,0,.25)!important}
.sg-modern-stats{margin-top:-54px!important;gap:12px!important}.sg-modern-stats>div,.sg-modern-stats>a{min-height:125px;border:1px solid rgba(15,39,68,.07)!important;border-radius:20px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 18px 50px rgba(15,39,68,.12)!important;backdrop-filter:blur(12px)}
.sg-modern-section{position:relative;margin-top:88px!important}.sg-modern-section::before{content:'';position:absolute;left:0;top:-36px;width:42px;height:3px;border-radius:999px;background:linear-gradient(90deg,#e8c547,#1565c8)}.sg-modern-section h2{letter-spacing:-.035em!important}.sg-modern-section>p{max-width:700px}.sg-modern-section-2,.sg-modern-section-5{width:min(1280px,calc(100% - 32px));border:1px solid rgba(15,39,68,.06);border-radius:32px;background:#fff;padding:32px!important;box-shadow:0 20px 60px rgba(15,39,68,.06)}.sg-modern-section-6{margin-bottom:40px!important}
.sg-modern-card{transition:transform .22s ease,box-shadow .22s ease,border-color .22s ease!important}.sg-modern-card:hover{transform:translateY(-5px);border-color:rgba(21,101,200,.22)!important;box-shadow:0 22px 55px rgba(15,39,68,.14)!important}.sg-modern-card img{transition:transform .45s ease}.sg-modern-card:hover img{transform:scale(1.035)}
.sg-home-modern footer{margin-top:90px!important}.dark .sg-home-modern{background:#07111f!important}.dark .sg-modern-stats>div,.dark .sg-modern-stats>a,.dark .sg-modern-section-2,.dark .sg-modern-section-5{border-color:rgba(255,255,255,.08)!important;background:rgba(11,26,46,.94)!important}
@media(max-width:760px){.sg-modern-hero{min-height:570px}.sg-modern-hero>[data-source-loc="src/pages/Home.jsx:80:8"]{padding-top:58px!important;padding-bottom:92px!important}.sg-modern-hero h1{font-size:43px!important}.sg-modern-stats{margin-top:-44px!important}.sg-modern-stats>div,.sg-modern-stats>a{min-height:105px;padding:14px!important}.sg-modern-section{margin-top:68px!important}.sg-modern-section-2,.sg-modern-section-5{padding:22px 16px!important;border-radius:24px}.sg-home-badge{margin-bottom:14px}}
@media(prefers-reduced-motion:reduce){.sg-modern-card,.sg-modern-card img{transition:none!important}}
`
document.head.appendChild(style)

const observer = new MutationObserver(modernizeHomepage)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', modernizeHomepage)
window.setTimeout(modernizeHomepage, 300)
