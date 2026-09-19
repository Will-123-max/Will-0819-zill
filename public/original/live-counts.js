const COUNTS_API = 'https://studentguide-g5qp.arcada.app/api'
const COUNT_REFRESH_MS = 15000

let currentCounts = { materials: null, pastQuestions: null, pastPapers: null }
let renderQueued = false

function availableItems(items) {
  return items.filter((item) => item && item.visible !== false && item.sold !== true)
}

function updateText(element, value) {
  if (!element) return
  const text = String(value)
  if (element.textContent !== text) element.textContent = text
  element.setAttribute('aria-live', 'polite')
}

function renderLiveCounts() {
  renderQueued = false
  const { materials, pastQuestions, pastPapers } = currentCounts

  if (typeof materials === 'number') {
    const labels = [...document.querySelectorAll('[data-source-loc="src/pages/Home.jsx:123:12"]')]
    const materialLabel = labels.find((element) => /materials? available/i.test(element.textContent || ''))
    if (materialLabel) {
      updateText(materialLabel.previousElementSibling, materials)
      updateText(materialLabel, materials === 1 ? 'Material available' : 'Materials available')
    }

    updateText(document.querySelector('[data-source-loc="src/pages/Materials.jsx:52:10"]'), materials)
    const uploadedLabel = document.querySelector('[data-source-loc="src/pages/Materials.jsx:53:10"]')
    if (uploadedLabel) updateText(uploadedLabel, `${materials} material${materials === 1 ? '' : 's'} uploaded`)
  }

  if (typeof pastQuestions === 'number') {
    const pastCount = document.querySelector('[data-source-loc="src/components/PastQuestionsCountCard.jsx:14:6"]')
    updateText(pastCount, `${pastQuestions} Past question${pastQuestions === 1 ? '' : 's'}`)
    const pastLabel = document.querySelector('[data-source-loc="src/components/PastQuestionsCountCard.jsx:15:6"]')
    if (pastLabel && typeof pastPapers === 'number') updateText(pastLabel, `${pastPapers} paper${pastPapers === 1 ? '' : 's'} available`)
  }
}

function queueRender() {
  if (renderQueued) return
  renderQueued = true
  requestAnimationFrame(renderLiveCounts)
}

async function fetchLiveCounts() {
  if (location.pathname.startsWith('/admin')) return
  try {
    const [materialsResponse, pastResponse] = await Promise.all([
      fetch(`${COUNTS_API}/materials`, { cache: 'no-store', headers: { Accept: 'application/json' } }),
      fetch(`${COUNTS_API}/past-questions`, { cache: 'no-store', headers: { Accept: 'application/json' } }),
    ])
    if (!materialsResponse.ok || !pastResponse.ok) return
    const [materialsData, pastData] = await Promise.all([materialsResponse.json(), pastResponse.json()])
    if (!Array.isArray(materialsData) || !Array.isArray(pastData)) return

    const materials = availableItems(materialsData)
    const papers = availableItems(pastData)
    currentCounts = {
      materials: materials.length,
      pastPapers: papers.length,
      pastQuestions: papers.reduce((total, paper) => {
        const listed = Number(paper.question_count)
        return total + (Number.isFinite(listed) && listed > 0 ? listed : Array.isArray(paper.questions) ? paper.questions.length : 0)
      }, 0),
    }
    queueRender()
    window.dispatchEvent(new CustomEvent('studentsguide:live-counts', { detail: currentCounts }))
  } catch {}
}

const observer = new MutationObserver(queueRender)
observer.observe(document.documentElement, { childList: true, subtree: true })

window.setTimeout(fetchLiveCounts, 500)
window.setInterval(fetchLiveCounts, COUNT_REFRESH_MS)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') fetchLiveCounts()
})
window.addEventListener('online', fetchLiveCounts)
