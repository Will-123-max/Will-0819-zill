import { mkdir, writeFile } from 'node:fs/promises'

const origin = 'https://studentsguide-ebsu-d590.arcada.app'
const html = await fetch(origin).then((response) => {
  if (!response.ok) throw new Error(`Could not read original site (${response.status})`)
  return response.text()
})
const scriptPath = html.match(/<script type="module" src="(\/original\/studentsguide-clean\.js)"/)?.[1]
  || html.match(/<script type="module" crossorigin src="([^"]+)"/)?.[1]
const stylePath = html.match(/<link rel="stylesheet"(?: crossorigin)? href="([^"]+)"/)?.[1]
if (!scriptPath || !stylePath) throw new Error('Original website assets were not found')
const [scriptResponse, styleResponse] = await Promise.all([fetch(`${origin}${scriptPath}`), fetch(`${origin}${stylePath}`)])
if (!scriptResponse.ok || !styleResponse.ok) throw new Error('Could not download original website assets')
let script = await scriptResponse.text()
if (script.includes('"/api/') || script.includes('`/api/')) {
  script = script.replaceAll('"/api/', `"${origin}/api/`).replaceAll('`/api/', `\`${origin}/api/`)
}
script = script.replace('["Open","No login needed"]', '[x.length,x.length===1?"Material available":"Materials available"]')
script = script.replace('const _3=["All","PDF","Notes","Handout","Slide"]', 'const _3=["All","PDF","Notes","Handout","Slide","Assignment","Past Question Material"]')
await mkdir('public/original', { recursive: true })
await Promise.all([
  writeFile('public/original/studentsguide-clean.js', script),
  writeFile('public/original/studentsguide.css', await styleResponse.text()),
])
console.log(`Restored original website assets: ${scriptPath} and ${stylePath}`)
