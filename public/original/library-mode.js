function makeLibraryMaterialBased() {
  document.querySelectorAll('a[href="/library"]').forEach((link) => {
    link.href = '/materials'
    link.dataset.materialLibrary = 'true'
    link.title = 'Browse study materials by university, faculty, department and level'
    link.querySelectorAll('*').forEach((child) => {
      if ((child.textContent || '').trim() === 'Interactive guide questions') child.textContent = 'Browse organized study materials'
    })
  })
  if (location.pathname === '/library') {
    history.replaceState({}, '', '/materials')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

const observer = new MutationObserver(makeLibraryMaterialBased)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', makeLibraryMaterialBased)
window.setTimeout(makeLibraryMaterialBased, 250)
