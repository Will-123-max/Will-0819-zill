const WHATSAPP_GREEN = '#25D366'

function publicPageUrl() {
  const url = new URL(`${location.origin}${location.pathname}${location.search}`)
  url.searchParams.set('share', Date.now().toString(36))
  return url.toString()
}

function pageShareDetails() {
  const articleTitle = document.querySelector('[data-source-loc="src/pages/Article.jsx:66:6"]')
  const materialTitle = document.querySelector('[data-source-loc="src/pages/MaterialDetail.jsx:79:10"]')
  const pastTitle = document.querySelector('[data-source-loc="src/pages/PastQuestionDetail.jsx:43:8"]')
  const title = articleTitle?.textContent || materialTitle?.textContent || pastTitle?.textContent || document.title
  const articleImage = document.querySelector('[data-source-loc="src/pages/Article.jsx:68:6"]')
  const materialImage = document.querySelector('[data-source-loc="src/pages/MaterialDetail.jsx:71:10"], [data-source-loc="src/pages/MaterialDetail.jsx:73:10"]')
  const scanImage = document.querySelector('[data-source-loc="src/components/PageReader.jsx:39:8"]')
  const image = articleImage?.src || materialImage?.src || scanImage?.src || ''
  return { title: String(title || 'Studentsguide').trim(), image, url: publicPageUrl() }
}

async function imageFile(url, title) {
  if (!url) return null
  try {
    const response = await fetch(url)
    if (!response.ok) return null
    const blob = await response.blob()
    const extension = blob.type.includes('png') ? 'png' : 'jpg'
    return new File([blob], `${title.replace(/[^a-z0-9]+/gi, '-').slice(0, 50) || 'studentsguide'}.${extension}`, { type: blob.type || 'image/jpeg' })
  } catch { return null }
}

async function sharePageWithPicture() {
  const details = pageShareDetails()
  const file = await imageFile(details.image, details.title)
  if (file && navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: details.title, text: `${details.title}\n${details.url}` })
      return
    } catch (error) {
      if (error?.name === 'AbortError') return
    }
  }
  const message = [details.title, details.url, details.image ? `Picture: ${details.image}` : '', 'Shared from Studentsguide'].filter(Boolean).join('\n\n')
  window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
}

async function copyPageLink(button) {
  const details = pageShareDetails()
  let copied = false
  try {
    await navigator.clipboard.writeText(details.url)
    copied = true
  } catch {
    const field = document.createElement('textarea')
    field.value = details.url
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.appendChild(field)
    field.select()
    copied = document.execCommand('copy')
    field.remove()
  }
  const original = button.textContent
  button.textContent = copied ? 'Link copied ✓' : 'Copy the address above'
  button.classList.toggle('is-copied', copied)
  window.setTimeout(() => { button.textContent = original; button.classList.remove('is-copied') }, 2200)
}

function copyButton() {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'sg-copy-link'
  button.dataset.copyPageLink = 'true'
  button.textContent = 'Copy link'
  return button
}

function enhanceExistingShareButtons() {
  const buttons = document.querySelectorAll('[data-source-loc="src/pages/Article.jsx:70:6"], [data-source-loc="src/pages/PastQuestionDetail.jsx:54:6"]')
  buttons.forEach((button) => {
    if (button.dataset.pictureShare !== 'true') {
      button.dataset.pictureShare = 'true'
      button.textContent = 'Share picture on WhatsApp'
      button.style.background = WHATSAPP_GREEN
    }
    if (!button.parentElement?.querySelector('[data-copy-page-link]')) button.insertAdjacentElement('afterend', copyButton())
  })

  const materialHeader = document.querySelector('[data-source-loc="src/pages/MaterialDetail.jsx:76:6"]')
  if (materialHeader && !materialHeader.querySelector('.sg-picture-share')) {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'sg-picture-share'
    button.textContent = 'Share picture on WhatsApp'
    button.addEventListener('click', sharePageWithPicture)
    materialHeader.append(button, copyButton())
  }
}

document.addEventListener('click', (event) => {
  const copy = event.target instanceof Element && event.target.closest('[data-copy-page-link="true"]')
  if (copy) {
    event.preventDefault()
    copyPageLink(copy)
    return
  }
  const button = event.target instanceof Element && event.target.closest('[data-picture-share="true"]')
  if (!button) return
  event.preventDefault()
  event.stopImmediatePropagation()
  sharePageWithPicture()
}, true)

const style = document.createElement('style')
style.textContent = `.sg-picture-share,.sg-copy-link{display:inline-flex;align-items:center;justify-content:center;min-height:44px;border-radius:12px;padding:10px 15px;font:700 12px/1.2 Outfit,system-ui,sans-serif;cursor:pointer}.sg-picture-share{border:0;background:${WHATSAPP_GREEN};color:#fff}.sg-picture-share:hover{filter:brightness(1.06)}.sg-copy-link{margin-left:7px;border:1px solid rgba(15,39,68,.15);background:#fff;color:#0f2744}.sg-copy-link:hover{border-color:#1565c8;color:#1565c8}.sg-copy-link.is-copied{border-color:#22c55e;background:#ecfdf5;color:#047857}.dark .sg-copy-link{border-color:rgba(255,255,255,.15);background:rgba(255,255,255,.06);color:#fffdf8}`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceExistingShareButtons)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.setTimeout(enhanceExistingShareButtons, 500)
