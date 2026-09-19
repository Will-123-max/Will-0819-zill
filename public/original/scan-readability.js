const SCAN_READER = '[data-source-loc="src/components/PageReader.jsx:14:4"]'
const SCAN_IMAGE = '[data-source-loc="src/components/PageReader.jsx:39:8"]'
const FILTERS = {
  clear: 'contrast(1.2) brightness(1.08)',
  extra: 'contrast(1.42) brightness(1.12) grayscale(.25)',
  original: 'none',
}

function applyScanMode(reader) {
  const mode = reader.dataset.readabilityMode || 'clear'
  const image = reader.querySelector(SCAN_IMAGE)
  if (image) {
    image.style.setProperty('filter', FILTERS[mode] || FILTERS.clear, 'important')
    image.style.setProperty('image-rendering', 'auto')
  }
  reader.querySelectorAll('[data-readability-mode]').forEach((button) => {
    const active = button.dataset.readabilityMode === mode
    button.classList.toggle('is-active', active)
    button.setAttribute('aria-pressed', String(active))
  })
}

function enhanceScanReader(reader) {
  if (reader.dataset.readabilityReady === 'true') { applyScanMode(reader); return }
  reader.dataset.readabilityReady = 'true'
  reader.dataset.readabilityMode = 'clear'

  const panel = document.createElement('div')
  panel.className = 'sg-scan-tools'
  const copy = document.createElement('div')
  const title = document.createElement('strong')
  title.textContent = 'AI-assisted clear reading'
  const note = document.createElement('p')
  note.textContent = 'Pages are arranged in number order. Use Extra clear for faint handwriting.'
  copy.append(title, note)

  const controls = document.createElement('div')
  controls.className = 'sg-scan-tools__controls'
  ;[['clear', 'AI clear'], ['extra', 'Extra clear'], ['original', 'Original']].forEach(([mode, label]) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.dataset.readabilityMode = mode
    button.textContent = label
    button.addEventListener('click', () => {
      reader.dataset.readabilityMode = mode
      applyScanMode(reader)
    })
    controls.appendChild(button)
  })
  const fullPage = document.createElement('button')
  fullPage.type = 'button'
  fullPage.textContent = 'Full page'
  fullPage.className = 'sg-scan-tools__full'
  fullPage.addEventListener('click', () => {
    const image = reader.querySelector(SCAN_IMAGE)
    if (image?.src) window.open(image.src, '_blank', 'noopener,noreferrer')
  })
  controls.appendChild(fullPage)
  panel.append(copy, controls)

  const pageHeading = reader.querySelector('[data-source-loc="src/components/PageReader.jsx:15:6"]')
  if (pageHeading) pageHeading.insertAdjacentElement('afterend', panel)
  else reader.prepend(panel)
  applyScanMode(reader)
}

function enhanceScans() {
  document.querySelectorAll(SCAN_READER).forEach(enhanceScanReader)
}

const style = document.createElement('style')
style.textContent = `
.sg-scan-tools{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 12px;padding:12px 14px;border:1px solid rgba(21,101,200,.2);border-radius:16px;background:#eef6ff;font-family:Outfit,system-ui,sans-serif}.sg-scan-tools strong{color:#0f2744;font-size:13px}.sg-scan-tools p{margin:2px 0 0;color:#64748b;font-size:11px}.sg-scan-tools__controls{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px}.sg-scan-tools button{min-height:34px;border:1px solid rgba(15,39,68,.13);border-radius:10px;background:#fff;color:#0f2744;padding:6px 10px;font-size:11px;font-weight:700;cursor:pointer}.sg-scan-tools button.is-active{border-color:#1565c8;background:#1565c8;color:#fff}.sg-scan-tools .sg-scan-tools__full{background:#0f2744;color:#fff}
.dark .sg-scan-tools{border-color:rgba(142,197,255,.18);background:rgba(21,101,200,.12)}.dark .sg-scan-tools strong{color:#fffdf8}.dark .sg-scan-tools button{border-color:rgba(255,255,255,.13);background:rgba(255,255,255,.06);color:#fffdf8}.dark .sg-scan-tools button.is-active{background:#1565c8}.dark .sg-scan-tools .sg-scan-tools__full{background:#fffdf8;color:#0f2744}
@media(max-width:680px){.sg-scan-tools{align-items:flex-start;flex-direction:column}.sg-scan-tools__controls{justify-content:flex-start;width:100%}.sg-scan-tools button{flex:1}}
`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceScans)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(enhanceScans, 500)
