function removeRecreationCenter() {
  document.querySelectorAll('a[href="/recreation"], a[href$="/recreation"]').forEach((link) => {
    const removable = link.closest('li') || link
    removable.remove()
  })
  document.querySelectorAll('option').forEach((option) => {
    if (option.value === 'recreation' || /recreation center/i.test(option.textContent || '')) option.remove()
  })
  document.querySelectorAll('label').forEach((label) => {
    if (/^recreation\b/i.test((label.textContent || '').trim())) label.remove()
  })
  if (location.pathname === '/recreation') {
    history.replaceState({}, '', '/')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}

const observer = new MutationObserver(removeRecreationCenter)
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('popstate', removeRecreationCenter)
window.setTimeout(removeRecreationCenter, 300)
