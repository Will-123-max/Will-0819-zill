const ASSIGNMENTS_API = 'https://studentguide-g5qp.arcada.app/api/materials'
const ASSIGNMENTS_PATH = '/assignments'
let assignmentRefresh = null

function assignmentLink(className = '') {
  const link = document.createElement('a')
  link.href = ASSIGNMENTS_PATH
  link.textContent = 'Assignments'
  link.className = className
  link.dataset.assignmentLink = 'true'
  return link
}

function addAssignmentNavigation() {
  const desktop = document.querySelector('[data-source-loc="src/components/Navbar.jsx:101:10"]')
  if (desktop && !desktop.querySelector('[data-assignment-link]')) desktop.appendChild(assignmentLink('px-2.5 py-2 rounded-lg hover:text-brand hover:bg-brand/8 transition'))

  const mobile = document.querySelector('[data-source-loc="src/components/Navbar.jsx:134:8"]')
  if (mobile && !mobile.querySelector('[data-assignment-link]')) mobile.prepend(assignmentLink('block px-3 py-2.5 rounded-xl font-medium hover:bg-paper'))

  const footerList = document.querySelector('[data-source-loc="src/components/Footer.jsx:50:10"]')
  if (footerList && !footerList.querySelector('[data-assignment-link]')) {
    const item = document.createElement('li')
    item.appendChild(assignmentLink('hover:text-gold'))
    footerList.prepend(item)
  }
}

function addAdminMaterialHelp() {
  const form = document.querySelector('form[data-source-loc="src/pages/Admin.jsx:482:6"]')
  if (!form || form.querySelector('.sg-material-type-help')) return
  const heading = form.querySelector('[data-source-loc="src/pages/Admin.jsx:483:8"]')
  if (!heading) return
  const help = document.createElement('div')
  help.className = 'sg-material-type-help'
  help.innerHTML = '<strong>Choose what you are publishing</strong><span>Use <b>Assignment</b> for coursework. Use <b>Past Question Material</b> for photo or written past questions that must remain separate from the main Past Questions bank.</span>'
  heading.insertAdjacentElement('afterend', help)
}

function addQuestionBankHelp() {
  const form = document.querySelector('form[data-source-loc="src/pages/Admin.jsx:907:6"]')
  if (!form || form.querySelector('.sg-question-bank-help')) return
  const heading = form.querySelector('[data-source-loc="src/pages/Admin.jsx:908:8"]')
  if (!heading) return
  const help = document.createElement('div')
  help.className = 'sg-question-bank-help'
  help.innerHTML = '<strong>This is an optional answer-key bank — not CBT</strong><span>Use this only when you want students to open questions and reveal answers. For ordinary photo or written past-question documents, use <b>Past Question Material</b> inside Materials.</span>'
  heading.insertAdjacentElement('afterend', help)
}

function addPublicQuestionBankNote() {
  const page = document.querySelector('[data-source-loc="src/pages/PastQuestions.jsx:33:4"]')
  if (!page || page.querySelector('.sg-question-bank-note')) return
  const hero = page.querySelector('section[data-source-loc="src/components/PageHero.jsx:8:4"]')
  if (!hero) return
  const note = document.createElement('div')
  note.className = 'sg-question-bank-note'
  note.innerHTML = '<strong>Past Questions Bank — study mode, not CBT</strong><span>Open a paper to read the questions and reveal uploaded answers. There is no timer or score here.</span>'
  hero.insertAdjacentElement('afterend', note)
}

function assignmentCard(item) {
  const card = document.createElement('article')
  card.className = 'sg-assignment-card'
  const image = document.createElement('img')
  image.src = item.cover_url || '/images/materials.jpg'
  image.alt = ''
  image.loading = 'lazy'
  const body = document.createElement('div')
  body.className = 'sg-assignment-card__body'
  const meta = document.createElement('p')
  meta.className = 'sg-assignment-card__meta'
  meta.textContent = [item.course_code, item.university, item.level ? `${item.level} Level` : ''].filter(Boolean).join(' · ')
  const title = document.createElement('h2')
  title.textContent = item.title || 'Assignment'
  const text = document.createElement('p')
  text.className = 'sg-assignment-card__text'
  text.textContent = String(item.content || 'Open this assignment to read the written instructions or clear uploaded pages.').slice(0, 180)
  const link = document.createElement('a')
  link.href = `/materials/${item.id}`
  link.textContent = 'Read assignment'
  body.append(meta, title, text, link)
  card.append(image, body)
  return card
}

async function renderAssignments() {
  if (location.pathname !== ASSIGNMENTS_PATH) return
  const main = document.querySelector('main[data-source-loc="src/App.tsx:51:6"]')
  if (!main) return
  if (!main.querySelector('.sg-assignments')) {
    main.innerHTML = '<section class="sg-assignments"><div class="sg-assignments__hero"><p>Coursework</p><h1>Student Assignments</h1><span>Written instructions and clear phone-uploaded pages from the admin desk.</span></div><div class="sg-assignments__status">Loading assignments…</div><div class="sg-assignments__grid"></div></section>'
  }
  try {
    const response = await fetch(ASSIGNMENTS_API, { cache: 'no-store' })
    if (!response.ok) throw new Error('Could not load assignments')
    const materials = await response.json()
    const assignments = (Array.isArray(materials) ? materials : [])
      .filter((item) => item && item.visible !== false && String(item.type || '').toLocaleLowerCase() === 'assignment')
      .sort((first, second) => String(first.title || '').localeCompare(String(second.title || ''), undefined, { sensitivity: 'base' }))
    const grid = main.querySelector('.sg-assignments__grid')
    const status = main.querySelector('.sg-assignments__status')
    grid.replaceChildren(...assignments.map(assignmentCard))
    status.textContent = assignments.length
      ? `${assignments.length} assignment${assignments.length === 1 ? '' : 's'} available`
      : 'No assignments have been published yet.'
  } catch {
    const status = main.querySelector('.sg-assignments__status')
    if (status) status.textContent = 'Assignments could not be loaded. Please try again.'
  }
}

const style = document.createElement('style')
style.textContent = `
.sg-material-type-help,.sg-question-bank-help{display:flex;flex-direction:column;gap:3px;border:1px solid rgba(21,101,200,.2);border-radius:14px;background:#eef6ff;padding:11px 12px;color:#0f2744}.sg-material-type-help strong,.sg-question-bank-help strong{font-size:12px}.sg-material-type-help span,.sg-question-bank-help span{color:#64748b;font-size:10px;line-height:1.5}.sg-question-bank-note{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:-22px 0 24px;border:1px solid rgba(21,101,200,.2);border-radius:16px;background:#eef6ff;padding:12px 14px;color:#0f2744}.sg-question-bank-note strong{font-size:12px}.sg-question-bank-note span{color:#64748b;font-size:10px}.dark .sg-question-bank-note{background:rgba(21,101,200,.12);color:#fffdf8}
.sg-assignments{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:32px 0 60px}.sg-assignments__hero{overflow:hidden;border-radius:28px;background:linear-gradient(135deg,#071320,#0f2744 58%,#1565c8);padding:34px;color:#fffdf8}.sg-assignments__hero p{margin:0;color:#e8c547;font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase}.sg-assignments__hero h1{margin:6px 0 0;font-family:'Source Serif 4',Georgia,serif;font-size:42px;line-height:1.05}.sg-assignments__hero span{display:block;max-width:600px;margin-top:10px;color:rgba(255,253,248,.72);font-size:14px}.sg-assignments__status{margin:25px 0 12px;color:#64748b;font-size:13px;font-weight:700}.sg-assignments__grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.sg-assignment-card{overflow:hidden;border:1px solid rgba(15,39,68,.1);border-radius:22px;background:#fff;box-shadow:0 10px 32px rgba(15,39,68,.08)}.sg-assignment-card>img{width:100%;height:170px;object-fit:cover}.sg-assignment-card__body{padding:18px}.sg-assignment-card__meta{margin:0;color:#1565c8;font-size:10px;font-weight:800;text-transform:uppercase}.sg-assignment-card h2{margin:5px 0 0;color:#0f2744;font-size:19px;font-weight:800}.sg-assignment-card__text{display:-webkit-box;margin:7px 0 15px;overflow:hidden;color:#64748b;font-size:12px;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:3}.sg-assignment-card a{display:inline-flex;border-radius:11px;background:#0f2744;color:#fff;padding:10px 14px;font-size:11px;font-weight:800;text-decoration:none}.dark .sg-assignment-card{border-color:rgba(255,255,255,.1);background:#0b1a2e}.dark .sg-assignment-card h2{color:#fffdf8}
@media(max-width:860px){.sg-assignments__grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:580px){.sg-assignments__hero{padding:26px 22px}.sg-assignments__hero h1{font-size:34px}.sg-assignments__grid{grid-template-columns:1fr}}
`
document.head.appendChild(style)

const observer = new MutationObserver(() => {
  addAssignmentNavigation()
  addAdminMaterialHelp()
  addQuestionBankHelp()
  addPublicQuestionBankNote()
  if (location.pathname === ASSIGNMENTS_PATH && !document.querySelector('.sg-assignments')) renderAssignments()
})
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', renderAssignments)
window.setTimeout(() => { addAssignmentNavigation(); addAdminMaterialHelp(); addQuestionBankHelp(); addPublicQuestionBankNote(); renderAssignments() }, 500)
assignmentRefresh = window.setInterval(renderAssignments, 15000)
