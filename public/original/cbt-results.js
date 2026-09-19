const CBT_RESULT_ROOT = '[data-source-loc="src/pages/QuizTake.jsx:404:6"]'
const CBT_RESULT_CARD = '[data-source-loc="src/pages/QuizTake.jsx:422:14"]'

function enhanceResultPage(root) {
  if (root.dataset.resultRefined === 'true') return
  const cards = [...root.querySelectorAll(CBT_RESULT_CARD)]
  if (!cards.length) return
  root.dataset.resultRefined = 'true'
  root.classList.add('sg-cbt-results')

  const resultHero = root.querySelector('[data-source-loc="src/pages/QuizTake.jsx:405:8"]')
  resultHero?.classList.add('sg-cbt-results__hero')

  const failed = cards.filter((card) => card.classList.contains('border-rose-200'))
  const correct = cards.length - failed.length
  cards.forEach((card) => {
    card.classList.add('sg-cbt-results__card')
    card.classList.add(card.classList.contains('border-rose-200') ? 'sg-cbt-results__card--failed' : 'sg-cbt-results__card--correct')
  })

  const heading = root.querySelector('[data-source-loc="src/pages/QuizTake.jsx:415:8"]')
  if (heading) heading.textContent = failed.length ? 'Questions to review' : 'Excellent — every answer is correct'

  const correctionList = root.querySelector('[data-source-loc="src/pages/QuizTake.jsx:417:8"]')
  if (!correctionList) return

  const panel = document.createElement('section')
  panel.className = 'sg-cbt-results__summary'
  const summaryCopy = document.createElement('div')
  const label = document.createElement('p')
  label.textContent = failed.length ? 'Result checked against the answer key' : 'Perfect result'
  const title = document.createElement('h4')
  title.textContent = failed.length
    ? `${failed.length} question${failed.length === 1 ? '' : 's'} need review`
    : `All ${correct} questions are correct`
  const note = document.createElement('p')
  note.textContent = failed.length
    ? 'Each failed question shows your answer and the marked correct answer below.'
    : 'Your selected answers match the marked answers for this quiz.'
  summaryCopy.append(label, title, note)

  const stats = document.createElement('div')
  stats.className = 'sg-cbt-results__stats'
  stats.innerHTML = `<span><strong>${correct}</strong> correct</span><span><strong>${failed.length}</strong> to review</span>`
  panel.append(summaryCopy, stats)

  const controls = document.createElement('div')
  controls.className = 'sg-cbt-results__controls'
  const failedOnly = document.createElement('button')
  failedOnly.type = 'button'
  failedOnly.textContent = `Failed only (${failed.length})`
  const showAll = document.createElement('button')
  showAll.type = 'button'
  showAll.textContent = `Show all (${cards.length})`
  function setMode(mode) {
    root.dataset.reviewMode = mode
    failedOnly.classList.toggle('is-active', mode === 'failed')
    showAll.classList.toggle('is-active', mode === 'all')
  }
  failedOnly.addEventListener('click', () => setMode('failed'))
  showAll.addEventListener('click', () => setMode('all'))
  controls.append(failedOnly, showAll)

  correctionList.before(panel, controls)
  setMode(failed.length ? 'failed' : 'all')
}

function enhanceResults() {
  document.querySelectorAll(CBT_RESULT_ROOT).forEach(enhanceResultPage)
}

function enhanceAdminQuizType() {
  const select = document.querySelector('select[data-source-loc="src/pages/Admin.jsx:1024:8"]')
  if (!select || select.dataset.quizTypeReady === 'true') return
  select.dataset.quizTypeReady = 'true'
  const note = document.createElement('div')
  note.className = 'sg-cbt-type-note'
  note.innerHTML = '<strong>Assessment type</strong><span>Choose <b>CBT Quiz</b> for practice quizzes or <b>CBT Exam</b> for a full exam paper. This label appears on the public CBT card.</span>'
  select.insertAdjacentElement('beforebegin', note)
}

const style = document.createElement('style')
style.textContent = `
.sg-cbt-results__hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#071320,#0f2744 55%,#1565c8)!important;box-shadow:0 22px 55px rgba(7,19,32,.2)}
.sg-cbt-results__hero::after{content:'';position:absolute;right:-55px;top:-80px;width:210px;height:210px;border-radius:50%;background:rgba(232,197,71,.12)}
.sg-cbt-results__summary{display:flex;align-items:center;justify-content:space-between;gap:20px;margin:0 0 12px;padding:18px 20px;border:1px solid rgba(15,39,68,.1);border-radius:20px;background:#fff;box-shadow:0 12px 35px rgba(15,39,68,.08)}
.sg-cbt-results__summary p:first-child{margin:0;color:#1565c8;font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.sg-cbt-results__summary h4{margin:4px 0 0;color:#0f2744;font-size:20px;font-weight:800}.sg-cbt-results__summary p:last-child{margin:4px 0 0;color:#64748b;font-size:12px}
.sg-cbt-results__stats{display:flex;flex:none;gap:8px}.sg-cbt-results__stats span{min-width:82px;border-radius:14px;background:#f1f5f9;padding:9px;text-align:center;color:#64748b;font-size:10px;font-weight:700}.sg-cbt-results__stats strong{display:block;color:#0f2744;font-family:'Source Serif 4',Georgia,serif;font-size:24px;line-height:1}
.sg-cbt-results__controls{display:flex;gap:7px;margin:0 0 16px}.sg-cbt-results__controls button{min-height:36px;border:1px solid rgba(15,39,68,.12);border-radius:999px;background:#fff;color:#0f2744;padding:7px 13px;font-size:11px;font-weight:800;cursor:pointer}.sg-cbt-results__controls button.is-active{border-color:#1565c8;background:#1565c8;color:#fff}
.sg-cbt-results__card{box-shadow:0 8px 26px rgba(15,39,68,.06);transition:opacity .18s ease,transform .18s ease}.sg-cbt-results__card--failed{border-width:2px!important}.sg-cbt-results__card--correct{border-color:#86efac!important}
.sg-cbt-results[data-review-mode='failed'] .sg-cbt-results__card--correct{display:none}
.sg-cbt-type-note{display:flex;flex-direction:column;gap:3px;border:1px solid rgba(21,101,200,.2);border-radius:14px;background:#eef6ff;padding:11px 12px;color:#0f2744}.sg-cbt-type-note strong{font-size:12px}.sg-cbt-type-note span{color:#64748b;font-size:10px;line-height:1.5}
.dark .sg-cbt-results__summary{border-color:rgba(255,255,255,.1);background:#0b1a2e}.dark .sg-cbt-results__summary h4,.dark .sg-cbt-results__stats strong{color:#fffdf8}.dark .sg-cbt-results__stats span{background:rgba(255,255,255,.07)}.dark .sg-cbt-results__controls button{border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.05);color:#fffdf8}.dark .sg-cbt-results__controls button.is-active{background:#1565c8}
@media(max-width:640px){.sg-cbt-results__summary{align-items:flex-start;flex-direction:column}.sg-cbt-results__stats{width:100%}.sg-cbt-results__stats span{flex:1}}
`
document.head.appendChild(style)

const observer = new MutationObserver(() => { enhanceResults(); enhanceAdminQuizType() })
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(() => { enhanceResults(); enhanceAdminQuizType() }, 500)
