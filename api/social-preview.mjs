const ORIGIN = 'https://studentguide-g5qp.arcada.app'

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function cleanDescription(value, fallback) {
  const text = String(value || fallback || '').replace(/\s+/g, ' ').trim()
  return text.length > 200 ? `${text.slice(0, 197)}…` : text
}

function withStudentsguide(value) {
  const description = cleanDescription(value, 'Study material available on Studentsguide.')
  return /studentsguide/i.test(description) ? description : `${description} · Studentsguide`
}

function absoluteImage(value, fallback) {
  const image = value || fallback || '/images/hero-students.jpg'
  if (/^https?:\/\//i.test(image)) return image
  return `${ORIGIN}${image.startsWith('/') ? image : `/${image}`}`
}

async function getJson(path) {
  const response = await fetch(`${ORIGIN}${path}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`Upstream request failed (${response.status})`)
  return response.json()
}

async function previewData(type, id) {
  const settings = await getJson('/api/settings').catch(() => ({}))
  if (type === 'material') {
    const item = await getJson(`/api/materials?id=${encodeURIComponent(id)}`)
    const code = String(item.course_code || '').trim()
    const materialTitle = String(item.title || 'Study material').trim()
    const title = code && !materialTitle.toLocaleLowerCase().startsWith(code.toLocaleLowerCase())
      ? `${code} · ${materialTitle}`
      : materialTitle
    return {
      title,
      description: withStudentsguide(item.content || `${item.university || 'EBSU'} study material${item.level ? ` · ${item.level} Level` : ''}.`),
      image: absoluteImage(item.cover_url || (/\.(png|jpe?g|webp)(\?|$)/i.test(item.file_url || '') ? item.file_url : ''), settings.img_materials),
      type: 'article',
    }
  }
  if (type === 'past') {
    const item = await getJson(`/api/past-questions?id=${encodeURIComponent(id)}`)
    const pages = await getJson(`/api/scan-pages?kind=past&item_id=${encodeURIComponent(id)}`).catch(() => [])
    const count = Number(item.question_count) || (Array.isArray(item.questions) ? item.questions.length : 0)
    return {
      title: item.title || `${item.course_code || ''} Past Questions`,
      description: withStudentsguide(`${count} past question${count === 1 ? '' : 's'} with answers · ${item.course_code || item.exam_type || 'Past Questions'}.`),
      image: absoluteImage(Array.isArray(pages) ? pages[0]?.url : '', settings.img_exam),
      type: 'article',
    }
  }
  if (type === 'update') {
    const item = await getJson(`/api/articles?slug=${encodeURIComponent(id)}`)
    return {
      title: item.title,
      description: withStudentsguide(item.excerpt || item.body || 'Read the latest school update.'),
      image: absoluteImage(item.image_url, settings.img_campus_walk || settings.img_campus),
      type: 'article',
    }
  }
  return {
    title: settings.site_name || 'Studentsguide',
    description: cleanDescription(settings.hero_text, 'Study materials, past questions, CBT practice and school updates.'),
    image: absoluteImage(settings.img_hero, '/images/hero-students.jpg'),
    type: 'website',
  }
}

function pageHtml(meta, pageUrl) {
  const title = escapeHtml(meta.title || 'Studentsguide')
  const description = escapeHtml(meta.description)
  const image = escapeHtml(meta.image)
  const url = escapeHtml(pageUrl)
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Studentsguide</title>
  <meta name="description" content="${description}" />
  <meta property="og:site_name" content="Studentsguide" />
  <meta property="og:type" content="${escapeHtml(meta.type || 'article')}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:secure_url" content="${image}" />
  <meta property="og:url" content="${url}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />
  <link rel="icon" type="image/jpeg" href="/logo.jpg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/original/studentsguide.css" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/original/studentsguide-clean.js"></script>
  <script type="module" src="/original/whatsapp-sharing.js"></script>
</body>
</html>`
}

export default async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`)
  const type = url.searchParams.get('type') || ''
  const id = url.searchParams.get('id') || ''
  const originalPath = url.searchParams.get('path') || '/'
  const shareVersion = url.searchParams.get('share') || ''
  const protocol = request.headers['x-forwarded-proto'] || 'https'
  const host = request.headers['x-forwarded-host'] || request.headers.host
  const pageUrl = `${protocol}://${host}${originalPath}${shareVersion ? `?share=${encodeURIComponent(shareVersion)}` : ''}`
  try {
    const meta = await previewData(type, id)
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.setHeader('Cache-Control', 'public, s-maxage=15, must-revalidate')
    response.status(200).send(pageHtml(meta, pageUrl))
  } catch (error) {
    response.setHeader('Content-Type', 'text/html; charset=utf-8')
    response.status(200).send(pageHtml({
      title: 'Studentsguide',
      description: 'Study materials, past questions, CBT practice and school updates.',
      image: `${ORIGIN}/images/hero-students.jpg`,
      type: 'website',
    }, pageUrl))
  }
}
