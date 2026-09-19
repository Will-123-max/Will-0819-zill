const GRADEBOOK_API = 'https://studentguide-g5qp.arcada.app/api'
let gradebookData = {}
let publicRefreshTimer = null

function parseGradebook(value) {
  if (!value) return {}
  if (typeof value === 'object') return value
  try { return JSON.parse(value) || {} } catch { return {} }
}

function metadataFor(quiz) {
  const saved = gradebookData[String(quiz.id)] || {}
  const assessment = saved.assessment || (/exam/i.test(quiz.exam_type || '') ? 'CBT Exam' : 'CBT Quiz')
  return {
    assessment,
    session: saved.session || 'Unspecified session',
    semester: saved.semester || 'General',
    period: saved.period || 'Current',
  }
}

function sortedQuizzes(quizzes) {
  return [...quizzes].sort((first, second) => String(first.course_code || first.title || '').localeCompare(String(second.course_code || second.title || ''), undefined, { numeric: true, sensitivity: 'base' }))
}

async function loadGradebookSource() {
  const [quizResponse, attemptResponse, settingsResponse] = await Promise.all([
    fetch(`${GRADEBOOK_API}/quizzes`, { cache: 'no-store' }),
    fetch(`${GRADEBOOK_API}/attempts?leaderboard=true&limit=200`, { cache: 'no-store' }),
    fetch(`${GRADEBOOK_API}/settings`, { cache: 'no-store' }),
  ])
  const [quizzes, attempts, settings] = await Promise.all([
    quizResponse.ok ? quizResponse.json() : [],
    attemptResponse.ok ? attemptResponse.json() : [],
    settingsResponse.ok ? settingsResponse.json() : {},
  ])
  gradebookData = parseGradebook(settings.cbt_gradebook)
  return { quizzes: Array.isArray(quizzes) ? quizzes : [], attempts: Array.isArray(attempts) ? attempts : [] }
}

function optionSelect(label, values, value = 'All') {
  const wrap = document.createElement('label')
  wrap.className = 'sg-gradebook-filter'
  const text = document.createElement('span')
  text.textContent = label
  const select = document.createElement('select')
  ;['All', ...values].forEach((item) => {
    const option = document.createElement('option')
    option.value = item
    option.textContent = item
    select.appendChild(option)
  })
  select.value = value
  wrap.append(text, select)
  return { wrap, select }
}

function leaderboardGroup(subject, attempts) {
  const section = document.createElement('section')
  section.className = 'sg-subject-results'
  const heading = document.createElement('div')
  heading.className = 'sg-subject-results__heading'
  const title = document.createElement('h3')
  title.textContent = subject
  const count = document.createElement('span')
  count.textContent = `${attempts.length} attempt${attempts.length === 1 ? '' : 's'}`
  heading.append(title, count)
  const list = document.createElement('ol')
  attempts.slice(0, 8).forEach((attempt, index) => {
    const item = document.createElement('li')
    const rank = document.createElement('strong')
    rank.textContent = String(index + 1)
    const person = document.createElement('span')
    person.textContent = attempt.display_name || 'Guest'
    const paper = document.createElement('small')
    paper.textContent = attempt.quiz_title || 'CBT'
    const score = document.createElement('b')
    score.textContent = `${Number(attempt.percentage) || 0}%`
    item.append(rank, person, paper, score)
    list.appendChild(item)
  })
  section.append(heading, list)
  return section
}

async function enhancePublicGradebook(force = false) {
  if (location.pathname !== '/cbt') return
  const page = document.querySelector('[data-source-loc="src/pages/CBT.jsx:29:4"]')
  const cardList = document.querySelector('[data-source-loc="src/pages/CBT.jsx:33:10"]')
  if (!page || !cardList) return
  if (page.dataset.gradebookReady === 'true' && !force) return
  page.dataset.gradebookReady = 'true'
  try {
    const { quizzes, attempts } = await loadGradebookSource()
    const ordered = sortedQuizzes(quizzes)
    const cards = [...cardList.querySelectorAll('[data-source-loc="src/pages/CBT.jsx:35:14"]')]
    cards.forEach((card, index) => {
      const quiz = ordered[index]
      if (!quiz) return
      const meta = metadataFor(quiz)
      card.dataset.quizId = quiz.id
      card.dataset.assessment = meta.assessment
      card.dataset.session = meta.session
      card.dataset.semester = meta.semester
      card.dataset.period = meta.period
      const firstLine = card.querySelector('[data-source-loc="src/pages/CBT.jsx:37:18"]')
      if (firstLine) firstLine.textContent = `${meta.assessment} · ${quiz.course_code || ''}`
      let details = card.querySelector('.sg-cbt-meta')
      if (!details) {
        details = document.createElement('p')
        details.className = 'sg-cbt-meta'
        card.querySelector('[data-source-loc="src/pages/CBT.jsx:38:18"]')?.insertAdjacentElement('afterend', details)
      }
      details.textContent = `${meta.session} · ${meta.semester} · ${meta.period}`
    })

    let gradebook = page.querySelector('.sg-gradebook')
    if (!gradebook) {
      gradebook = document.createElement('section')
      gradebook.className = 'sg-gradebook'
      gradebook.innerHTML = '<div class="sg-gradebook__intro"><p>CBT gradebook</p><h2>Browse papers and results by subject</h2><span>Filter current or previous quizzes and exams by session and semester.</span></div><div class="sg-gradebook__filters"></div><div class="sg-gradebook__subjects"></div>'
      const grid = page.querySelector('[data-source-loc="src/pages/CBT.jsx:32:8"]')
      grid?.insertAdjacentElement('beforebegin', gradebook)
    }

    const unique = (values) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const metas = ordered.map(metadataFor)
    const filters = gradebook.querySelector('.sg-gradebook__filters')
    filters.replaceChildren()
    const assessment = optionSelect('Paper type', unique(metas.map((item) => item.assessment)))
    const session = optionSelect('Session', unique(metas.map((item) => item.session)))
    const semester = optionSelect('Semester', unique(metas.map((item) => item.semester)))
    const period = optionSelect('Status', ['Current', 'Previous'])
    filters.append(assessment.wrap, session.wrap, semester.wrap, period.wrap)
    function filterCards() {
      cards.forEach((card) => {
        const show = (assessment.select.value === 'All' || card.dataset.assessment === assessment.select.value)
          && (session.select.value === 'All' || card.dataset.session === session.select.value)
          && (semester.select.value === 'All' || card.dataset.semester === semester.select.value)
          && (period.select.value === 'All' || card.dataset.period === period.select.value)
        card.style.display = show ? '' : 'none'
      })
    }
    ;[assessment.select, session.select, semester.select, period.select].forEach((select) => select.addEventListener('change', filterCards))

    const bySubject = new Map()
    attempts.forEach((attempt) => {
      const subject = String(attempt.course_code || attempt.quiz_title || 'General').trim().toUpperCase()
      if (!bySubject.has(subject)) bySubject.set(subject, [])
      bySubject.get(subject).push(attempt)
    })
    const subjects = gradebook.querySelector('.sg-gradebook__subjects')
    subjects.replaceChildren(...[...bySubject.entries()].sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true })).map(([subject, rows]) => leaderboardGroup(subject, rows.sort((a, b) => Number(b.percentage) - Number(a.percentage) || new Date(b.created_at) - new Date(a.created_at)))))
  } catch {}
}

function adminAccessToken() {
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index)
    if (!key?.includes('auth-token')) continue
    try {
      const value = JSON.parse(localStorage.getItem(key) || '{}')
      const token = value.access_token || value.currentSession?.access_token || value.session?.access_token
      if (token) return token
    } catch {}
  }
  return ''
}

async function enhanceAdminGradebook() {
  const root = document.querySelector('[data-source-loc="src/pages/Admin.jsx:1019:4"]')
  if (!root || root.querySelector('.sg-admin-gradebook')) return
  try {
    const { quizzes } = await loadGradebookSource()
    const panel = document.createElement('section')
    panel.className = 'sg-admin-gradebook'
    panel.innerHTML = '<div><strong>CBT gradebook details</strong><span>Set whether a paper is a quiz or exam, then organize it by session, semester and current/previous status.</span></div>'
    const quiz = document.createElement('select')
    const assessment = document.createElement('select')
    const session = document.createElement('input')
    const semester = document.createElement('select')
    const period = document.createElement('select')
    const save = document.createElement('button')
    const message = document.createElement('p')
    quiz.className = assessment.className = session.className = semester.className = period.className = 'field'
    sortedQuizzes(quizzes).forEach((item) => {
      const option = document.createElement('option')
      option.value = item.id
      option.textContent = `${item.course_code || ''} · ${item.title}`
      quiz.appendChild(option)
    })
    ;['CBT Quiz', 'CBT Exam'].forEach((value) => assessment.appendChild(new Option(value, value)))
    session.placeholder = 'Session, e.g. 2025/2026'
    ;['First Semester', 'Second Semester', 'General'].forEach((value) => semester.appendChild(new Option(value, value)))
    ;['Current', 'Previous'].forEach((value) => period.appendChild(new Option(value, value)))
    save.type = 'button'
    save.textContent = 'Save gradebook details'
    function fill() {
      const meta = gradebookData[quiz.value] || {}
      assessment.value = meta.assessment || 'CBT Quiz'
      session.value = meta.session || ''
      semester.value = meta.semester || 'General'
      period.value = meta.period || 'Current'
    }
    quiz.addEventListener('change', fill)
    save.addEventListener('click', async () => {
      const token = adminAccessToken()
      if (!token) { message.textContent = 'Sign in again before saving gradebook details.'; return }
      gradebookData[quiz.value] = { assessment: assessment.value, session: session.value.trim() || 'Unspecified session', semester: semester.value, period: period.value }
      save.disabled = true
      try {
        const response = await fetch(`${GRADEBOOK_API}/settings`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ cbt_gradebook: JSON.stringify(gradebookData) }) })
        const result = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(result.error || 'Could not save gradebook details')
        message.textContent = 'Gradebook details saved for the public CBT page.'
      } catch (error) { message.textContent = error.message }
      finally { save.disabled = false }
    })
    panel.append(quiz, assessment, session, semester, period, save, message)
    root.prepend(panel)
    fill()
  } catch {}
}

const style = document.createElement('style')
style.textContent = `
.sg-cbt-meta{margin:4px 0 0;color:#64748b;font-size:10px;font-weight:700}.sg-gradebook{margin:0 0 24px;border:1px solid rgba(15,39,68,.1);border-radius:24px;background:#fff;padding:20px;box-shadow:0 12px 35px rgba(15,39,68,.07)}.sg-gradebook__intro>p{margin:0;color:#d4a017;font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.sg-gradebook__intro h2{margin:4px 0 0;color:#0f2744;font-family:'Source Serif 4',Georgia,serif;font-size:27px}.sg-gradebook__intro span{color:#64748b;font-size:11px}.sg-gradebook__filters{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:16px}.sg-gradebook-filter{display:flex;flex-direction:column;gap:4px}.sg-gradebook-filter span{color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase}.sg-gradebook-filter select{height:40px;border:1px solid rgba(15,39,68,.12);border-radius:10px;background:#fff;padding:0 9px;color:#0f2744;font-size:11px}.sg-gradebook__subjects{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}.sg-subject-results{overflow:hidden;border:1px solid rgba(15,39,68,.09);border-radius:16px}.sg-subject-results__heading{display:flex;align-items:center;justify-content:space-between;background:#eef6ff;padding:10px 12px}.sg-subject-results h3{margin:0;color:#0f2744;font-size:13px}.sg-subject-results__heading span{color:#64748b;font-size:9px;font-weight:700}.sg-subject-results ol{margin:0;padding:5px 12px 9px;list-style:none}.sg-subject-results li{display:grid;grid-template-columns:22px 1fr auto auto;gap:7px;align-items:center;border-bottom:1px solid rgba(15,39,68,.07);padding:7px 0;font-size:10px}.sg-subject-results li>strong{color:#d4a017}.sg-subject-results li>small{max-width:100px;overflow:hidden;color:#94a3b8;text-overflow:ellipsis;white-space:nowrap}.sg-subject-results li>b{color:#1565c8}
.sg-admin-gradebook{grid-column:1/-1;display:grid;grid-template-columns:1.4fr repeat(4,1fr) auto;gap:8px;align-items:end;border:1px solid rgba(21,101,200,.2);border-radius:18px;background:#eef6ff;padding:14px}.sg-admin-gradebook>div{display:flex;flex-direction:column}.sg-admin-gradebook>div strong{font-size:13px}.sg-admin-gradebook>div span{color:#64748b;font-size:10px}.sg-admin-gradebook button{min-height:44px;border:0;border-radius:11px;background:#0f2744;color:#fff;padding:9px 13px;font-size:11px;font-weight:800}.sg-admin-gradebook>p{grid-column:1/-1;margin:0;color:#1565c8;font-size:11px;font-weight:700}
.dark .sg-gradebook{border-color:rgba(255,255,255,.1);background:#0b1a2e}.dark .sg-gradebook__intro h2,.dark .sg-subject-results h3{color:#fffdf8}.dark .sg-subject-results{border-color:rgba(255,255,255,.1)}.dark .sg-subject-results__heading{background:rgba(21,101,200,.14)}
@media(max-width:900px){.sg-admin-gradebook{grid-template-columns:1fr 1fr}.sg-gradebook__filters{grid-template-columns:1fr 1fr}}@media(max-width:650px){.sg-gradebook__subjects{grid-template-columns:1fr}.sg-gradebook__filters,.sg-admin-gradebook{grid-template-columns:1fr}}
`
document.head.appendChild(style)

const observer = new MutationObserver(() => { enhancePublicGradebook(); enhanceAdminGradebook() })
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', enhancePublicGradebook)
window.setTimeout(() => { enhancePublicGradebook(); enhanceAdminGradebook() }, 700)
publicRefreshTimer = window.setInterval(() => enhancePublicGradebook(true), 30000)
