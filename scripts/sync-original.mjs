import { mkdir, writeFile } from 'node:fs/promises'

const origin = 'https://studentguide-g5qp.arcada.app'
const html = await fetch(`${origin}/`).then((response) => {
  if (!response.ok) throw new Error(`Could not read original site (${response.status})`)
  return response.text()
})

const scriptPath = html.match(/<script type="module" crossorigin src="([^"]+)"/)?.[1]
const stylePath = html.match(/<link rel="stylesheet" crossorigin href="([^"]+)"/)?.[1]
if (!scriptPath || !stylePath) throw new Error('Original application assets were not found')

const [scriptResponse, styleResponse] = await Promise.all([
  fetch(`${origin}${scriptPath}`),
  fetch(`${origin}${stylePath}`),
])
if (!scriptResponse.ok || !styleResponse.ok) throw new Error('Could not download original application assets')

let script = await scriptResponse.text()
const style = await styleResponse.text()
script = script
  .replaceAll('"/api/', `"${origin}/api/`)
  .replaceAll('`/api/', `\`${origin}/api/`)
  .replaceAll('Featured materials', 'Live Materials Available')
  .replace('Each EBSU guide item opens as a question — pick an answer or tap View Answer.', 'Open any item, pick an answer, or tap View Answer anytime. If you miss it, the correct option is highlighted.')
  .replace('Interactive guide questions', 'Pick an answer · View Answer anytime')
  .replace('["Open","No login needed"]', '[x.length,x.length===1?"Material available":"Materials available"]')
  .replace(',{to:"/recreation",label:"Recreation Center"}', '')
  .replace(',{to:"/recreation",icon:SN,title:"Recreation Center",slot:"img_recreation"}', '')
  .replace(',d.jsx("li",{"data-source-loc":"src/components/Footer.jsx:54:12",children:d.jsx(ie,{to:"/recreation",className:"hover:text-gold","data-source-loc":"src/components/Footer.jsx:54:16",children:"Recreation Center"})})', '')
  .replace(',recreation:{category:"recreation",kicker:"Move your body",title:"Recreation Center",text:"Pitches, gym token, intramurals and who collects fees.",image:"/images/recreation.jpg",slot:"img_recreation"}', '')
  .replace(',recreation:["/recreation","Recreation Center"]', '')
  .replace('{key:"img_recreation",label:"Recreation",fallback:"/images/recreation.jpg"},', '')
  .replace(',img_recreation:"/images/recreation.jpg"', '')
  .replace(',"recreation","admission"', ',"admission"')
  .replace(',d.jsx(Ae,{path:"/recreation",element:d.jsx(Hl,{kind:"recreation","data-source-loc":"src/App.tsx:84:45"}),"data-source-loc":"src/App.tsx:84:10"})', '')
  .replace('Counselling, IT Support and Recreation are all here.', 'Counselling and IT Support are all here.')
  .replace('Library, counselling, IT and recreation', 'Library, counselling and IT support')
  .replace('const _3=["All","PDF","Notes","Handout","Slide"]', 'const _3=["All","PDF","Notes","Handout","Slide","Assignment","Past Question Material"]')
  .replace('const FE=["Overview","Site","Pictures","Materials"', 'const FE=["Overview","Site","Pictures","Materials, Assignments & Extra Past Questions"')
  .replace('o==="Materials"', 'o==="Materials, Assignments & Extra Past Questions"')
  .replace('"Past questions","CBT quizzes"', '"Past Questions Bank (Q&A)","CBT quizzes"')
  .replace('o==="Past questions"', 'o==="Past Questions Bank (Q&A)"')
  .replace('children:y?"Edit past-question set":"New past-question set"', 'children:y?"Edit answer-key question set":"New answer-key question set"')
  .replace('["PDF","Notes","Handout","Slide"].map', '["PDF","Notes","Handout","Slide","Assignment","Past Question Material"].map')
  .replace('type:ls(p).length?"Notes":u.type', 'type:ls(p).length&&! ["Assignment","Past Question Material"].includes(u.type)?"Notes":u.type')
  .replace('children:x?"Edit material":"Upload material"', 'children:x?"Edit material / assignment / past question":"Upload material / assignment / past question"')
  .replace('children:v?"Saving…":x?"Save changes":"Publish material"', 'children:v?"Saving…":x?"Save changes":"Publish material / assignment / past question"')
  .replace('placeholder:"Notes (optional if you upload a PDF or picture)"', 'placeholder:"Written text (optional if you upload a PDF or picture)"')
  .replace('label:"Snap the note — one photo per page"', 'label:"Snap notes, assignments or past-question pages — one photo per page"')
  .replace('children:o.map(_=>d.jsxs("article"', 'children:[...o].sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""),void 0,{sensitivity:"base"})).map(_=>d.jsxs("article"')
  .replace('children:s.map(x=>d.jsxs(ie,{to:`/past-questions/${x.id}`', 'children:[...s].sort((a,b)=>String(a.title||"").localeCompare(String(b.title||""),void 0,{sensitivity:"base"})).map(x=>d.jsxs(ie,{to:`/past-questions/${x.id}`')
  .replace('src/pages/CBT.jsx:33:10",children:s.map(p=>d.jsxs("div"', 'src/pages/CBT.jsx:33:10",children:[...s].sort((a,b)=>String(a.course_code||a.title||"").localeCompare(String(b.course_code||b.title||""),void 0,{numeric:!0,sensitivity:"base"})).map(p=>d.jsxs("div"')
  .replace('src/pages/Admin.jsx:1055:6",children:s.map(A=>d.jsxs("div"', 'src/pages/Admin.jsx:1055:6",children:[...s].sort((a,b)=>String(a.course_code||a.title||"").localeCompare(String(b.course_code||b.title||""),void 0,{numeric:!0,sensitivity:"base"})).map(A=>d.jsxs("div"')
  .replace('["University","JAMB","Post-UTME","WAEC","NECO"].map(A=>d.jsx("option"', '["University","JAMB","Post-UTME","WAEC","NECO","CBT Quiz","CBT Exam"].map(A=>d.jsx("option"')
  .replace('img_map:"/images/campus-map.jpg"}', 'img_map:"/images/campus-map.jpg",background_color:"#ffffff",text_color:"#0f2744",brand_color:"#1565c8",header_color:"#ffffff",footer_color:"#071320"}')
  .replace('footer_blurb:o.footer_blurb}', 'footer_blurb:o.footer_blurb,background_color:o.background_color,text_color:o.text_color,brand_color:o.brand_color,header_color:o.header_color,footer_color:o.footer_color}')
  .replace('["footer_blurb","Footer blurb"]]', '["footer_blurb","Footer blurb"],["background_color","Website background"],["text_color","Website text color"],["brand_color","Buttons and links"],["header_color","Header background"],["footer_color","Footer background"]]')
  .replace('function gr(s,e){return String(s??"").trim()===String(e??"").trim()}', 'function gr(s,e){const n=r=>String(r??"").normalize("NFKC").replace(/\\s+/g," ").trim();return n(s)===n(e)}')
  .replace('function O3(s)', 'function sgIsCorrectAnswer(s,e){const n=e?.correct??e?.answer??e?.correct_answer??"";if(gr(s,n))return!0;const r=Array.isArray(e?.options)?e.options:[],i=c=>String(c??"").normalize("NFKC").replace(/\\s+/g," ").trim().toLocaleLowerCase(),o=String(n??"").normalize("NFKC").trim().toUpperCase();if(r.filter(c=>i(c)===i(n)).length===1&&i(s)===i(n))return!0;if(/^[A-Z]$/.test(o)){const c=o.charCodeAt(0)-65;return c>=0&&c<r.length&&gr(s,r[c])}const c=Number(o);return Number.isInteger(c)&&(c>=1&&c<=r.length&&gr(s,r[c-1])||c>=0&&c<r.length&&gr(s,r[c]))}function sgCorrectAnswer(s){const e=s?.correct??s?.answer??s?.correct_answer??"",n=Array.isArray(s?.options)?s.options:[],r=String(e??"").normalize("NFKC").trim().toUpperCase();if(/^[A-Z]$/.test(r)){const o=r.charCodeAt(0)-65;return n[o]??e}const o=Number(r);return Number.isInteger(o)&&o>=1&&o<=n.length?n[o-1]:e}function O3(s)')
  .replaceAll('sg-cbt-review-', 'sg-cbt-review-v2-')
  .replace('Clearing page ${A}', 'AI clarity: enhancing page ${A}')
  .replace('Studentguide clears the photo so handwriting and print are easier to read, then numbers them Page 1, 2, 3…', 'Studentguide AI clarity automatically crops, sharpens and brightens each photo, then arranges the upload as Page 1, 2, 3…')
  .replace('Math.min(1,2800/Math.max(r,o))', 'Math.min(1,1600/Math.max(r,o))')
  .replace('if(e.size>1.2*1024*1024)throw new Error("This file is too large for the backup upload path. Try a smaller photo or PDF.")', 'if(e.size>3*1024*1024)throw new Error("This file is too large for the backup upload path. Keep backup uploads under 3 MB or use the signed upload service.")')
  .replace('try{return await BE(n,r)}catch(o){try{return await $E(n,r)}catch{throw new Error(o.message||"Upload failed")}}', 'try{return await BE(n,r)}catch(o){try{return await $E(n,r)}catch(c){throw new Error(`${o.message||"Signed upload failed"}. Backup upload: ${c.message||"failed"}`)}}')
  .replace('const ge=_c(Z.questions||[]);h(ge),m(ge);', 'const ge=_c(Z.questions||[]).map((Ge,Tt)=>({...Ge,id:Ge.id??`quiz-${s}-${Tt}`}));h(ge),m(ge);')
  .replace('p.filter(Z=>gr(A[Z.id],Z.correct)).length', 'p.filter(Z=>sgIsCorrectAnswer(A[Z.id],Z)).length')
  .replace('p.filter(Ie=>gr(A[Ie.id],Ie.correct)).length', 'p.filter(Ie=>sgIsCorrectAnswer(A[Ie.id],Ie)).length')
  .replace('x=r&&gr(h,s.correct)', 'x=r&&sgIsCorrectAnswer(h,s)')
  .replace('Tt=gr(Ge,Z.correct)', 'Tt=sgIsCorrectAnswer(Ge,Z)')
  .replace('fs=gr(Ie,Z.correct),Ns=gr(Ie,Ge)', 'fs=sgIsCorrectAnswer(Ie,Z),Ns=gr(Ie,Ge)')
  .replace('children:Tt?"You got this right":Ge?"Correction below":"You skipped this one"', 'children:Tt?"You got this right":Ge?`Your answer: ${Ge} · Correct answer: ${sgCorrectAnswer(Z)}`:`You skipped this one · Correct answer: ${sgCorrectAnswer(Z)}`')
  .replace('K(Ie||Tt)', 'K(Ie&&typeof Ie==="object"?{...Ie,...Tt}:Tt)')
  .replace('"Cleared pages · "', '"Clear phone scans · "')
  .replace('transformOrigin:"top center"}', 'transformOrigin:"top center",filter:"contrast(1.2) brightness(1.08)",imageRendering:"auto"}')

await mkdir('public/original', { recursive: true })
await Promise.all([
  writeFile('public/original/studentsguide.js', script),
  writeFile('public/original/studentsguide.css', style),
])

console.log(`Synced original Studentsguide: ${scriptPath} and ${stylePath}`)
