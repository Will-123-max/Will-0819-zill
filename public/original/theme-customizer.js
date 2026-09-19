const SETTINGS_API = 'https://studentguide-g5qp.arcada.app/api/settings'
const THEME_DEFAULTS = {
  background_color: '#ffffff',
  text_color: '#0f2744',
  brand_color: '#1565c8',
  header_color: '#ffffff',
  footer_color: '#071320',
}

function validColor(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? value : fallback
}

function applyWebsiteTheme(settings = {}) {
  const theme = { ...THEME_DEFAULTS, ...settings }
  const root = document.documentElement
  root.style.setProperty('--sg-custom-background', validColor(theme.background_color, THEME_DEFAULTS.background_color))
  root.style.setProperty('--sg-custom-text', validColor(theme.text_color, THEME_DEFAULTS.text_color))
  root.style.setProperty('--sg-custom-brand', validColor(theme.brand_color, THEME_DEFAULTS.brand_color))
  root.style.setProperty('--sg-custom-header', validColor(theme.header_color, THEME_DEFAULTS.header_color))
  root.style.setProperty('--sg-custom-footer', validColor(theme.footer_color, THEME_DEFAULTS.footer_color))
}

async function loadWebsiteTheme() {
  try {
    const response = await fetch(SETTINGS_API, { cache: 'no-store' })
    if (!response.ok) return
    applyWebsiteTheme(await response.json())
  } catch {}
}

const colorLabels = {
  'Website background': THEME_DEFAULTS.background_color,
  'Website text color': THEME_DEFAULTS.text_color,
  'Buttons and links': THEME_DEFAULTS.brand_color,
  'Header background': THEME_DEFAULTS.header_color,
  'Footer background': THEME_DEFAULTS.footer_color,
}

function enhanceAdminThemeFields() {
  const form = document.querySelector('form[data-source-loc="src/pages/Admin.jsx:225:4"]')
  if (!form) return
  form.querySelectorAll('label').forEach((label) => {
    const name = Object.keys(colorLabels).find((item) => (label.textContent || '').trim().startsWith(item))
    if (!name) return
    const input = label.querySelector('input')
    if (!input || input.dataset.colorReady === 'true') return
    input.dataset.colorReady = 'true'
    input.type = 'color'
    input.classList.add('sg-admin-color')
    if (!/^#[0-9a-f]{6}$/i.test(input.value)) input.value = colorLabels[name]
  })

  if (form.querySelector('.sg-admin-theme-note')) return
  const note = document.createElement('div')
  note.className = 'sg-admin-theme-note'
  note.innerHTML = '<strong>Website appearance</strong><span>Choose the background, text, buttons, header and footer colors. Save site copy to publish the changes for everyone.</span>'
  const firstColor = [...form.querySelectorAll('label')].find((label) => (label.textContent || '').includes('Website background'))
  firstColor?.before(note)
}

const style = document.createElement('style')
style.textContent = `
body,.bg-paper{background-color:var(--sg-custom-background)!important}body,.text-ink{color:var(--sg-custom-text)!important}.text-brand{color:var(--sg-custom-brand)!important}.bg-brand{background-color:var(--sg-custom-brand)!important}header>div:first-child{background-color:var(--sg-custom-header)!important}footer{background-color:var(--sg-custom-footer)!important}
.sg-admin-color{height:48px!important;padding:5px!important;cursor:pointer}.sg-admin-theme-note{display:flex;flex-direction:column;gap:2px;margin-top:18px;border:1px solid rgba(21,101,200,.2);border-radius:15px;background:#eef6ff;padding:12px 14px;color:#0f2744}.sg-admin-theme-note strong{font-size:13px}.sg-admin-theme-note span{color:#64748b;font-size:11px;line-height:1.5}
`
document.head.appendChild(style)

const observer = new MutationObserver(enhanceAdminThemeFields)
observer.observe(document.documentElement, { childList: true, subtree: true })
loadWebsiteTheme()
window.setInterval(loadWebsiteTheme, 30000)
window.addEventListener('studentsguide:settings-updated', (event) => applyWebsiteTheme(event.detail || {}))
window.setTimeout(enhanceAdminThemeFields, 500)
