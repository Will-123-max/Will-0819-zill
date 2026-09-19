import {
  createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useRef, useState,
} from 'react'
import {
  ArrowLeft, ArrowRight, Bot, Check, ChevronDown, Clock3, Download,
  Eye, ExternalLink, FileText, Menu, Moon, RotateCcw, Search, Send,
  Sun, Timer, X, XCircle, ZoomIn, ZoomOut, RotateCw, Maximize2,
} from 'lucide-react'
import {
  BrowserRouter, Link, NavLink, Route, Routes, useLocation, useNavigate, useParams,
} from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Article, defaultSettings, faculties, fallbackArticles, fallbackGuide, fallbackMaterials,
  fallbackPast, fallbackQuizzes, GuideQuestion, Housing, keyResources, levels, Material,
  moreNav, Outline, PastQuestion, primaryNav, Question, Quiz, resourcesNav,
  Scholarship, servicePages, servicesNav, Settings, studentServices, studyResources,
  universities, whatsAppChannel, whatsAppGroup, whatsAppLink, whatsAppNumber,
} from './data'

const API_BASE = 'https://studentguide-g5qp.arcada.app/api'

async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers ?? {}) },
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error((body as { error?: string }).error || 'Could not load this page')
  return body as T
}

function useRemote<T>(path: string, fallback: T) {
  const [data, setData] = useState<T>(fallback)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    setLoading(true)
    api<T>(path)
      .then((value) => { if (active) { setData(value); setError('') } })
      .catch((reason: Error) => { if (active) setError(reason.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [path])
  return { data, loading, error, setData }
}

function useLiveMaterials() {
  const [data, setData] = useState<Material[]>(fallbackMaterials)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const materials = await api<Material[]>('/materials')
        if (!active) return
        setData(Array.isArray(materials) ? materials : [])
        setConnected(true)
        setLastUpdated(new Date())
      } catch {
        if (active) setConnected(false)
      } finally {
        if (active) setLoading(false)
      }
    }
    void refresh()
    const interval = window.setInterval(refresh, 15000)
    function refreshWhenVisible() { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
    }
  }, [])
  return { data, loading, connected, lastUpdated }
}

function useLivePastQuestions() {
  const [data, setData] = useState<PastQuestion[]>(fallbackPast)
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  useEffect(() => {
    let active = true
    async function refresh() {
      try {
        const papers = await api<PastQuestion[]>('/past-questions')
        if (!active) return
        setData(Array.isArray(papers) ? papers : [])
        setConnected(true)
        setLastUpdated(new Date())
      } catch {
        if (active) setConnected(false)
      } finally {
        if (active) setLoading(false)
      }
    }
    void refresh()
    const interval = window.setInterval(refresh, 15000)
    function refreshWhenVisible() { if (document.visibilityState === 'visible') void refresh() }
    document.addEventListener('visibilitychange', refreshWhenVisible)
    window.addEventListener('online', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      window.removeEventListener('online', refreshWhenVisible)
    }
  }, [])
  return { data, loading, connected, lastUpdated }
}

interface ScanPage {
  url: string
  page: number
}

function normaliseScanPages(value: unknown): ScanPage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is { url: string; page?: number } => Boolean(item && typeof item === 'object' && 'url' in item && typeof item.url === 'string'))
    .map((item, index) => ({ url: item.url, page: Number(item.page) || index + 1 }))
    .sort((first, second) => first.page - second.page)
    .map((item, index) => ({ ...item, page: index + 1 }))
}

function useScanPages(kind: 'material' | 'past', itemId?: string) {
  const [pages, setPages] = useState<ScanPage[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!itemId) { setLoading(false); return }
    let active = true
    async function refresh() {
      try {
        const result = await api<unknown>(`/scan-pages?kind=${kind}&item_id=${itemId}`)
        if (active) setPages(normaliseScanPages(result))
      } catch {
        if (active) setPages([])
      } finally {
        if (active) setLoading(false)
      }
    }
    void refresh()
    const interval = window.setInterval(refresh, 15000)
    return () => { active = false; window.clearInterval(interval) }
  }, [kind, itemId])
  return { pages, loading }
}

interface SettingsContextValue {
  settings: Settings
  dark: boolean
  setDark: (value: boolean) => void
  patchSettings: (value: Partial<Settings>) => void
  resetSettings: () => void
}
const SettingsContext = createContext<SettingsContextValue>({
  settings: defaultSettings, dark: false, setDark: () => undefined,
  patchSettings: () => undefined, resetSettings: () => undefined,
})

function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('studentsguide-settings')
      return saved ? { ...defaultSettings, ...JSON.parse(saved) as Partial<Settings> } : defaultSettings
    } catch { return defaultSettings }
  })
  const [hasLocalSettings] = useState(() => Boolean(localStorage.getItem('studentsguide-settings')))
  const [dark, setDark] = useState(() => localStorage.getItem('studentsguide-theme') === 'dark')
  useEffect(() => {
    if (hasLocalSettings) return
    api<Partial<Settings>>('/settings').then((value) => {
      setSettings({ ...defaultSettings, ...value })
    }).catch(() => undefined)
  }, [hasLocalSettings])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('studentsguide-theme', dark ? 'dark' : 'light')
  }, [dark])
  useEffect(() => { document.title = `${settings.site_name} — ${settings.site_kicker}` }, [settings])
  function patchSettings(value: Partial<Settings>) {
    setSettings((current) => {
      const next = { ...current, ...value }
      localStorage.setItem('studentsguide-settings', JSON.stringify(next))
      return next
    })
  }
  function resetSettings() {
    localStorage.removeItem('studentsguide-settings')
    setSettings(defaultSettings)
    api<Partial<Settings>>('/settings').then((value) => setSettings({ ...defaultSettings, ...value })).catch(() => undefined)
  }
  return <SettingsContext.Provider value={{ settings, dark, setDark, patchSettings, resetSettings }}>{children}</SettingsContext.Provider>
}
const useSettings = () => useContext(SettingsContext)

function BrandName({ name, variant = 'nav' }: { name: string; variant?: 'hero' | 'nav' | 'footer' }) {
  const index = name.toLowerCase().lastIndexOf('guide')
  const colors = variant === 'hero' ? ['#e8c547', '#8ec5ff'] : variant === 'footer' ? ['#ffffff', '#e8c547'] : ['#0f2744', '#1565c8']
  if (index <= 0) return <span style={{ color: colors[0] }}>{name}</span>
  return <span><span style={{ color: colors[0] }}>{name.slice(0, index)}</span><span style={{ color: colors[1] }}>{name.slice(index)}</span></span>
}

function Logo({ className = 'h-11 w-11', light = false }: { className?: string; light?: boolean }) {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)
  return <>
    <button type="button" onClick={() => setOpen(true)} className="rounded-full shrink-0" aria-label="View Studentsguide profile larger">
      <img src={settings.profile_url || '/crest.jpg'} alt="Studentsguide crest" className={`${className} rounded-full object-cover shadow-sm ${light ? 'ring-2 ring-[#e8c547]/70' : 'ring-1 ring-[#0f2744]/10'}`} />
    </button>
    {open && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#071320]/90 p-5 text-white" onClick={() => setOpen(false)}>
      <button className="absolute right-5 top-5 h-11 w-11 rounded-full bg-white/10 grid place-items-center" aria-label="Close" onClick={() => setOpen(false)}><X /></button>
      <div className="text-center" onClick={(event) => event.stopPropagation()}>
        <img src={settings.profile_url || '/crest.jpg'} alt="Studentsguide crest" className="h-[min(78vw,420px)] w-[min(78vw,420px)] rounded-full object-cover ring-4 ring-[#e8c547] shadow-2xl" />
        <p className="display mt-5 text-3xl"><BrandName name={settings.site_name} variant="hero" /></p>
        <p className="mt-1 text-sm font-semibold uppercase tracking-[.18em] text-[#e8c547]">{settings.site_kicker}</p>
      </div>
    </div>}
  </>
}

function Dropdown({ label, items }: { label: string; items: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false)
  return <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
    <button type="button" onClick={() => setOpen((value) => !value)} className="nav-link inline-flex items-center gap-1">{label}<ChevronDown size={14} /></button>
    {open && <div className="absolute left-0 top-full z-50 pt-2">
      <div className="w-56 rounded-2xl border border-[#0f2744]/10 bg-white p-2 shadow-xl dark:border-white/10 dark:bg-[#0b1a2e]">
        {items.map((item) => <Link key={item.to} to={item.to} className="block rounded-lg px-3 py-2 text-sm hover:bg-[#f2f6fb] dark:hover:bg-white/5">{item.label}</Link>)}
      </div>
    </div>}
  </div>
}

function Navbar() {
  const [open, setOpen] = useState(false)
  const { settings, dark, setDark } = useSettings()
  const brandTaps = useRef({ count: 0, time: 0 })
  const allNav = [...primaryNav, ...resourcesNav, ...servicesNav, ...moreNav]
  function handleBrandTap() {
    const now = Date.now()
    if (now - brandTaps.current.time > 1400) brandTaps.current.count = 0
    brandTaps.current.time = now
    brandTaps.current.count += 1
    if (brandTaps.current.count >= 5) {
      brandTaps.current.count = 0
      openStaffGate()
    }
  }
  return <header className="sticky top-0 z-40 border-b border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-black">
    <div className="mx-auto flex h-[4.4rem] max-w-7xl items-center gap-3 px-4">
      <div className="flex min-w-0 shrink-0 items-center gap-2.5">
        <Logo />
        <Link to="/" onClick={handleBrandTap} className="min-w-0 leading-tight">
          <span className="block text-[16px] font-extrabold tracking-tight sm:text-[18px]"><BrandName name={settings.site_name} /></span>
          <span className="hidden text-[10px] font-semibold leading-tight text-slate-500 sm:block">Ebonyi State University Students guide</span>
        </Link>
      </div>
      <nav className="ml-4 hidden items-center gap-0.5 text-[13px] font-semibold text-[#0f2744]/70 xl:flex dark:text-[#fffdf8]/70">
        {primaryNav.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}>{item.label}</NavLink>)}
        <Dropdown label="Resources" items={resourcesNav} /><Dropdown label="Services" items={servicesNav} /><Dropdown label="More" items={moreNav} />
      </nav>
      <div className="ml-auto flex items-center gap-2">
        <Link to="/cbt" className="hidden rounded-xl bg-[#1565c8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f2744] sm:inline-flex">Start CBT</Link>
        <button type="button" onClick={() => setDark(!dark)} className="rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Toggle theme">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
        <button type="button" className="p-2 xl:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </div>
    </div>
    {open && <div className="max-h-[80vh] space-y-1 overflow-y-auto border-t border-[#0f2744]/10 bg-white px-4 py-4 xl:hidden dark:bg-[#0b1a2e]">
      {allNav.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2.5 font-medium hover:bg-[#f2f6fb] dark:hover:bg-white/5">{item.label}</Link>)}
      <a href={whatsAppLink} target="_blank" rel="noreferrer" className="block px-3 py-2.5 font-semibold text-[#128c7e]">WhatsApp {whatsAppNumber}</a>
      <a href={whatsAppChannel} target="_blank" rel="noreferrer" className="block px-3 py-2.5 font-semibold text-[#128c7e]">WhatsApp channel</a>
    </div>}
  </header>
}

function WhatsAppLinks({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  const base = compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
  return <div className="flex flex-wrap justify-center gap-2">
    <a href={whatsAppLink} target="_blank" rel="noreferrer" className={`${base} rounded-full bg-[#25d366] font-semibold ${light ? 'text-[#052e16]' : 'text-white'}`}>WhatsApp {whatsAppNumber}</a>
    <a href={whatsAppChannel} target="_blank" rel="noreferrer" className={`${base} rounded-full border font-semibold ${light ? 'border-white/20 bg-white/10 text-white' : 'border-[#25d366]/40 text-[#128c7e]'}`}>Channel</a>
    <a href={whatsAppGroup} target="_blank" rel="noreferrer" className={`${base} rounded-full border font-semibold ${light ? 'border-white/20 bg-white/10 text-white' : 'border-[#25d366]/40 text-[#128c7e]'}`}>Group</a>
  </div>
}

function Newsletter({ dark = false }: { dark?: boolean }) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  async function submit(event: FormEvent) {
    event.preventDefault(); setMessage('')
    if (!email.includes('@')) { setMessage('Enter a valid email'); return }
    setSending(true)
    try { await api('/newsletter', { method: 'POST', body: JSON.stringify({ email }) }); setMessage('You are on the list. Welcome.'); setEmail('') }
    catch { setMessage('Thanks — your email is ready to be added.') }
    finally { setSending(false) }
  }
  return <form onSubmit={submit} className="space-y-2">
    <div className="flex gap-2"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@university.edu.ng" className={`h-11 min-w-0 flex-1 rounded-xl px-3 text-sm outline-none ${dark ? 'border border-white/15 bg-white/10 text-white placeholder:text-white/40' : 'field'}`} /><button disabled={sending} className="rounded-xl bg-[#e8c547] px-4 text-sm font-semibold text-[#0f2744]">{sending ? '…' : 'Subscribe'}</button></div>
    {message && <p className="text-xs text-emerald-400">{message}</p>}
  </form>
}

function Footer() {
  const { settings } = useSettings()
  return <footer className="mt-16 bg-[#071320] text-[#fffdf8]">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="mb-3 flex items-center gap-3"><Logo className="h-12 w-12" light /><div><p className="text-2xl font-extrabold leading-none"><BrandName name={settings.site_name} variant="footer" /></p><p className="mt-1 text-[11px] uppercase tracking-[.16em] text-[#e8c547]">{settings.site_kicker}</p></div></div>
        <p className="max-w-md leading-relaxed text-[#fffdf8]/70">{settings.footer_blurb}</p>
        <p className="mb-2 mt-5 text-sm font-semibold">Join us on WhatsApp</p><div className="flex justify-start"><WhatsAppLinks compact light /></div>
        <div className="mt-6 max-w-md"><p className="mb-2 text-sm font-semibold">Get weekly EBSU updates</p><Newsletter dark /></div>
      </div>
      <div><h4 className="mb-3 font-semibold">Key resources</h4><ul className="space-y-2 text-sm text-[#fffdf8]/70">{resourcesNav.map((item) => <li key={item.to}><Link className="hover:text-[#e8c547]" to={item.to}>{item.label}</Link></li>)}</ul></div>
      <div><h4 className="mb-3 font-semibold">Student services</h4><ul className="space-y-2 text-sm text-[#fffdf8]/70">{servicesNav.map((item) => <li key={item.to}><Link className="hover:text-[#e8c547]" to={item.to}>{item.label}</Link></li>)}<li><Link to="/materials">Study Materials</Link></li><li><Link to="/contact">Contact</Link></li><li><a href={whatsAppLink}>WhatsApp {whatsAppNumber}</a></li></ul></div>
    </div>
    <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-[#fffdf8]/50">© {new Date().getFullYear()} Studentsguide · Ebonyi State University Students guide. Not an official EBSU portal.<button type="button" onClick={openStaffGate} className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-[#e8c547]/25 align-middle hover:bg-[#e8c547]" aria-label="Staff gate" /></div>
  </footer>
}

function SearchBar({ large = false, initial = '' }: { large?: boolean; initial?: string }) {
  const [query, setQuery] = useState(initial)
  const navigate = useNavigate()
  function submit(event: FormEvent) { event.preventDefault(); if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`) }
  return <form onSubmit={submit} className={`flex items-stretch overflow-hidden rounded-full border border-[#0f2744]/10 bg-white shadow-xl ${large ? 'p-1.5' : 'p-1'}`}>
    <div className="flex items-center pl-4 text-slate-400"><Search size={large ? 22 : 18} /></div>
    <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search COS 101, GST, past questions, campus map…" className={`min-w-0 flex-1 bg-transparent px-3 text-[#0f2744] outline-none ${large ? 'h-12 text-base' : 'h-10 text-sm'}`} />
    <button className={`rounded-full bg-[#1565c8] px-5 font-semibold text-white ${large ? 'text-base' : 'text-sm'}`}>Search</button>
  </form>
}

function PageHero({ kicker, title, text, image }: { kicker: string; title: string; text: string; image: string }) {
  return <section className="relative mb-10 flex min-h-[210px] items-end overflow-hidden rounded-[24px]">
    <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
    <div className="absolute inset-0 bg-gradient-to-t from-[#071320] via-[#0b1a2e]/75 to-[#1565c8]/25" />
    <div className="relative z-10 max-w-3xl p-6 text-[#fffdf8] md:p-10"><p className="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-[#e8c547]">{kicker}</p><h1 className="display text-4xl leading-tight md:text-5xl">{title}</h1><p className="mt-3 max-w-xl text-[#fffdf8]/80">{text}</p></div>
  </section>
}

function LoadingCards() { return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/10" />)}</div> }
function Empty({ title, text }: { title: string; text: string }) { return <div className="rounded-3xl border border-dashed border-[#0f2744]/15 bg-white/60 px-6 py-16 text-center dark:bg-white/5"><h3 className="display text-2xl">{title}</h3><p className="mx-auto mt-2 max-w-md text-slate-500">{text}</p></div> }
function formatDate(value?: string) { if (!value) return 'Recently'; try { return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)) } catch { return value } }
function image(settings: Settings, slot: keyof Settings, fallback: string) { return settings[slot] || fallback }

function ClearScanReader({ pages, title }: { pages: ScanPage[]; title: string }) {
  const [pageIndex, setPageIndex] = useState(0)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [clearMode, setClearMode] = useState(true)
  const [contrast, setContrast] = useState(128)
  const [brightness, setBrightness] = useState(106)
  if (!pages.length) return null
  const current = pages[Math.min(pageIndex, pages.length - 1)]
  function changePage(next: number) {
    setPageIndex(Math.max(0, Math.min(pages.length - 1, next)))
    setZoom(1)
    setRotation(0)
  }
  const filter = clearMode ? `contrast(${contrast}%) brightness(${brightness}%) saturate(75%)` : 'none'
  return <section className="mt-10 overflow-hidden rounded-[28px] border border-[#0f2744]/10 bg-white shadow-xl dark:border-white/10 dark:bg-[#0b1a2e]">
    <div className="border-b border-[#0f2744]/10 p-4 md:p-5 dark:border-white/10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2"><h2 className="display text-2xl">Clear scan reader</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Phone upload enhanced</span></div>
          <p className="mt-1 text-sm text-slate-500">Page {current.page} of {pages.length} · clarity mode makes handwriting and print easier to read.</p>
        </div>
        <a href={current.url} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#0f2744]/10 px-3 text-sm font-semibold dark:border-white/10"><Maximize2 size={16} /> Full size</a>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setClearMode(!clearMode)} className={`h-10 rounded-xl px-3 text-sm font-semibold ${clearMode ? 'bg-emerald-600 text-white' : 'border border-[#0f2744]/10 dark:border-white/10'}`}>Auto clear {clearMode ? 'On' : 'Off'}</button>
        <button type="button" onClick={() => setZoom((value) => Math.max(.75, value - .25))} className="reader-control" aria-label="Zoom out"><ZoomOut size={17} /></button>
        <span className="min-w-14 text-center text-xs font-bold text-slate-500">{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom((value) => Math.min(3, value + .25))} className="reader-control" aria-label="Zoom in"><ZoomIn size={17} /></button>
        <button type="button" onClick={() => setRotation((value) => (value + 90) % 360)} className="reader-control" aria-label="Rotate page"><RotateCw size={17} /></button>
        <button type="button" onClick={() => { setZoom(1); setRotation(0); setContrast(128); setBrightness(106); setClearMode(true) }} className="h-10 rounded-xl border border-[#0f2744]/10 px-3 text-xs font-semibold dark:border-white/10">Reset</button>
      </div>
      {clearMode && <div className="mt-4 grid gap-3 rounded-2xl bg-[#f4f7fb] p-3 sm:grid-cols-2 dark:bg-white/5">
        <label className="flex items-center gap-3 text-xs font-semibold"><span className="w-20">Contrast</span><input type="range" min="100" max="175" value={contrast} onChange={(event) => setContrast(Number(event.target.value))} className="min-w-0 flex-1 accent-[#1565c8]" /><span className="w-9 text-right text-slate-500">{contrast}%</span></label>
        <label className="flex items-center gap-3 text-xs font-semibold"><span className="w-20">Brightness</span><input type="range" min="85" max="130" value={brightness} onChange={(event) => setBrightness(Number(event.target.value))} className="min-w-0 flex-1 accent-[#1565c8]" /><span className="w-9 text-right text-slate-500">{brightness}%</span></label>
      </div>}
      {pages.length > 1 && <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">{pages.map((page, index) => <button type="button" key={`${page.url}-${page.page}`} onClick={() => changePage(index)} className={`h-9 min-w-9 rounded-lg px-2 text-sm font-bold ${index === pageIndex ? 'bg-[#0f2744] text-white' : 'bg-[#eef3f9] text-[#0f2744] dark:bg-white/10 dark:text-white'}`}>{page.page}</button>)}</div>}
    </div>
    <div className="scan-reader-stage">
      <img
        src={current.url}
        alt={`${title} — page ${current.page} of ${pages.length}`}
        className="scan-reader-image"
        style={{ width: `${zoom * 100}%`, filter, transform: `rotate(${rotation}deg)` }}
        loading="eager"
        decoding="async"
      />
    </div>
    <div className="flex items-center justify-between gap-2 border-t border-[#0f2744]/10 p-3 dark:border-white/10">
      <button type="button" disabled={pageIndex === 0} onClick={() => changePage(pageIndex - 1)} className="inline-flex h-11 items-center gap-1 rounded-xl border border-[#0f2744]/15 px-4 font-semibold disabled:opacity-35 dark:border-white/15"><ArrowLeft size={16} /> Previous</button>
      <p className="text-center text-sm font-semibold">Page {current.page} of {pages.length}</p>
      <button type="button" disabled={pageIndex >= pages.length - 1} onClick={() => changePage(pageIndex + 1)} className="inline-flex h-11 items-center gap-1 rounded-xl bg-[#0f2744] px-4 font-semibold text-white disabled:opacity-35">Next <ArrowRight size={16} /></button>
    </div>
  </section>
}

function HomePage() {
  const { settings } = useSettings()
  const { data: materials } = useLiveMaterials()
  const { data: articles, loading } = useRemote<Article[]>('/articles?limit=4', fallbackArticles)
  const { data: quizzes } = useRemote<Quiz[]>('/quizzes', fallbackQuizzes)
  const { data: past } = useLivePastQuestions()
  const featured = (materials.filter((item) => item.featured).length ? materials.filter((item) => item.featured) : materials).slice(0, 4)
  const pastCount = past.reduce((sum, item) => sum + Number(item.question_count || 0), 0)
  return <div>
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0b1a2e] via-[#12345a] to-[#1565c8]">
      <img src={image(settings, 'img_hero', '/images/hero-students.jpg')} alt="Students studying" className="absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-overlay" />
      <div className="hero-glow absolute inset-0" />
      <div className="relative z-10 mx-auto max-w-5xl px-4 py-16 text-center text-[#fffdf8] md:py-24">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 flex justify-center"><Logo className="h-20 w-20 ring-2 ring-[#e8c547]/50" /></div>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-[#e8c547]">Ebonyi State University Students guide</p>
          <h1 className="display mt-2 text-4xl leading-[1.05] md:text-6xl"><BrandName name={settings.hero_title || settings.site_name} variant="hero" /></h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#fffdf8]/80">{settings.hero_text}</p>
          <div className="mx-auto mt-8 max-w-2xl"><SearchBar large /></div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">{[['/materials', 'Materials'], ['/past-questions', 'Past Questions'], ['/cbt', 'CBT'], ['/map', 'Campus Map'], ['/scholarships', 'Scholarships']].map(([to, label]) => <Link key={to} to={to} className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-sm hover:bg-white/20">{label}</Link>)}</div>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/materials" className="rounded-full bg-[#e8c547] px-6 py-3 font-semibold text-[#0f2744]">{settings.cta_primary}</Link><Link to="/cbt" className="rounded-full border border-white/25 bg-white/10 px-6 py-3 font-semibold">{settings.cta_secondary}</Link></div>
          <div className="mt-5"><WhatsAppLinks compact light /></div>
        </motion.div>
      </div>
    </section>
    <section className="relative z-10 mx-auto -mt-8 grid max-w-7xl grid-cols-2 gap-3 px-4 md:grid-cols-4">
      <Stat value={materials.length} label="Live materials available" live />
      <Stat value={pastCount || '—'} label="Live past questions" live /><Stat value="CBT" label="Timed practice" /><Stat value="Open" label="No login needed" />
    </section>
    <section className="section-wrap mt-16"><p className="eyebrow">Browse by topic</p><h2 className="section-title">Key resources</h2><p className="mt-1 text-slate-500">Each EBSU guide item opens as a question — pick an answer or tap View Answer.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{keyResources.map((card) => <ResourceTile key={card.to} card={card} />)}</div></section>
    <section className="section-wrap mt-16"><p className="eyebrow">Student services</p><h2 className="section-title mb-6">Library, counselling, IT and recreation</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{studentServices.map((card) => { const Icon = card.icon; return <Link key={card.to} to={card.to} className="group relative min-h-[230px] overflow-hidden rounded-3xl shadow-xl"><img src={image(settings, card.slot!, '/images/campus.jpg')} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0f2744] via-[#0f2744]/35 to-transparent" /><div className="absolute bottom-0 p-5 text-[#fffdf8]"><Icon size={22} className="mb-2 text-[#e8c547]" /><h3 className="text-lg font-semibold">{card.title}</h3><p className="mt-1 text-xs text-[#fffdf8]/70">{card.text}</p></div></Link> })}</div></section>
    <section className="section-wrap mt-16"><h2 className="section-title mb-6">Study and campus life</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{studyResources.map((card) => <ResourceTile key={card.to} card={card} simple />)}</div></section>
    <section className="section-wrap mt-16"><div className="mb-6 flex items-end justify-between"><div><p className="eyebrow">Library</p><h2 className="section-title">Featured materials</h2></div><Link to="/materials" className="text-sm font-semibold text-[#1565c8]">All materials</Link></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{featured.map((item) => <MaterialMini key={item.id} item={item} settings={settings} />)}</div></section>
    <section className="section-wrap mt-16"><div className="mb-6 flex items-end justify-between"><h2 className="section-title">Latest student updates</h2><Link to="/updates" className="text-sm font-semibold text-[#1565c8]">All updates</Link></div>{loading ? <LoadingCards /> : <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{articles.slice(0, 4).map((item, index) => <Link key={item.id} to={`/updates/${item.slug}`} className={`group relative min-h-[220px] overflow-hidden rounded-3xl ${index === 0 ? 'lg:col-span-2 lg:min-h-[360px]' : ''}`}><img src={item.image_url || settings.img_campus} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#0f2744] via-[#0f2744]/40 to-transparent" /><div className="absolute bottom-0 p-5 text-[#fffdf8]"><span className="rounded-full bg-[#e8c547] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#0f2744]">{item.category}</span><h3 className={`display mt-2 leading-tight ${index === 0 ? 'text-3xl' : 'text-lg'}`}>{item.title}</h3><p className="mt-2 text-xs text-[#fffdf8]/70">{formatDate(item.published_at)} · {item.school || 'National'}</p></div></Link>)}</div>}</section>
    <section className="section-wrap mb-6 mt-16"><div className="grid items-center gap-8 rounded-[32px] bg-[#0f2744] p-8 text-[#fffdf8] md:grid-cols-2 md:p-12"><div><p className="eyebrow">CBT engine</p><h2 className="display mt-2 text-4xl">Practice like the real exam.</h2><p className="mt-3 text-[#fffdf8]/70">Set your own time, shuffled questions, instant percentage and a review of every correct and wrong answer.</p><Link to="/cbt" className="mt-6 inline-block rounded-full bg-[#e8c547] px-6 py-3 font-semibold text-[#0f2744]">Start a quiz</Link></div><div className="space-y-3">{quizzes.slice(0, 3).map((quiz) => <Link key={quiz.id} to={`/cbt/${quiz.id}`} className="block rounded-2xl border border-white/10 bg-white/10 px-4 py-3 hover:bg-white/15"><p className="font-semibold">{quiz.title}</p><p className="text-xs text-[#fffdf8]/60">{quiz.question_count} questions · {quiz.duration_minutes} min · {quiz.attempts} attempts</p></Link>)}</div></div></section>
  </div>
}

function Stat({ value, label, live = false }: { value: string | number; label: string; live?: boolean }) { return <div className="relative flex flex-col justify-center rounded-2xl border border-[#0f2744]/5 bg-white p-4 text-center shadow-xl dark:bg-[#0b1a2e]/90">{live && <span className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-emerald-400" />}<div className={`display text-3xl ${live ? 'text-emerald-600' : 'text-[#1565c8]'}`}>{value}</div><div className="mt-1 text-xs text-slate-500">{label}</div></div> }
function ResourceTile({ card, simple = false }: { card: typeof keyResources[number]; simple?: boolean }) { const Icon = card.icon; return <Link to={card.to} className="sg-card group p-5"><span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${simple ? 'bg-[#eef6ff] text-[#1565c8]' : `tint-${card.tint}`}`}><Icon size={20} /></span><h3 className="mt-3 text-lg font-semibold">{card.title}</h3><p className="mt-1 text-sm text-slate-500">{card.text}</p><span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1565c8]">Open <ArrowRight size={14} /></span></Link> }
function MaterialMini({ item, settings }: { item: Material; settings: Settings }) { return <Link to={`/materials/${item.id}`} className="sg-card overflow-hidden"><img src={item.cover_url || settings.img_materials} alt="" className="h-36 w-full object-cover" /><div className="p-4"><div className="flex items-center justify-between text-[11px] font-semibold"><span className="text-[#1565c8]">{item.course_code}</span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">{item.is_premium ? 'Premium' : 'Free'}</span></div><h3 className="line-clamp-2 mt-1 font-semibold">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.university} · {item.type}</p><p className="mt-2 inline-flex items-center gap-1 text-xs text-slate-400"><Download size={12} /> {item.downloads || 0}</p></div></Link> }

function MaterialsPage() {
  const { settings } = useSettings()
  const { data, loading } = useLiveMaterials()
  const [filters, setFilters] = useState({ university: '', faculty: '', level: '', type: 'All', q: '' })
  const filtered = useMemo(() => data.filter((item) => (!filters.university || item.university === filters.university) && (!filters.faculty || item.faculty === filters.faculty) && (!filters.level || item.level === filters.level) && (filters.type === 'All' || item.type === filters.type) && (!filters.q || `${item.course_code} ${item.title}`.toLowerCase().includes(filters.q.toLowerCase()))), [data, filters])
  function downloadAll() { const body = data.map((item, index) => `${index + 1}. ${item.course_code} — ${item.title}\n${item.content || ''}`).join('\n\n-----\n\n'); downloadText('studentsguide-all-materials.txt', body) }
  return <main className="page-wrap"><PageHero kicker="Library" title="Study Materials" text={`${data.length} materials available on Studentsguide. New uploads from the admin desk appear here automatically.`} image={settings.img_materials} />
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">On this site</p><p className="display text-4xl leading-none text-[#1565c8]">{data.length}</p><p className="mt-1 text-sm text-slate-500">{data.length === 1 ? '1 material' : `${data.length} materials`} uploaded</p></div><button onClick={downloadAll} className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">Download all to phone</button></div>
    <div className="mb-6 grid gap-3 md:grid-cols-4"><select className="field" value={filters.university} onChange={(e) => setFilters({ ...filters, university: e.target.value })}><option value="">All universities</option>{universities.map((value) => <option key={value}>{value}</option>)}</select><select className="field" value={filters.faculty} onChange={(e) => setFilters({ ...filters, faculty: e.target.value })}><option value="">All faculties</option>{faculties.map((value) => <option key={value}>{value}</option>)}</select><select className="field" value={filters.level} onChange={(e) => setFilters({ ...filters, level: e.target.value })}><option value="">All levels</option>{levels.map((value) => <option key={value} value={value}>{value} Level</option>)}</select><input className="field" placeholder="Course code or title" value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} /></div>
    <div className="mb-8 flex flex-wrap gap-2">{['All', 'PDF', 'Notes', 'Handout', 'Slide'].map((value) => <button key={value} onClick={() => setFilters({ ...filters, type: value })} className={`chip ${filters.type === value ? 'chip-on' : ''}`}>{value}</button>)}</div>
    {loading ? <LoadingCards /> : filtered.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <MaterialCard key={item.id} item={item} settings={settings} />)}</div> : <Empty title="No materials match" text="Try a different school or course code." />}
  </main>
}
function MaterialCard({ item, settings }: { item: Material; settings: Settings }) { return <article className="sg-card flex flex-col overflow-hidden"><img src={item.cover_url || settings.img_materials} alt="" className="h-40 w-full object-cover" /><div className="flex flex-1 flex-col p-5"><div className="flex items-center justify-between text-xs text-slate-500"><span className="font-semibold text-[#1565c8]">{item.course_code}</span><span>{item.file_url ? 'File attached' : item.is_premium ? 'Premium' : 'Free'}</span></div><h3 className="mt-1 text-lg font-semibold">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.university} · {item.department || item.faculty} · {item.level}L</p><p className="mt-2 flex items-center gap-3 text-xs text-slate-400"><Download size={12} /> {item.downloads || 0} · <Eye size={12} /> {item.views || 0}</p><div className="mt-auto flex gap-2 pt-4"><Link to={`/materials/${item.id}`} className="flex-1 rounded-xl bg-black py-2 text-center text-sm font-semibold text-white">View</Link>{item.file_url ? <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-black/15 px-3 text-sm font-semibold">File</a> : <button onClick={() => downloadText(`${item.course_code}-${item.title}.txt`, `${item.title}\n${item.course_code}\n\n${item.content || ''}`)} className="rounded-xl border border-black/15 px-3 text-sm font-semibold">Save</button>}</div></div></article> }
function downloadText(name: string, content: string) { const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' })); const element = document.createElement('a'); element.href = url; element.download = name.replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-'); element.click(); setTimeout(() => URL.revokeObjectURL(url), 500) }

function MaterialDetailPage() {
  const { id } = useParams()
  const { settings } = useSettings()
  const fallback = fallbackMaterials.find((item) => String(item.id) === id) || fallbackMaterials[0]
  const { data: item, loading } = useRemote<Material>(`/materials?id=${id}`, fallback)
  const { pages } = useScanPages('material', id)
  if (loading) return <main className="page-wrap"><LoadingCards /></main>
  const fileIsImage = Boolean(item.file_url && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(item.file_url))
  const readablePages = pages.length ? pages : fileIsImage && item.file_url ? [{ url: item.file_url, page: 1 }] : []
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <Link to="/materials" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1565c8]"><ArrowLeft size={15} /> All materials</Link>
    <div className="mt-4 overflow-hidden rounded-[32px] bg-slate-100"><img src={item.cover_url || settings.img_materials} alt="" className="h-64 w-full object-cover" /></div>
    <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
      <div><p className="eyebrow">{item.course_code} · {item.type}</p><h1 className="display mt-1 text-4xl md:text-5xl">{item.title}</h1><p className="mt-2 text-slate-500">{item.university} · {item.faculty} · {item.level} Level</p></div>
      <div className="flex flex-wrap gap-2">
        {item.file_url && <a href={item.file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0f2744] px-5 py-3 font-semibold text-white"><ExternalLink size={17} /> Open original</a>}
        <button onClick={() => downloadText(`${item.course_code}-${item.title}.txt`, `${item.title}\n\n${item.content || ''}`)} className="inline-flex items-center gap-2 rounded-xl border border-[#0f2744]/15 px-5 py-3 font-semibold"><Download size={17} /> Save notes</button>
      </div>
    </div>
    <ClearScanReader pages={readablePages} title={item.title} />
    <div className="prose-copy mt-8 whitespace-pre-wrap">{item.content || (readablePages.length ? 'Use the clear scan reader above to read every uploaded page.' : 'This material is available from the Studentsguide library. Open the attached file or check back for the next scan.')}</div>
    {item.topics?.length ? <div className="mt-6 flex flex-wrap gap-2">{item.topics.map((topic) => <span className="chip" key={topic}>{topic}</span>)}</div> : null}
  </main>
}

function PastQuestionsPage() {
  const { settings } = useSettings(); const { data, loading } = useLivePastQuestions(); const [school, setSchool] = useState('All')
  const filtered = school === 'All' ? data : data.filter((item) => item.school === school)
  return <main className="page-wrap"><PageHero kicker="Question bank" title="Past Questions" text="University, JAMB, WAEC, NECO and Post-UTME questions with clear answers. New admin uploads appear automatically." image={settings.img_exam} /><div className="mb-8 flex flex-wrap gap-2">{['All', ...universities].map((value) => <button key={value} onClick={() => setSchool(value)} className={`chip ${school === value ? 'chip-on' : ''}`}>{value}</button>)}</div>{loading ? <LoadingCards /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <Link to={`/past-questions/${item.id}`} key={item.id} className="sg-card p-5"><div className="flex justify-between text-xs font-semibold text-[#1565c8]"><span>{item.course_code}</span><span>{item.year}</span></div><h2 className="mt-2 text-xl font-semibold">{item.title}</h2><p className="mt-2 text-sm text-slate-500">{item.school} · {item.department || item.exam_type}</p><div className="mt-5 flex items-center justify-between border-t border-[#0f2744]/10 pt-4 text-sm"><span>{item.question_count} questions</span><span className="font-semibold text-[#1565c8]">Open →</span></div></Link>)}</div>}</main>
}
function PastDetailPage() {
  const { id } = useParams()
  const fallback = fallbackPast.find((item) => String(item.id) === id) || fallbackPast[0]
  const { data, loading } = useRemote<PastQuestion>(`/past-questions?id=${id}`, fallback)
  const { pages } = useScanPages('past', id)
  if (loading) return <main className="page-wrap"><LoadingCards /></main>
  return <main className="mx-auto max-w-4xl px-4 py-10">
    <Link to="/past-questions" className="inline-flex items-center gap-1 text-sm font-semibold text-[#1565c8]"><ArrowLeft size={15} /> Past questions</Link>
    <p className="eyebrow mt-6">{data.school} · {data.exam_type} · {data.year}</p>
    <h1 className="display mt-2 text-4xl md:text-5xl">{data.title}</h1>
    <p className="mt-2 text-slate-500">{data.course_code} · {data.question_count} questions · {data.views || 0} views</p>
    <ClearScanReader pages={pages} title={data.title} />
    {pages.length > 0 && <div className="mt-10 flex items-center gap-3"><span className="h-px flex-1 bg-[#0f2744]/10 dark:bg-white/10" /><span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Typed questions and answers</span><span className="h-px flex-1 bg-[#0f2744]/10 dark:bg-white/10" /></div>}
    <div className="mt-8 space-y-4">{(data.questions || []).map((question, index) => <AnswerCard key={index} question={question} index={index} />)}</div>
  </main>
}
function AnswerCard({ question, index }: { question: Question; index: number }) {
  const [selected, setSelected] = useState(''); const [revealed, setRevealed] = useState(false); const correct = question.answer || question.correct || ''
  return <article className="sg-card p-5"><p className="text-xs font-semibold text-[#1565c8]">QUESTION {index + 1}</p><h3 className="mt-2 text-[17px] font-semibold leading-7">{question.prompt}</h3><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options?.map((option, optionIndex) => { const checked = revealed || selected; const good = option === correct; const bad = option === selected && option !== correct; return <button key={option} onClick={() => setSelected(option)} className={`rounded-xl border px-4 py-3 text-left text-sm transition ${checked && good ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : bad ? 'border-rose-400 bg-rose-50 text-rose-700' : selected === option ? 'border-[#1565c8] bg-[#eef6ff]' : 'border-[#0f2744]/10 bg-white dark:bg-white/5'}`}><span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button> })}</div><button onClick={() => setRevealed(!revealed)} className="mt-4 text-sm font-semibold text-[#1565c8]">{revealed ? 'Hide Answer' : 'View Answer'}</button>{(revealed || selected) && <div className="mt-3 rounded-xl bg-[#f4f7fb] p-4 text-sm dark:bg-white/5"><p className="font-semibold text-emerald-700">Answer: {correct}</p>{question.explanation && <p className="mt-1 text-slate-600 dark:text-slate-300">{question.explanation}</p>}</div>}</article>
}

function CbtPage() {
  const { settings } = useSettings(); const { data, loading } = useRemote<Quiz[]>('/quizzes', fallbackQuizzes)
  return <main className="page-wrap"><PageHero kicker="Practice mode" title="CBT Practice" text="Choose a quiz, set your own time and get your score immediately. No login required." image={settings.img_exam} />{loading ? <LoadingCards /> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{data.map((quiz) => <Link to={`/cbt/${quiz.id}`} key={quiz.id} className="sg-card p-6"><div className="flex items-start justify-between"><span className="rounded-xl bg-[#eef6ff] p-3 text-[#1565c8]"><Timer /></span><span className="text-xs font-semibold text-slate-400">{quiz.exam_type}</span></div><h2 className="mt-5 text-xl font-semibold">{quiz.title}</h2><p className="mt-1 text-sm text-slate-500">{quiz.course_code}</p><div className="mt-5 flex gap-4 text-xs text-slate-500"><span>{quiz.question_count} questions</span><span>{quiz.duration_minutes} min</span><span>{quiz.attempts} attempts</span></div><span className="mt-5 inline-block rounded-xl bg-[#0f2744] px-4 py-2 text-sm font-semibold text-white">Start practice</span></Link>)}</div>}</main>
}
function CbtTakePage() {
  const { id } = useParams(); const fallback = fallbackQuizzes.find((item) => String(item.id) === id) || fallbackQuizzes[0]; const { data: quiz, loading } = useRemote<Quiz>(`/quizzes?id=${id}`, fallback)
  const [started, setStarted] = useState(false); const [minutes, setMinutes] = useState(fallback.duration_minutes); const [remaining, setRemaining] = useState(fallback.duration_minutes * 60); const [answers, setAnswers] = useState<Record<number, string>>({}); const [submitted, setSubmitted] = useState(false)
  useEffect(() => { if (!started || submitted) return; const timer = window.setInterval(() => setRemaining((value) => { if (value <= 1) { setSubmitted(true); return 0 } return value - 1 }), 1000); return () => clearInterval(timer) }, [started, submitted])
  useEffect(() => { if (!started) { setMinutes(quiz.duration_minutes || 10); setRemaining((quiz.duration_minutes || 10) * 60) } }, [quiz, started])
  if (loading) return <main className="page-wrap"><LoadingCards /></main>
  const questions = quiz.questions || []
  if (!started) return <main className="mx-auto max-w-2xl px-4 py-14"><Link to="/cbt" className="text-sm font-semibold text-[#1565c8]">← All quizzes</Link><div className="sg-card mt-5 p-7 md:p-10"><p className="eyebrow">{quiz.exam_type} CBT</p><h1 className="display mt-2 text-4xl">{quiz.title}</h1><p className="mt-3 text-slate-500">{quiz.question_count} questions · default {quiz.duration_minutes} minutes</p><label className="mt-8 block text-sm font-semibold">Set your own time (minutes)</label><input type="number" min="1" max="180" className="field mt-2" value={minutes} onChange={(e) => setMinutes(Math.max(1, Number(e.target.value)))} /><div className="mt-6 rounded-2xl bg-[#eef6ff] p-4 text-sm text-slate-600"><p className="font-semibold text-[#0f2744]">Before you begin</p><p className="mt-1">Choose one answer for each question. Your score and corrections appear immediately when you submit.</p></div><button onClick={() => { setStarted(true); setRemaining(minutes * 60) }} className="mt-6 w-full rounded-2xl bg-[#0f2744] py-3 font-semibold text-white">Begin exam</button></div></main>
  const score = questions.reduce((sum, question, index) => sum + (answers[index] === question.correct ? 1 : 0), 0)
  return <main className="mx-auto max-w-4xl px-4 py-8"><div className="sticky top-[5.2rem] z-20 mb-6 flex items-center justify-between rounded-2xl bg-[#0f2744] px-5 py-4 text-white shadow-xl"><div><p className="text-xs text-white/60">{quiz.title}</p><p className="font-semibold">{Object.keys(answers).length}/{questions.length} answered</p></div><div className={`inline-flex items-center gap-2 text-xl font-bold ${remaining < 60 ? 'text-rose-300' : 'text-[#e8c547]'}`}><Clock3 size={20} /> {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</div></div>{submitted && <div className="mb-6 rounded-3xl bg-[#eef6ff] p-7 text-center dark:bg-white/10"><p className="eyebrow">Your result</p><p className="display mt-2 text-5xl text-[#1565c8]">{score}/{questions.length}</p><p className="mt-2 font-semibold">{questions.length ? Math.round(score / questions.length * 100) : 0}%</p><button onClick={() => { setStarted(false); setSubmitted(false); setAnswers({}) }} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#0f2744]/15 px-4 py-2 text-sm font-semibold"><RotateCcw size={15} /> Try again</button></div>}<div className="space-y-4">{questions.map((question, index) => <article key={question.id || index} className="sg-card p-5"><p className="text-xs font-semibold text-[#1565c8]">QUESTION {index + 1}</p><h2 className="mt-2 text-[17px] font-semibold leading-7">{question.prompt}</h2><div className="mt-4 grid gap-2">{question.options.map((option, optionIndex) => { const chosen = answers[index] === option; const correct = submitted && option === question.correct; const wrong = submitted && chosen && option !== question.correct; return <button disabled={submitted} key={option} onClick={() => setAnswers({ ...answers, [index]: option })} className={`rounded-xl border px-4 py-3 text-left ${correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : wrong ? 'border-rose-400 bg-rose-50 text-rose-700' : chosen ? 'border-[#1565c8] bg-[#eef6ff]' : 'border-[#0f2744]/10 dark:bg-white/5'}`}><span className="mr-2 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>{option}</button> })}</div>{submitted && question.explanation && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">{question.explanation}</p>}</article>)}</div>{!submitted && <button onClick={() => setSubmitted(true)} className="mt-7 w-full rounded-2xl bg-[#1565c8] py-3 font-semibold text-white">Submit and see score</button>}</main>
}

function UpdatesPage() {
  const { settings } = useSettings(); const { data, loading } = useRemote<Article[]>('/articles', fallbackArticles); const [category, setCategory] = useState('All'); const categories = ['All', 'Admission', 'Fees', 'Exams', 'NELFUND', 'Campus', 'Tips']; const filtered = category === 'All' ? data : data.filter((item) => item.category === category)
  return <main className="page-wrap"><PageHero kicker="Newsroom" title="School Updates" text="Admission lists, fees, calendars, NELFUND and campus stories." image={settings.img_campus_walk} /><div className="mb-8 flex flex-wrap gap-2">{categories.map((value) => <button key={value} onClick={() => setCategory(value)} className={`chip ${category === value ? 'chip-on' : ''}`}>{value}</button>)}</div>{loading ? <LoadingCards /> : <div className="grid gap-6 md:grid-cols-3">{filtered.map((item) => <Link key={item.id} to={`/updates/${item.slug}`} className="sg-card overflow-hidden"><img src={item.image_url || settings.img_campus} alt="" className="h-44 w-full object-cover" /><div className="p-5"><p className="text-xs font-semibold text-[#1565c8]">{item.category} · {item.school || 'National'}</p><h2 className="mt-1 text-lg font-semibold leading-snug">{item.title}</h2><p className="line-clamp-2 mt-2 text-sm text-slate-500">{item.excerpt || item.body}</p><p className="mt-3 text-xs text-slate-400">{formatDate(item.published_at)} · {item.views || 0} views</p></div></Link>)}</div>}</main>
}
function ArticlePage() {
  const { slug } = useParams(); const fallback = fallbackArticles.find((item) => item.slug === slug) || fallbackArticles[0]; const { data, loading } = useRemote<Article>(`/articles?slug=${encodeURIComponent(slug || '')}`, fallback)
  if (loading) return <main className="page-wrap"><LoadingCards /></main>
  return <main className="mx-auto max-w-4xl px-4 py-10"><Link to="/updates" className="text-sm font-semibold text-[#1565c8]">← All updates</Link><p className="eyebrow mt-6">{data.category} · {data.school}</p><h1 className="display mt-2 text-4xl leading-tight md:text-5xl">{data.title}</h1><p className="mt-2 text-slate-500">{formatDate(data.published_at)} · {data.author} · {data.views || 0} views</p><img src={data.image_url || '/images/campus.jpg'} alt="" className="mt-6 h-80 w-full rounded-[28px] object-cover" /><div className="prose-copy mt-8 whitespace-pre-wrap">{data.body}</div><button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${data.title}\n\n${data.excerpt || data.body?.slice(0, 400)}\n\nFrom Studentsguide`)}`, '_blank')} className="mt-6 inline-flex rounded-xl bg-[#25d366] px-5 py-2.5 font-semibold text-white">Forward to WhatsApp</button><p className="mt-8 rounded-2xl border border-[#e8c547]/30 bg-[#e8c547]/15 p-4 text-sm">Independent student reporting. Confirm dates, lists and fees with the official institution before you pay or travel.</p></main>
}

function GuidePage({ kind }: { kind: string }) {
  const config = servicePages[kind] || servicePages.help; const { settings } = useSettings(); const fallback = fallbackGuide.filter((item) => item.category === config.category); const { data, loading } = useRemote<GuideQuestion[]>(`/guide-qs?category=${config.category}`, fallback)
  return <main className="page-wrap"><PageHero kicker={config.kicker} title={config.title} text={config.text} image={settings[config.slot]} />{loading ? <LoadingCards /> : data.length ? <div className="grid gap-4 lg:grid-cols-2">{data.map((question, index) => <GuideCard key={question.id} question={question} index={index} />)}</div> : <Empty title={`More ${config.title} items are coming`} text="Check back after the next update from the Studentsguide desk." />}{kind === 'scholarships' && <ScholarshipList />}</main>
}
function GuideCard({ question, index }: { question: GuideQuestion; index: number }) { const [choice, setChoice] = useState(''); const [open, setOpen] = useState(false); return <article className="sg-card p-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wider text-[#1565c8]">{question.topic || `Guide ${index + 1}`}</p><span className="text-xs text-slate-400">{index + 1}</span></div><h2 className="mt-2 text-xl font-semibold">{question.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{question.prompt}</p><div className="mt-4 space-y-2">{question.options.map((option) => { const correct = choice && option === question.correct; const wrong = choice === option && option !== question.correct; return <button key={option} onClick={() => setChoice(option)} className={`flex w-full items-center justify-between rounded-xl border px-4 py-2.5 text-left text-sm ${correct ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : wrong ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-[#0f2744]/10 hover:border-[#1565c8]/40 dark:bg-white/5'}`}><span>{option}</span>{correct ? <Check size={16} /> : wrong ? <XCircle size={16} /> : null}</button> })}</div><button onClick={() => setOpen(!open)} className="mt-4 text-sm font-semibold text-[#1565c8]">{open ? 'Hide Answer' : 'View Answer'}</button>{open && <div className="mt-3 rounded-xl bg-[#f4f7fb] p-4 text-sm dark:bg-white/5"><p className="font-semibold text-emerald-700">{question.correct}</p><p className="mt-1 text-slate-600 dark:text-slate-300">{question.explanation}</p></div>}</article> }
function ScholarshipList() { const { data } = useRemote<Scholarship[]>('/scholarships', []); if (!data.length) return null; return <section className="mt-14"><p className="eyebrow">Open opportunities</p><h2 className="section-title">Scholarship notices</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{data.map((item) => <article key={item.id} className="sg-card p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#1565c8]">{item.kind}</p><h3 className="mt-2 text-xl font-semibold">{item.title}</h3><p className="mt-1 text-sm text-slate-500">{item.provider}</p>{item.amount && <p className="display mt-3 text-2xl text-[#1565c8]">₦{item.amount.toLocaleString()}</p>}<p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.eligibility}</p></article>)}</div></section> }

function GpaPage() {
  const { settings } = useSettings(); const [courses, setCourses] = useState([{ name: '', units: 3, grade: 5 }, { name: '', units: 3, grade: 4 }]); const totalUnits = courses.reduce((sum, row) => sum + Number(row.units), 0); const points = courses.reduce((sum, row) => sum + Number(row.units) * Number(row.grade), 0); const gpa = totalUnits ? points / totalUnits : 0
  return <main className="page-wrap"><PageHero kicker="5.0 scale" title="GPA Calculator" text="Add each course, credit unit and grade point. Your semester GPA updates instantly." image={settings.img_graduation} /><div className="grid gap-6 lg:grid-cols-[1fr_320px]"><div className="sg-card overflow-hidden"><div className="grid grid-cols-[1fr_90px_110px_40px] gap-2 border-b border-[#0f2744]/10 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500 dark:bg-white/5"><span>Course</span><span>Units</span><span>Grade</span><span /></div>{courses.map((row, index) => <div key={index} className="grid grid-cols-[1fr_90px_110px_40px] gap-2 border-b border-[#0f2744]/8 p-3"><input className="field" placeholder="e.g. COS 101" value={row.name} onChange={(e) => setCourses(courses.map((item, i) => i === index ? { ...item, name: e.target.value } : item))} /><input className="field" type="number" min="1" max="9" value={row.units} onChange={(e) => setCourses(courses.map((item, i) => i === index ? { ...item, units: Number(e.target.value) } : item))} /><select className="field" value={row.grade} onChange={(e) => setCourses(courses.map((item, i) => i === index ? { ...item, grade: Number(e.target.value) } : item))}><option value={5}>A · 5</option><option value={4}>B · 4</option><option value={3}>C · 3</option><option value={2}>D · 2</option><option value={1}>E · 1</option><option value={0}>F · 0</option></select><button onClick={() => setCourses(courses.filter((_, i) => i !== index))} aria-label="Remove course" className="grid place-items-center text-rose-500"><X size={17} /></button></div>)}<button onClick={() => setCourses([...courses, { name: '', units: 3, grade: 5 }])} className="m-4 rounded-xl border border-[#1565c8]/30 px-4 py-2 text-sm font-semibold text-[#1565c8]">+ Add course</button></div><aside className="h-fit rounded-3xl bg-[#0f2744] p-7 text-center text-white"><p className="text-xs uppercase tracking-widest text-[#e8c547]">Semester GPA</p><p className="display mt-2 text-6xl">{gpa.toFixed(2)}</p><p className="mt-3 text-sm text-white/60">{totalUnits} credit units · {points} quality points</p><p className="mt-6 rounded-xl bg-white/10 p-3 text-xs leading-5 text-white/70">This calculator uses the common 5.0 scale. Confirm your programme’s grading policy.</p></aside></div></main>
}

function HousingPage() { const { settings } = useSettings(); const { data, loading } = useRemote<Housing[]>('/housing', []); return <main className="page-wrap"><PageHero kicker="Stay" title="Student Housing" text="Campus hostels and off-campus lodges. Inspect before you pay." image={settings.img_housing} />{loading ? <LoadingCards /> : data.length ? <div className="grid gap-5 md:grid-cols-2">{data.map((item) => <article key={item.id} className="sg-card overflow-hidden sm:flex"><img src={item.cover_url || settings.img_hostel} alt="" className="h-52 w-full object-cover sm:h-auto sm:w-44" /><div className="p-5"><p className="eyebrow">{item.location}</p><h2 className="mt-1 text-xl font-semibold">{item.title}</h2><p className="display mt-2 text-2xl text-[#1565c8]">₦{item.price.toLocaleString()}</p><p className="mt-2 text-sm text-slate-500">{item.rooms} room{item.rooms === 1 ? '' : 's'} · {item.city}</p><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.description}</p><a href={`tel:${item.contact.replace(/\s/g, '')}`} className="mt-4 inline-block text-sm font-semibold text-[#1565c8]">Call {item.contact}</a></div></article>)}</div> : <Empty title="No housing listings yet" text="Check back for verified student listings." />}</main> }
function OutlinesPage() { const { settings } = useSettings(); const { data, loading } = useRemote<Outline[]>('/outlines', []); const [open, setOpen] = useState<number | null>(null); return <main className="page-wrap"><PageHero kicker="What to expect" title="Course Outlines" text="Browse weekly topics and learning objectives before lectures begin." image={settings.img_materials} />{loading ? <LoadingCards /> : <div className="grid gap-4 md:grid-cols-2">{data.map((item) => <article key={item.id} className="sg-card p-5"><div className="flex justify-between"><span className="eyebrow">{item.course_code}</span><span className="text-xs text-slate-400">{item.units} units</span></div><h2 className="mt-2 text-xl font-semibold">{item.course_name}</h2><p className="mt-1 text-sm text-slate-500">{item.university} · {item.department} · {item.level}L</p><button onClick={() => setOpen(open === item.id ? null : item.id)} className="mt-4 text-sm font-semibold text-[#1565c8]">{open === item.id ? 'Hide outline' : 'View outline'}</button>{open === item.id && <div className="mt-4 border-t border-[#0f2744]/10 pt-4"><p className="whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{item.body}</p><h3 className="mt-4 font-semibold">Learning objectives</h3><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">{item.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>}</article>)}</div>}</main> }

function AboutPage() { const { settings } = useSettings(); return <main className="mx-auto max-w-4xl px-4 py-12"><div className="flex items-center gap-4"><Logo className="h-16 w-16" /><div><p className="eyebrow">About</p><p className="font-semibold text-slate-500">Ebonyi State University Students guide</p></div></div><h1 className="display mt-3 text-5xl">Studentsguide is the public companion for EBSU life.</h1><p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-300">Studentsguide is open — no student login. See study materials, set your own CBT time, and tap any guide item to answer a question. Use View Answer if you do not know. Campus Map, Academic Calendar, Support Services, Campus Software, Education Help, Scholarships, Library, Counselling, IT Support and Recreation are all here.</p><p className="mt-4 leading-8">This is an independent education resource. We are not the official EBSU website and we are not affiliated with JAMB or NELFUND. Always confirm dates, lists and payment details with the relevant office.</p><img src={settings.img_campus_walk} alt="Students on campus" className="mt-10 rounded-[32px]" /></main> }
function ContactPage() { const [form, setForm] = useState({ name: '', email: '', subject: 'General', message: '' }); const [status, setStatus] = useState(''); const [sending, setSending] = useState(false); async function submit(event: FormEvent) { event.preventDefault(); if (!form.name || !form.email || !form.message) { setStatus('Name, email and message are required'); return } setSending(true); try { await api('/contact', { method: 'POST', body: JSON.stringify(form) }); setStatus(`Received. You can also WhatsApp ${whatsAppNumber}.`); setForm({ name: '', email: '', subject: 'General', message: '' }) } catch { setStatus('Your note is ready. Please also send it through WhatsApp.') } finally { setSending(false) } } return <main className="mx-auto grid max-w-5xl gap-10 px-4 py-12 md:grid-cols-2"><div><p className="eyebrow">Contact</p><h1 className="display mt-2 text-5xl">Send a note to Studentsguide.</h1><p className="mt-5 leading-relaxed text-slate-500">Corrections, campus correspondents and EBSU resource updates — we read every note.</p><div className="mt-8 space-y-3 text-sm"><p>Ebonyi State University · Abakaliki</p><p>WhatsApp: <a href={whatsAppLink} className="font-semibold text-[#128c7e] underline">{whatsAppNumber}</a></p></div><div className="mt-6"><p className="mb-2 text-sm font-semibold">Channel and group</p><WhatsAppLinks /></div></div><form onSubmit={submit} className="sg-card space-y-3 p-6"><input className="field" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /><input type="email" className="field" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /><select className="field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option>General</option><option>Correction</option><option>Materials</option><option>Campus correspondent</option></select><textarea className="field min-h-40 py-3" placeholder="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />{status && <p className="text-sm text-[#1565c8]">{status}</p>}<button disabled={sending} className="w-full rounded-xl bg-black py-3 font-semibold text-white">{sending ? 'Sending…' : 'Send message'}</button></form></main> }

function SearchPage() { const location = useLocation(); const query = new URLSearchParams(location.search).get('q') || ''; const [materials, setMaterials] = useState<Material[]>([]); const [articles, setArticles] = useState<Article[]>([]); const [past, setPast] = useState<PastQuestion[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { Promise.all([api<Material[]>('/materials'), api<Article[]>('/articles'), api<PastQuestion[]>('/past-questions')]).then(([m, a, p]) => { const term = query.toLowerCase(); setMaterials(m.filter((item) => `${item.course_code} ${item.title} ${item.content}`.toLowerCase().includes(term))); setArticles(a.filter((item) => `${item.title} ${item.excerpt} ${item.body}`.toLowerCase().includes(term))); setPast(p.filter((item) => `${item.course_code} ${item.title}`.toLowerCase().includes(term))) }).catch(() => undefined).finally(() => setLoading(false)) }, [query]); return <main className="page-wrap"><div className="max-w-2xl"><p className="eyebrow">Search Studentsguide</p><h1 className="display mt-2 text-5xl">Results for “{query}”</h1><div className="mt-6"><SearchBar initial={query} /></div></div>{loading ? <div className="mt-10"><LoadingCards /></div> : <div className="mt-10 space-y-10">{materials.length > 0 && <ResultSection title="Materials" items={materials.map((item) => ({ to: `/materials/${item.id}`, title: `${item.course_code} · ${item.title}`, text: `${item.university} · ${item.type}` }))} />}{past.length > 0 && <ResultSection title="Past questions" items={past.map((item) => ({ to: `/past-questions/${item.id}`, title: item.title, text: `${item.course_code} · ${item.year}` }))} />}{articles.length > 0 && <ResultSection title="Updates" items={articles.map((item) => ({ to: `/updates/${item.slug}`, title: item.title, text: item.category }))} />}{!materials.length && !past.length && !articles.length && <Empty title="No matching results" text="Try a course code such as GST 101, or search for campus map." />}</div>}</main> }
function ResultSection({ title, items }: { title: string; items: { to: string; title: string; text: string }[] }) { return <section><h2 className="display text-3xl">{title}</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{items.map((item) => <Link key={item.to} to={item.to} className="sg-card p-4"><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm text-slate-500">{item.text}</p></Link>)}</div></section> }

function Assistant() { const [open, setOpen] = useState(false); const [input, setInput] = useState(''); const [busy, setBusy] = useState(false); const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi — I am the Studentsguide assistant. Ask me about CBT, past questions, GPA, NELFUND, JAMB, hostels or the campus map.' }]); const scrollRef = useRef<HTMLDivElement>(null); useEffect(() => { if (open && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight }, [messages, open]); async function ask(text: string) { if (!text.trim() || busy) return; setInput(''); setMessages((current) => [...current, { role: 'user', text }]); setBusy(true); try { const result = await api<{ answer: string }>('/assistant', { method: 'POST', body: JSON.stringify({ message: text }) }); setMessages((current) => [...current, { role: 'bot', text: result.answer }]) } catch { setMessages((current) => [...current, { role: 'bot', text: 'I can help you find pages: use Materials for notes, CBT for timed practice, GPA for calculations, and Campus Map for landmarks.' }]) } finally { setBusy(false) } } return <><button onClick={() => setOpen(!open)} className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-[#1565c8] text-white shadow-2xl transition hover:scale-105" aria-label="Studentsguide AI">{open ? <X /> : <Bot />}</button>{open && <div className="fixed bottom-24 right-5 z-50 flex h-[min(72vh,560px)] w-[min(92vw,400px)] flex-col overflow-hidden rounded-3xl border border-[#0f2744]/10 bg-white shadow-2xl dark:bg-[#0b1a2e]"><div className="bg-[#0f2744] px-4 py-3 text-white"><p className="display text-lg">Studentsguide AI</p><p className="text-xs text-white/60">Ask about this site · not official school advice</p></div><div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">{messages.map((message, index) => <div key={index} className={`max-w-[92%] rounded-2xl px-3 py-2 ${message.role === 'user' ? 'ml-auto bg-[#1565c8] text-white' : 'bg-[#f4f7fb] dark:bg-white/10'}`}>{message.text}</div>)}{busy && <p className="px-2 text-xs text-slate-400">Thinking…</p>}</div><form onSubmit={(e) => { e.preventDefault(); void ask(input) }} className="flex gap-2 border-t border-[#0f2744]/10 p-3"><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything…" className="h-10 min-w-0 flex-1 rounded-xl border border-[#0f2744]/10 bg-transparent px-3 text-sm outline-none" /><button className="grid h-10 w-10 place-items-center rounded-xl bg-[#1565c8] text-white"><Send size={16} /></button></form></div>}</> }

function openStaffGate() {
  window.dispatchEvent(new Event('sg-open-gate'))
}

function SecretGate() {
  const [open, setOpen] = useState(false)
  const [phrase, setPhrase] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)
  useEffect(() => {
    function showGate() { setOpen(true); setError('') }
    function shortcut(event: KeyboardEvent) {
      if (event.altKey && event.shiftKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        showGate()
      }
    }
    window.addEventListener('sg-open-gate', showGate)
    window.addEventListener('keydown', shortcut)
    return () => {
      window.removeEventListener('sg-open-gate', showGate)
      window.removeEventListener('keydown', shortcut)
    }
  }, [])
  async function enter(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (!phrase.trim()) { setError('Enter the staff key'); return }
    setChecking(true)
    try {
      await api<{ ok?: boolean }>('/staff-gate', { method: 'POST', body: JSON.stringify({ phrase }) })
      setOpen(false)
      setPhrase('')
      window.location.assign('https://studentguide-g5qp.arcada.app/admin/login')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'That key does not open the staff room')
    } finally {
      setChecking(false)
    }
  }
  if (!open) return null
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#0f2744]/70 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
    <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-[#0f2744] shadow-2xl dark:bg-[#0b1a2e] dark:text-[#fffdf8]" onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-xl p-2 hover:bg-black/5 dark:hover:bg-white/10" aria-label="Close"><X size={16} /></button>
      <div className="flex justify-center"><Logo className="h-12 w-12" /></div>
      <p className="mt-3 text-center text-[11px] font-semibold uppercase tracking-[.2em] text-[#d4a017]">Staff room</p>
      <h2 className="display mt-1 text-center text-2xl">Quiet entrance</h2>
      <p className="mt-2 text-center text-sm text-slate-500">This door is not on the public menu. Enter the staff key to reach the original admin desk.</p>
      <form onSubmit={enter} className="mt-5 space-y-3">
        <input className="field" type="password" autoFocus placeholder="Staff key" value={phrase} onChange={(event) => setPhrase(event.target.value)} />
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        <button disabled={checking} className="h-11 w-full rounded-xl bg-[#0f2744] font-semibold text-[#fffdf8] disabled:opacity-60">{checking ? 'Checking…' : 'Enter'}</button>
      </form>
    </div>
  </div>
}

function DeskPage() {
  const [taps, setTaps] = useState(0)
  const { data: materials, connected: materialsConnected } = useLiveMaterials()
  const { data: papers, connected: papersConnected } = useLivePastQuestions()
  const pastQuestionCount = papers.reduce((sum, paper) => sum + Number(paper.question_count || 0), 0)
  function tapDesk() {
    const next = taps + 1
    if (next >= 3) {
      setTaps(0)
      openStaffGate()
    } else {
      setTaps(next)
    }
  }
  return <main className="mx-auto max-w-xl px-4 py-16 text-center">
    <div className="flex justify-center"><Logo className="h-20 w-20" /></div>
    <button type="button" onClick={tapDesk} className="mt-6"><h1 className="display text-3xl">A quiet corner of campus</h1></button>
    <p className="mt-3 leading-7 text-slate-500">This private desk keeps your editing connection with the original Studentsguide website.</p>
    <section className="sg-card mt-8 p-5 text-left">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#d4a017]">Original website</p><h2 className="mt-1 text-lg font-semibold">Admin editing connection</h2></div>
        <span className={`h-3 w-3 rounded-full ${(materialsConnected && papersConnected) ? 'animate-pulse bg-emerald-500' : 'bg-amber-400'}`} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">The public library is reading directly from the original admin database. Changes made there continue to appear here automatically.</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-emerald-50 p-3 text-center dark:bg-emerald-400/10"><p className="display text-2xl text-emerald-700 dark:text-emerald-300">{materials.length}</p><p className="text-[11px] font-semibold text-emerald-800/60 dark:text-emerald-200/60">Materials connected</p></div>
        <div className="rounded-2xl bg-sky-50 p-3 text-center dark:bg-sky-400/10"><p className="display text-2xl text-sky-700 dark:text-sky-300">{pastQuestionCount}</p><p className="text-[11px] font-semibold text-sky-800/60 dark:text-sky-200/60">Past questions connected</p></div>
      </div>
      <button type="button" onClick={openStaffGate} className="mt-5 w-full rounded-xl bg-[#0f2744] px-5 py-3 font-semibold text-white">Continue editing original website</button>
    </section>
    <Link to="/" className="mt-8 inline-block text-sm font-semibold text-[#1565c8]">← Studentsguide home</Link>
  </main>
}

function NotFound() { return <main className="page-wrap text-center"><p className="eyebrow">404</p><h1 className="display mt-2 text-5xl">That page moved.</h1><p className="mt-4 text-slate-500">Use the campus guide to get back on track.</p><Link to="/" className="mt-6 inline-flex rounded-xl bg-[#1565c8] px-5 py-3 font-semibold text-white">Studentsguide home</Link></main> }
function ScrollToTop() { const location = useLocation(); useEffect(() => { window.scrollTo(0, 0) }, [location.pathname]); return null }

function Layout() { return <div className="flex min-h-screen flex-col bg-[#f7f9fc] text-[#0f2744] transition-colors dark:bg-[#071320] dark:text-[#fffdf8]"><ScrollToTop /><Navbar /><main className="flex-1"><Routes>
  <Route path="/" element={<HomePage />} /><Route path="/materials" element={<MaterialsPage />} /><Route path="/materials/:id" element={<MaterialDetailPage />} />
  <Route path="/past-questions" element={<PastQuestionsPage />} /><Route path="/past-questions/:id" element={<PastDetailPage />} />
  <Route path="/cbt" element={<CbtPage />} /><Route path="/cbt/:id" element={<CbtTakePage />} />
  <Route path="/updates" element={<UpdatesPage />} /><Route path="/updates/:slug" element={<ArticlePage />} />
  <Route path="/map" element={<GuidePage kind="map" />} /><Route path="/calendar" element={<GuidePage kind="calendar" />} /><Route path="/support" element={<GuidePage kind="support" />} /><Route path="/software" element={<GuidePage kind="software" />} /><Route path="/help" element={<GuidePage kind="help" />} /><Route path="/scholarships" element={<GuidePage kind="scholarships" />} /><Route path="/library" element={<GuidePage kind="library" />} /><Route path="/counselling" element={<GuidePage kind="counselling" />} /><Route path="/it-support" element={<GuidePage kind="it-support" />} /><Route path="/recreation" element={<GuidePage kind="recreation" />} /><Route path="/admission" element={<GuidePage kind="admission" />} /><Route path="/tips" element={<GuidePage kind="tips" />} />
  <Route path="/gpa" element={<GpaPage />} /><Route path="/housing" element={<HousingPage />} /><Route path="/outlines" element={<OutlinesPage />} /><Route path="/about" element={<AboutPage />} /><Route path="/contact" element={<ContactPage />} /><Route path="/search" element={<SearchPage />} /><Route path="/desk" element={<DeskPage />} /><Route path="*" element={<NotFound />} />
</Routes></main><Footer /><Assistant /><SecretGate /></div> }

export default function StudentGuide() { return <SettingsProvider><BrowserRouter><Layout /></BrowserRouter></SettingsProvider> }
