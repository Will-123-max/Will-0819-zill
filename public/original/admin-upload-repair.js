const ADMIN_API = 'https://studentguide-g5qp.arcada.app/api'
const UPLOAD_DB = 'studentsguide-pending-upload'

function uploadDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(UPLOAD_DB, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('pending')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function savePendingFiles(files) {
  try {
    const database = await uploadDatabase()
    const transaction = database.transaction('pending', 'readwrite')
    transaction.objectStore('pending').put(files, 'files')
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve
      transaction.onerror = () => reject(transaction.error)
    })
  } catch {}
}

async function loadPendingFiles() {
  try {
    const database = await uploadDatabase()
    return await new Promise((resolve) => {
      const request = database.transaction('pending').objectStore('pending').get('files')
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : [])
      request.onerror = () => resolve([])
    })
  } catch { return [] }
}

async function clearPendingFiles() {
  try {
    const database = await uploadDatabase()
    const transaction = database.transaction('pending', 'readwrite')
    transaction.objectStore('pending').delete('files')
    await new Promise((resolve) => { transaction.oncomplete = resolve; transaction.onerror = resolve })
  } catch {}
}

function authToken() {
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

function humanSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileStatus(input) {
  let status = input.parentElement?.querySelector(':scope > .sg-file-status')
  if (!status) {
    status = document.createElement('span')
    status.className = 'sg-file-status'
    input.insertAdjacentElement('afterend', status)
  }
  return status
}

function repairFileInputs() {
  document.querySelectorAll('input[type="file"]').forEach((input) => {
    if (input.closest('.sg-reliable-uploader')) return
    const materialForm = input.closest('form[data-source-loc="src/pages/Admin.jsx:482:6"]')
    const pastQuestionForm = input.closest('form[data-source-loc="src/pages/Admin.jsx:907:6"]')
    const relevantUpload = Boolean(materialForm || pastQuestionForm)
    if (relevantUpload && !input.dataset.uploadLauncher) {
      input.dataset.uploadLauncher = 'true'
      input.classList.add('sg-native-file-input')
      if (!input.id) input.id = `sg-upload-${Math.random().toString(36).slice(2)}`
      const launcher = document.createElement('label')
      launcher.htmlFor = input.id
      launcher.className = 'sg-upload-launcher'
      launcher.textContent = input.multiple ? 'Choose or snap page pictures' : 'Choose picture or PDF'
      launcher.addEventListener('click', (event) => {
        if (input.disabled) {
          event.preventDefault()
          const status = fileStatus(input)
          status.textContent = 'Please wait for the current upload to finish, then try again.'
        }
      })
      input.insertAdjacentElement('beforebegin', launcher)
      const hint = document.createElement('span')
      hint.className = 'sg-native-file-hint'
      hint.textContent = 'If the button does not open your phone files, use the native chooser directly below.'
      launcher.insertAdjacentElement('afterend', hint)
    }
    if (input.dataset.uploadReady === 'true') return
    input.dataset.uploadReady = 'true'
    input.addEventListener('change', () => {
      const files = [...(input.files || [])]
      const status = fileStatus(input)
      if (!files.length) { status.textContent = ''; return }
      const total = files.reduce((sum, file) => sum + file.size, 0)
      const tooLarge = files.some((file) => file.size > 20 * 1024 * 1024)
      status.textContent = tooLarge
        ? 'One of these files is over 20 MB. Choose a smaller picture or PDF.'
        : `${files.length} file${files.length === 1 ? '' : 's'} selected · ${humanSize(total)} · preparing upload…`
      status.classList.toggle('is-error', tooLarge)
      const launcher = input.parentElement?.querySelector(`label[for="${input.id}"]`)
      if (launcher && files.length) {
        launcher.textContent = files.length === 1 ? `Selected: ${files[0].name}` : `${files.length} page pictures selected`
      }
    })
    input.addEventListener('click', () => {
      if (input.disabled) {
        const status = fileStatus(input)
        status.textContent = 'Please wait for the current upload to finish, then try again.'
      }
    })
    const form = materialForm || pastQuestionForm
    if (form && form.dataset.uploadSubmitGuard !== 'true') {
      form.dataset.uploadSubmitGuard = 'true'
      form.addEventListener('submit', (event) => {
        if (!event.submitter) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      }, true)
    }
  })

  document.querySelectorAll('button[data-source-loc="src/pages/Admin.jsx:133:10"]').forEach((button) => {
    button.type = 'button'
  })
}

async function showUploadHealth() {
  if (location.pathname !== '/admin') return
  const admin = document.querySelector('[data-source-loc="src/pages/Admin.jsx:112:4"]')
  if (!admin || admin.querySelector('.sg-upload-health')) return
  const badge = document.createElement('div')
  badge.className = 'sg-upload-health'
  badge.innerHTML = '<strong>Checking admin and upload services…</strong><span>Pictures and PDFs use signed upload with an automatic backup.</span>'
  const content = admin.querySelector('[data-source-loc="src/pages/Admin.jsx:129:6"]')
  content?.prepend(badge)
  const token = authToken()
  if (!token) {
    badge.classList.add('is-error')
    badge.querySelector('strong').textContent = 'Admin session needs to be refreshed'
    badge.querySelector('span').textContent = 'Sign out and sign in again before uploading pictures or PDFs.'
    return
  }
  try {
    const [adminResponse, uploadOptions] = await Promise.all([
      fetch(`${ADMIN_API}/admin`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${ADMIN_API}/upload-url`, { method: 'OPTIONS' }),
    ])
    if (!adminResponse.ok || !uploadOptions.ok) throw new Error('Upload service is not ready')
    badge.classList.add('is-ready')
    badge.querySelector('strong').textContent = 'Admin connected · uploads ready'
    badge.querySelector('span').textContent = 'Pictures and PDFs up to 20 MB can be selected. A backup upload is used automatically if signed upload fails.'
  } catch (error) {
    badge.classList.add('is-error')
    badge.querySelector('strong').textContent = 'Upload connection needs attention'
    badge.querySelector('span').textContent = error.message || 'Sign in again and retry.'
  }
}

function compressPhoneImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) { resolve(file); return }
    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, 1600 / Math.max(image.width, image.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.width * scale))
      canvas.height = Math.max(1, Math.round(image.height * scale))
      const context = canvas.getContext('2d')
      context.fillStyle = '#fff'
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      try {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const pixels = imageData.data
        for (let index = 0; index < pixels.length; index += 4) {
          const red = pixels[index]
          const green = pixels[index + 1]
          const blue = pixels[index + 2]
          const gray = .2126 * red + .7152 * green + .0722 * blue
          const clear = gray > 176 ? 255 - (255 - gray) * .5 : gray * .8
          pixels[index] = Math.max(0, Math.min(255, clear * .82 + red * .18))
          pixels[index + 1] = Math.max(0, Math.min(255, clear * .82 + green * .18))
          pixels[index + 2] = Math.max(0, Math.min(255, clear * .82 + blue * .18))
        }
        context.putImageData(imageData, 0, 0)
      } catch {}
      canvas.toBlob((blob) => resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', .84)
    }
    image.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    image.src = url
  })
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function backupUpload(file, token) {
  if (file.size > 3 * 1024 * 1024) throw new Error('Backup upload supports files up to 3 MB.')
  const response = await fetch(`${ADMIN_API}/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fileName: file.name, fileBase64: await fileBase64(file), contentType: file.type || 'application/octet-stream' }),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Backup upload failed')
  return result.url
}

async function reliableUpload(file, token) {
  const prepared = await compressPhoneImage(file)
  try {
    const start = await fetch(`${ADMIN_API}/upload-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fileName: prepared.name, contentType: prepared.type || 'application/octet-stream' }),
    })
    const signed = await start.json().catch(() => ({}))
    if (!start.ok) throw new Error(signed.error || 'Could not start signed upload')
    const path = String(signed.path || '').split('/').map(encodeURIComponent).join('/')
    const endpoint = `https://vqhmamofuupnefevkuxk.supabase.co/storage/v1/object/upload/sign/sg-profile/${path}?token=${encodeURIComponent(signed.token)}`
    const uploadBody = new FormData()
    uploadBody.append('cacheControl', '3600')
    uploadBody.append('', prepared)
    let upload = await fetch(endpoint, { method: 'PUT', headers: { 'x-upsert': 'true' }, body: uploadBody })
    if (!upload.ok) upload = await fetch(endpoint, { method: 'POST', headers: { 'x-upsert': 'true' }, body: uploadBody })
    if (!upload.ok) throw new Error('Signed storage upload failed')
    return { url: signed.publicUrl, file: prepared }
  } catch (signedError) {
    return { url: await backupUpload(prepared, token), file: prepared, usedBackup: true, signedError }
  }
}

function addReliableMaterialUploader() {
  const form = document.querySelector('form[data-source-loc="src/pages/Admin.jsx:482:6"]')
  if (!form || form.dataset.reliableUploaderReady === 'true') return
  form.dataset.reliableUploaderReady = 'true'
  form.classList.add('sg-use-reliable-uploader')
  const existingModal = document.querySelector('.sg-reliable-upload-modal')
  if (existingModal) {
    const reopen = document.createElement('button')
    reopen.type = 'button'
    reopen.className = 'sg-open-reliable-uploader'
    reopen.textContent = 'Open picture / PDF uploader'
    reopen.addEventListener('click', () => existingModal.classList.add('is-open'))
    form.prepend(reopen)
    return
  }
  const openUploader = document.createElement('button')
  openUploader.type = 'button'
  openUploader.className = 'sg-open-reliable-uploader'
  openUploader.textContent = 'Open picture / PDF uploader'
  form.prepend(openUploader)
  const modal = document.createElement('div')
  modal.className = 'sg-reliable-upload-modal'
  const panel = document.createElement('section')
  panel.className = 'sg-reliable-uploader'
  panel.innerHTML = '<div class="sg-reliable-uploader__intro"><strong>Upload library content</strong><span>Choose Notes, PDF, Assignment, or Past Question Material, then organize it for students. AI clarity improves selected pictures during upload.</span></div>'
  const close = document.createElement('button')
  close.type = 'button'
  close.className = 'sg-reliable-uploader__close'
  close.textContent = 'Close'
  panel.prepend(close)
  openUploader.addEventListener('click', () => { modal.classList.add('is-open'); loadEditableItems() })
  close.addEventListener('click', () => modal.classList.remove('is-open'))
  modal.addEventListener('click', (event) => { if (event.target === modal) modal.classList.remove('is-open') })
  const type = document.createElement('select')
  const title = document.createElement('input')
  const course = document.createElement('input')
  const university = document.createElement('select')
  const faculty = document.createElement('select')
  const department = document.createElement('select')
  const level = document.createElement('select')
  const content = document.createElement('textarea')
  const files = document.createElement('input')
  const preview = document.createElement('div')
  const existingPreview = document.createElement('div')
  const editSelect = document.createElement('select')
  const editHelp = document.createElement('p')
  const refreshItems = document.createElement('button')
  const publish = document.createElement('button')
  const message = document.createElement('p')
  type.className = title.className = course.className = university.className = faculty.className = department.className = level.className = content.className = editSelect.className = 'field'
  editSelect.appendChild(new Option('Create a new item', ''))
  editHelp.className = 'sg-reliable-uploader__file-help'
  editHelp.textContent = 'Create a new item or choose any published item below to re-edit it.'
  refreshItems.type = 'button'
  refreshItems.className = 'sg-refresh-editable-items'
  refreshItems.textContent = 'Refresh uploaded items'
  ;['Notes', 'PDF', 'Assignment', 'Past Question Material'].forEach((value) => type.appendChild(new Option(value, value)))
  ;['All universities', 'EBSU', 'UNN', 'UNILAG', 'UI', 'OAU', 'ABU', 'UNIBEN', 'FUTO', 'LASU', 'UNICAL'].forEach((value) => university.appendChild(new Option(value, value)))
  ;['All faculties', 'Science', 'Engineering', 'Arts', 'Social Sciences', 'Management Sciences', 'Education', 'Law', 'Medicine', 'Agriculture'].forEach((value) => faculty.appendChild(new Option(value, value)))
  ;['All departments', 'General Studies', 'Computer Science', 'Chemistry', 'Physics', 'Mathematics', 'Economics', 'Accounting', 'English', 'Law', 'Medicine'].forEach((value) => department.appendChild(new Option(value, value)))
  ;['All levels', '100', '200', '300', '400', '500'].forEach((value) => level.appendChild(new Option(value, value)))
  title.placeholder = 'Title'
  course.placeholder = 'Course code'
  content.placeholder = 'Written text or instructions (optional when files are selected)'
  content.classList.add('sg-reliable-uploader__text')
  files.type = 'file'
  files.accept = 'image/*,application/pdf'
  files.multiple = true
  files.className = 'sg-reliable-uploader__files'
  const fileHelp = document.createElement('p')
  fileHelp.className = 'sg-reliable-uploader__file-help'
  fileHelp.textContent = 'Choose one or many files. You can add more, remove a wrong picture, and reorder pages before publishing.'
  preview.className = 'sg-reliable-uploader__preview'
  existingPreview.className = 'sg-reliable-uploader__preview sg-existing-upload-preview'
  let previewUrls = []
  let recoveredFiles = []
  let editableItems = []
  let editingItem = null
  let existingPages = []
  let existingFileUrl = ''
  let existingCoverUrl = ''
  let coverRemoved = false
  function clearPreview() {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    previewUrls = []
    preview.replaceChildren()
  }
  function syncFileInput() {
    try {
      const transfer = new DataTransfer()
      recoveredFiles.forEach((file) => transfer.items.add(file))
      files.files = transfer.files
    } catch {}
  }
  function saveAndRender(restored = false) {
    syncFileInput()
    renderSelectedFiles(recoveredFiles, restored)
    savePendingFiles(recoveredFiles)
  }
  function renderSelectedFiles(selected, restored = false) {
    clearPreview()
    selected.forEach((file, index) => {
      const item = document.createElement('div')
      item.className = 'sg-selected-file'
      const page = document.createElement('em')
      page.textContent = file.type.startsWith('image/') ? `Page ${index + 1}` : 'PDF'
      item.appendChild(page)
      if (file.type.startsWith('image/')) {
        const image = document.createElement('img')
        const url = URL.createObjectURL(file)
        previewUrls.push(url)
        image.src = url
        image.alt = ''
        item.appendChild(image)
      } else {
        const icon = document.createElement('strong')
        icon.textContent = 'PDF'
        item.appendChild(icon)
      }
      const name = document.createElement('span')
      name.textContent = `${file.name} · ${humanSize(file.size)}`
      const controls = document.createElement('div')
      controls.className = 'sg-selected-file__controls'
      const earlier = document.createElement('button')
      earlier.type = 'button'
      earlier.textContent = '←'
      earlier.title = 'Move earlier'
      earlier.disabled = index === 0
      earlier.addEventListener('click', () => {
        ;[recoveredFiles[index - 1], recoveredFiles[index]] = [recoveredFiles[index], recoveredFiles[index - 1]]
        saveAndRender()
      })
      const later = document.createElement('button')
      later.type = 'button'
      later.textContent = '→'
      later.title = 'Move later'
      later.disabled = index === selected.length - 1
      later.addEventListener('click', () => {
        ;[recoveredFiles[index], recoveredFiles[index + 1]] = [recoveredFiles[index + 1], recoveredFiles[index]]
        saveAndRender()
      })
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Remove'
      remove.className = 'is-remove'
      remove.addEventListener('click', () => {
        recoveredFiles.splice(index, 1)
        saveAndRender()
      })
      controls.append(earlier, later, remove)
      item.append(name, controls)
      preview.appendChild(item)
    })
    message.className = 'is-success'
    message.textContent = selected.length
      ? `${selected.length} file${selected.length === 1 ? '' : 's'} ${restored ? 'restored after the page refreshed' : 'selected'} and kept ready for upload.`
      : ''
  }
  function renderExistingFiles() {
    existingPreview.replaceChildren()
    existingPages.forEach((page, index) => {
      const item = document.createElement('div')
      item.className = 'sg-selected-file'
      const pageNumber = document.createElement('em')
      pageNumber.textContent = `Existing page ${index + 1}`
      const image = document.createElement('img')
      image.src = page.url
      image.alt = ''
      const name = document.createElement('span')
      name.textContent = 'Already published picture'
      const controls = document.createElement('div')
      controls.className = 'sg-selected-file__controls'
      const earlier = document.createElement('button')
      earlier.type = 'button'
      earlier.textContent = '←'
      earlier.disabled = index === 0
      earlier.addEventListener('click', () => {
        ;[existingPages[index - 1], existingPages[index]] = [existingPages[index], existingPages[index - 1]]
        renderExistingFiles()
      })
      const later = document.createElement('button')
      later.type = 'button'
      later.textContent = '→'
      later.disabled = index === existingPages.length - 1
      later.addEventListener('click', () => {
        ;[existingPages[index], existingPages[index + 1]] = [existingPages[index + 1], existingPages[index]]
        renderExistingFiles()
      })
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Remove'
      remove.className = 'is-remove'
      remove.addEventListener('click', () => {
        if (page.url === existingCoverUrl) coverRemoved = true
        existingPages.splice(index, 1)
        renderExistingFiles()
      })
      controls.append(earlier, later, remove)
      item.append(pageNumber, image, name, controls)
      existingPreview.appendChild(item)
    })
    if (existingFileUrl && /\.pdf(\?|$)/i.test(existingFileUrl)) {
      const item = document.createElement('div')
      item.className = 'sg-selected-file'
      const label = document.createElement('em')
      label.textContent = 'Existing PDF'
      const icon = document.createElement('strong')
      icon.textContent = 'PDF'
      const remove = document.createElement('button')
      remove.type = 'button'
      remove.textContent = 'Remove PDF'
      remove.className = 'is-remove sg-remove-existing-pdf'
      remove.addEventListener('click', () => { existingFileUrl = ''; renderExistingFiles() })
      item.append(label, icon, remove)
      existingPreview.appendChild(item)
    }
  }
  async function loadEditableItems(selectedId = editSelect.value) {
    try {
      const response = await fetch(`${ADMIN_API}/materials`, { cache: 'no-store' })
      const items = response.ok ? await response.json() : []
      editableItems = (Array.isArray(items) ? items : []).sort((first, second) => String(first.title || '').localeCompare(String(second.title || ''), undefined, { sensitivity: 'base' }))
      const knownDepartments = new Set([...department.options].map((option) => option.value))
      editableItems.map((item) => String(item.department || '').trim()).filter(Boolean).sort().forEach((value) => {
        if (!knownDepartments.has(value)) { department.appendChild(new Option(value, value)); knownDepartments.add(value) }
      })
      editSelect.replaceChildren(new Option('Create a new item', ''))
      editableItems.forEach((item) => editSelect.appendChild(new Option(`${item.course_code || 'No code'} · ${item.title}`, item.id)))
      editSelect.value = selectedId || ''
    } catch {}
  }
  refreshItems.addEventListener('click', () => loadEditableItems())
  editSelect.addEventListener('change', async () => {
    editingItem = editableItems.find((item) => String(item.id) === editSelect.value) || null
    existingPages = []
    existingFileUrl = ''
    existingCoverUrl = ''
    coverRemoved = false
    if (!editingItem) {
      title.value = course.value = content.value = ''
      type.value = 'Notes'
      university.value = 'All universities'
      faculty.value = 'All faculties'
      department.value = 'All departments'
      level.value = 'All levels'
      renderExistingFiles()
      publish.textContent = 'Upload and publish without reloading'
      return
    }
    title.value = editingItem.title || ''
    course.value = editingItem.course_code || ''
    content.value = editingItem.content || ''
    type.value = [...type.options].some((option) => option.value === editingItem.type) ? editingItem.type : 'Notes'
    university.value = [...university.options].some((option) => option.value === editingItem.university) ? editingItem.university : 'All universities'
    faculty.value = [...faculty.options].some((option) => option.value === editingItem.faculty) ? editingItem.faculty : 'All faculties'
    if (editingItem.department && ![...department.options].some((option) => option.value === editingItem.department)) department.appendChild(new Option(editingItem.department, editingItem.department))
    department.value = editingItem.department || 'All departments'
    level.value = [...level.options].some((option) => option.value === String(editingItem.level)) ? String(editingItem.level) : 'All levels'
    existingFileUrl = editingItem.file_url || ''
    existingCoverUrl = editingItem.cover_url || ''
    try {
      const response = await fetch(`${ADMIN_API}/scan-pages?kind=material&item_id=${editingItem.id}`, { cache: 'no-store' })
      const pages = response.ok ? await response.json() : []
      existingPages = (Array.isArray(pages) ? pages : []).filter((page) => page?.url).sort((first, second) => Number(first.page) - Number(second.page))
    } catch {}
    if (!existingPages.length && existingFileUrl && /\.(png|jpe?g|webp)(\?|$)/i.test(existingFileUrl)) existingPages = [{ url: existingFileUrl, page: 1 }]
    if (!existingPages.length && existingCoverUrl && /\.(png|jpe?g|webp)(\?|$)/i.test(existingCoverUrl)) existingPages = [{ url: existingCoverUrl, page: 1 }]
    renderExistingFiles()
    publish.textContent = 'Save edits without reloading'
    message.className = 'is-success'
    message.textContent = 'Editing the selected published item. Existing files are shown above.'
  })
  files.addEventListener('click', () => { files.value = '' })
  files.addEventListener('change', () => {
    const added = [...(files.files || [])]
    const existing = new Set(recoveredFiles.map((file) => `${file.name}:${file.size}:${file.lastModified}`))
    added.forEach((file) => {
      const key = `${file.name}:${file.size}:${file.lastModified}`
      if (!existing.has(key)) { recoveredFiles.push(file); existing.add(key) }
    })
    saveAndRender()
  })
  const draftKey = 'sg-reliable-upload-draft'
  function saveDraft() {
    try { sessionStorage.setItem(draftKey, JSON.stringify({ type: type.value, title: title.value, course: course.value, university: university.value, faculty: faculty.value, department: department.value, level: level.value, content: content.value })) } catch {}
  }
  ;[type, title, course, university, faculty, department, level, content].forEach((field) => field.addEventListener('input', saveDraft))
  try {
    const draft = JSON.parse(sessionStorage.getItem(draftKey) || 'null')
    if (draft) {
      type.value = draft.type || 'Notes'
      title.value = draft.title || ''
      course.value = draft.course || ''
      university.value = draft.university || 'All universities'
      faculty.value = draft.faculty || 'All faculties'
      department.value = draft.department || 'All departments'
      level.value = draft.level || 'All levels'
      content.value = draft.content || ''
    }
  } catch {}
  loadPendingFiles().then((saved) => {
    if (!saved.length || files.files.length) return
    recoveredFiles = saved
    syncFileInput()
    renderSelectedFiles(saved, true)
  })
  publish.type = 'button'
  publish.textContent = 'Upload and publish without reloading'
  publish.addEventListener('click', async () => {
    message.className = ''
    message.textContent = ''
    if (!title.value.trim()) { message.textContent = 'Write a title first.'; message.className = 'is-error'; return }
    const selectedFiles = files.files.length ? [...files.files] : recoveredFiles
    const wasEditing = Boolean(editingItem)
    if (!content.value.trim() && !selectedFiles.length && !existingPages.length && !existingFileUrl) { message.textContent = 'Write text or choose at least one picture or PDF.'; message.className = 'is-error'; return }
    const token = authToken()
    if (!token) { message.textContent = 'Sign out and sign in again before uploading.'; message.className = 'is-error'; return }
    publish.disabled = true
    const chosen = selectedFiles
    try {
      const uploaded = []
      for (let index = 0; index < chosen.length; index += 1) {
        message.textContent = `Uploading file ${index + 1} of ${chosen.length}…`
        uploaded.push(await reliableUpload(chosen[index], token))
      }
      const images = uploaded.filter((item) => item.file.type.startsWith('image/'))
      const pdf = uploaded.find((item) => item.file.type === 'application/pdf')
      const selectedType = type.value === 'Notes' && pdf ? 'PDF' : type.value
      const allPages = [...existingPages.map((page) => page.url), ...images.map((item) => item.url)]
      const payload = {
        ...(editingItem ? { id: editingItem.id } : {}),
        title: title.value.trim(),
        course_code: course.value.trim(),
        course_name: editingItem?.course_name || '',
        university: university.value,
        faculty: faculty.value,
        department: department.value,
        level: level.value,
        type: selectedType,
        content: content.value.trim(),
        cover_url: allPages[0] || (!coverRemoved ? existingCoverUrl : '') || '/images/materials.jpg',
        file_url: pdf?.url || allPages[0] || existingFileUrl || '',
        featured: editingItem?.featured ?? true,
        is_premium: editingItem?.is_premium ?? false,
        downloads: editingItem?.downloads || 0,
        views: editingItem?.views || 0,
        topics: editingItem?.topics || [],
      }
      const materialResponse = await fetch(`${ADMIN_API}/materials`, {
        method: editingItem ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const material = await materialResponse.json().catch(() => ({}))
      if (!materialResponse.ok) throw new Error(material.error || 'Could not publish the item')
      const materialId = material.id || editingItem?.id
      if (materialId && (allPages.length || editingItem)) {
        await fetch(`${ADMIN_API}/scan-pages`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ kind: 'material', item_id: materialId, pages: allPages.map((url, index) => ({ url, page: index + 1 })) }) })
      }
      title.value = course.value = content.value = ''
      files.value = ''
      recoveredFiles = []
      clearPreview()
      clearPendingFiles()
      existingPages = []
      existingFileUrl = ''
      existingCoverUrl = ''
      coverRemoved = false
      editingItem = null
      editSelect.value = ''
      university.value = 'All universities'
      faculty.value = 'All faculties'
      department.value = 'All departments'
      level.value = 'All levels'
      publish.textContent = 'Upload and publish without reloading'
      loadEditableItems()
      try { sessionStorage.removeItem(draftKey) } catch {}
      message.className = 'is-success'
      message.textContent = wasEditing ? 'Changes saved successfully. The public site will update automatically.' : 'Published successfully. The public site will update automatically.'
    } catch (error) {
      message.className = 'is-error'
      message.textContent = error.message || 'Upload failed. Sign in again and retry.'
    } finally { publish.disabled = false }
  })
  window.__sgOpenReliableEditor = async ({ title: itemTitle = '', courseCode = '' } = {}) => {
    modal.classList.add('is-open')
    await loadEditableItems()
    const found = editableItems.find((item) => String(item.title || '').trim() === String(itemTitle).trim() && (!courseCode || String(item.course_code || '').trim() === String(courseCode).trim()))
      || editableItems.find((item) => String(item.title || '').trim() === String(itemTitle).trim())
    if (found) {
      editSelect.value = found.id
      editSelect.dispatchEvent(new Event('change', { bubbles: true }))
    }
  }
  panel.append(editHelp, editSelect, refreshItems, type, title, course, university, faculty, department, level, content, existingPreview, fileHelp, files, preview, publish, message)
  modal.appendChild(panel)
  document.body.appendChild(modal)
}

document.addEventListener('click', (event) => {
  const editButton = event.target instanceof Element && event.target.closest('button[data-source-loc="src/pages/Admin.jsx:519:14"]')
  if (!editButton || typeof window.__sgOpenReliableEditor !== 'function') return
  event.preventDefault()
  event.stopImmediatePropagation()
  const card = editButton.closest('[data-source-loc="src/pages/Admin.jsx:512:10"]')
  const itemTitle = card?.querySelector('[data-source-loc="src/pages/Admin.jsx:515:14"]')?.textContent || ''
  const meta = card?.querySelector('[data-source-loc="src/pages/Admin.jsx:514:14"]')?.textContent || ''
  const courseCode = meta.split('·')[0]?.trim() || ''
  window.__sgOpenReliableEditor({ title: itemTitle, courseCode })
}, true)

const style = document.createElement('style')
style.textContent = `
.sg-use-reliable-uploader>:not(.sg-open-reliable-uploader){display:none!important}.sg-open-reliable-uploader{display:flex;width:100%;min-height:52px;align-items:center;justify-content:center;border:0;border-radius:14px;background:#1565c8;color:#fff;padding:11px 15px;font:800 13px/1.2 Outfit,system-ui,sans-serif;cursor:pointer}.sg-reliable-upload-modal{position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(7,19,32,.72);padding:16px;backdrop-filter:blur(4px)}.sg-reliable-upload-modal.is-open{display:flex}.sg-reliable-uploader{position:relative;display:flex;width:min(620px,100%);max-height:92vh;overflow-y:auto;flex-direction:column;gap:8px;margin:0;border:2px solid rgba(21,101,200,.25);border-radius:20px;background:#f7fbff;padding:18px}.sg-reliable-uploader__close{align-self:flex-end!important;min-height:34px!important;background:#0f2744!important;padding:7px 12px!important}.sg-reliable-uploader__intro{display:flex;flex-direction:column;gap:2px}.sg-reliable-uploader__intro strong{font-size:13px}.sg-reliable-uploader__intro span{color:#64748b;font-size:10px;line-height:1.5}.sg-reliable-uploader__text{min-height:90px!important;padding-top:10px!important}.sg-reliable-uploader__file-help{margin:2px 0 0!important;color:#64748b;font-size:10px!important;line-height:1.5}.sg-refresh-editable-items{min-height:36px!important;border:1px solid rgba(21,101,200,.2)!important;background:#fff!important;color:#1565c8!important}.sg-reliable-uploader__files{display:block;width:100%;border:1px dashed rgba(21,101,200,.35);border-radius:11px;background:#fff;padding:10px;font-size:11px}.sg-reliable-uploader__preview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.sg-selected-file{position:relative;overflow:hidden;border:1px solid rgba(15,39,68,.1);border-radius:10px;background:#fff}.sg-selected-file>em{position:absolute;left:5px;top:5px;z-index:1;border-radius:999px;background:rgba(15,39,68,.82);color:#fff;padding:3px 6px;font-size:8px;font-style:normal;font-weight:800}.sg-selected-file img{display:block;width:100%;height:86px;object-fit:cover}.sg-selected-file>strong{display:grid;height:86px;place-items:center;background:#fff1f2;color:#be123c;font-size:20px}.sg-selected-file>span{display:block;overflow:hidden;padding:6px;color:#64748b;font-size:8px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}.sg-selected-file__controls{display:flex;gap:3px;padding:0 5px 6px}.sg-selected-file__controls button{min-height:26px;flex:1;border:1px solid rgba(15,39,68,.12);border-radius:7px;background:#f8fafc;color:#0f2744;font-size:9px;font-weight:800}.sg-selected-file__controls button.is-remove{color:#be123c}.sg-selected-file__controls button:disabled{opacity:.35}.sg-reliable-uploader>button{min-height:46px;border:0;border-radius:12px;background:#1565c8;color:#fff;font-size:12px;font-weight:800}.sg-reliable-uploader>p{margin:0;font-size:10px;font-weight:700}.sg-reliable-uploader>p.is-success{color:#047857}.sg-reliable-uploader>p.is-error{color:#be123c}.sg-native-file-input{position:static!important;display:block!important;width:100%!important;height:auto!important;margin-top:6px!important;overflow:visible!important;opacity:1!important;pointer-events:auto!important;color:#0f2744!important;font-size:11px!important}.sg-native-file-input::file-selector-button{min-height:38px;border:1px solid rgba(15,39,68,.14);border-radius:9px;background:#fff;color:#0f2744;padding:7px 11px;font-weight:700;cursor:pointer}.sg-native-file-hint{display:block;margin:5px 0 0;color:#64748b;font-size:9px;line-height:1.45}.sg-upload-launcher{display:flex;width:100%;min-height:46px;align-items:center;justify-content:center;border:1px solid rgba(21,101,200,.3);border-radius:12px;background:#eef6ff;color:#0f2744;padding:9px 12px;font:800 12px/1.3 Outfit,system-ui,sans-serif;cursor:pointer}.sg-upload-launcher:hover{border-color:#1565c8;background:#e2efff}.sg-file-status{display:block;margin-top:5px;color:#1565c8;font-size:10px;font-weight:700}.sg-file-status.is-error{color:#dc2626}.sg-upload-health{display:flex;flex-direction:column;gap:2px;margin:0 0 14px;border:1px solid rgba(245,158,11,.25);border-radius:15px;background:#fffbeb;padding:11px 13px;color:#92400e}.sg-upload-health strong{font-size:12px}.sg-upload-health span{font-size:10px;line-height:1.5}.sg-upload-health.is-ready{border-color:rgba(34,197,94,.25);background:#ecfdf5;color:#047857}.sg-upload-health.is-error{border-color:rgba(220,38,38,.2);background:#fff1f2;color:#be123c}
`
document.head.appendChild(style)

const observer = new MutationObserver(() => { repairFileInputs(); addReliableMaterialUploader(); showUploadHealth() })
observer.observe(document.documentElement, { childList: true, subtree: true })
window.addEventListener('online', showUploadHealth)
window.setTimeout(() => { repairFileInputs(); addReliableMaterialUploader(); showUploadHealth() }, 500)
