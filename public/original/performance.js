const nativeFetch = window.fetch.bind(window)
const apiCache = new Map()
const inFlightRequests = new Map()
const CACHEABLE_API = /^https:\/\/studentguide-g5qp\.arcada\.app\/api\/(settings|materials|past-questions|articles|quizzes)(?:\?|$)/

function responseFrom(entry) {
  return new Response(entry.body, { status: entry.status, statusText: entry.statusText, headers: entry.headers })
}

function cacheLifetime(url) {
  return url.includes('/api/settings') ? 120000 : 15000
}

async function fetchAndCache(input, init, key) {
  const response = await nativeFetch(input, init)
  if (!response.ok) return { response }
  const entry = {
    body: await response.clone().text(),
    status: response.status,
    statusText: response.statusText,
    headers: [...response.headers.entries()],
    savedAt: Date.now(),
  }
  apiCache.set(key, entry)
  return { entry }
}

window.fetch = async function studentsguideFetch(input, init = {}) {
  const request = input instanceof Request ? input : null
  const url = request?.url || String(input)
  const method = String(init.method || request?.method || 'GET').toUpperCase()
  if (method !== 'GET') {
    const response = await nativeFetch(input, init)
    if (url.includes('studentguide-g5qp.arcada.app/api/')) apiCache.clear()
    return response
  }
  if (!CACHEABLE_API.test(url)) return nativeFetch(input, init)

  const cached = apiCache.get(url)
  if (cached && Date.now() - cached.savedAt < cacheLifetime(url)) return responseFrom(cached)

  if (!inFlightRequests.has(url)) {
    const pending = fetchAndCache(input, init, url).finally(() => inFlightRequests.delete(url))
    inFlightRequests.set(url, pending)
  }
  const result = await inFlightRequests.get(url)
  return result.entry ? responseFrom(result.entry) : result.response
}

const HERO_IMAGE = '[data-source-loc="src/pages/Home.jsx:78:8"]'
let optimisationQueued = false

function optimiseImages() {
  optimisationQueued = false
  const images = [...document.images]
  images.forEach((image, index) => {
    image.decoding = 'async'
    const isHero = image.matches(HERO_IMAGE)
    const isNavigationImage = Boolean(image.closest('header'))
    if (isHero) {
      image.loading = 'eager'
      image.fetchPriority = 'high'
      return
    }
    if (isNavigationImage || index < 2) {
      image.loading = 'eager'
      return
    }
    image.loading = 'lazy'
    image.fetchPriority = 'low'
  })
}

function queueOptimisation() {
  if (optimisationQueued) return
  optimisationQueued = true
  requestAnimationFrame(optimiseImages)
}

const observer = new MutationObserver(queueOptimisation)
observer.observe(document.documentElement, { childList: true, subtree: true })
queueOptimisation()

window.addEventListener('load', () => {
  if ('requestIdleCallback' in window) window.requestIdleCallback(optimiseImages, { timeout: 1200 })
  else window.setTimeout(optimiseImages, 200)
})
