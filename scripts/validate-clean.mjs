import { readFile } from 'node:fs/promises'

const [script, style, html, removeRecreation, modernHome, adminCapabilities, adminUploadRepair, games, materialsLibrary, whatsappSharing, updateNotifier, socialPreview] = await Promise.all([
  readFile('public/original/studentsguide-clean.js', 'utf8'),
  readFile('public/original/studentsguide.css', 'utf8'),
  readFile('index.html', 'utf8'),
  readFile('public/original/remove-recreation.js', 'utf8'),
  readFile('public/original/modern-home.js', 'utf8'),
  readFile('public/original/admin-capabilities.js', 'utf8'),
  readFile('public/original/admin-upload-repair.js', 'utf8'),
  readFile('public/original/games.js', 'utf8'),
  readFile('public/original/materials-library.js', 'utf8'),
  readFile('public/original/whatsapp-sharing.js', 'utf8'),
  readFile('public/original/update-notifier.js', 'utf8'),
  readFile('api/social-preview.mjs', 'utf8'),
])
const checks = [
  [script.length > 500_000, 'Original JavaScript bundle is incomplete'],
  [style.length > 30_000, 'Original stylesheet is incomplete'],
  [script.includes('Featured materials'), 'Original Featured materials section is missing'],
  [!script.includes('["Open","No login needed"]'), 'Open / No login needed card is still active'],
  [script.includes('x.length===1?"Material available":"Materials available"'), 'Live material availability card is missing'],
  [script.includes('Recreation Center'), 'Original Recreation Center function is missing'],
  [html.includes('/original/remove-recreation.js') && removeRecreation.includes('removeRecreationCenter'), 'Recreation Center removal is not active'],
  [html.includes('/original/modern-home.js') && modernHome.includes('EBSU student resource hub') && modernHome.includes('sg-modern-section') && modernHome.includes('sg-modern-card'), 'Modern professional homepage layout is missing'],
  [script.includes('https://studentguide-g5qp.arcada.app/api/'), 'Original live API connection is missing'],
  [!script.includes('"/api/') && !script.includes('`/api/'), 'Relative API paths would break the restored copy'],
  [html.includes('/original/studentsguide-clean.js'), 'Restored website is not active in index.html'],
  [html.includes('https://studentsguide-ebsu-d590.arcada.app/'), 'Official Studentsguide link is not configured'],
  [html.includes('/original/admin-upload-repair.js') && html.includes('/original/admin-capabilities.js'), 'Admin library upload tools are not active'],
  [adminCapabilities.includes("['Library uploads', 'Materials']") && !adminCapabilities.includes('Materials, Assignments & Extra Past Questions'), 'Admin navigation should retain its normal Materials function'],
  [adminUploadRepair.includes('Upload library content') && adminUploadRepair.includes('All universities') && adminUploadRepair.includes('All faculties') && adminUploadRepair.includes('All departments') && adminUploadRepair.includes('All levels') && adminUploadRepair.includes('Assignment') && adminUploadRepair.includes('Past Question Material'), 'Admin upload organization options are missing'],
  [adminUploadRepair.includes('...(editingItem ? { id: editingItem.id } : {})') && !adminUploadRepair.includes('...(editingItem || {})'), 'Material updates may send unsupported database columns such as sold'],
  [games.includes('Student Games') && games.includes('Tic-Tac-Toe') && games.includes('Memory Match') && games.includes('Word Scramble') && games.includes('Reaction Timer') && games.includes('Number Challenge') && games.includes('Rock Paper Scissors') && games.includes('30-Second Math Sprint') && games.includes('Typing Challenge') && games.includes('Color Focus') && games.includes('data-games-dashboard'), 'Student Games page, games, or dashboard access is missing'],
  [materialsLibrary.includes('Studentsguide Library') && materialsLibrary.includes('Extra Past Question') && materialsLibrary.includes('sg-library-description') && materialsLibrary.includes('navigator.clipboard.writeText'), 'Library-style material cards, extra past questions, or shareable links are missing'],
  [updateNotifier.includes('New from the Studentguide desk') && updateNotifier.includes('https://studentsguide-ebsu-d590.arcada.app') && updateNotifier.includes('Dismiss'), 'Top update notification or official website link is missing'],
  [script.includes('const _3=["All","PDF","Notes","Handout","Slide","Assignment","Past Question Material"]'), 'Assignment and extra past-question filters are missing from Materials'],
  [!html.includes('/original/library-mode.js') && !html.includes('/original/guide-onboarding.js'), 'Later public-function overrides are still active'],
  [whatsappSharing.includes('Share picture on WhatsApp') && whatsappSharing.includes('navigator.clipboard.writeText') && whatsappSharing.includes("searchParams.set('share'") && whatsappSharing.includes('Link copied ✓'), 'WhatsApp share, fresh copy-link, or copy confirmation is missing'],
  [socialPreview.includes('withStudentsguide') && socialPreview.includes('og:description') && socialPreview.includes('og:image') && socialPreview.includes('shareVersion') && socialPreview.includes('s-maxage=15') && socialPreview.includes("type === 'material'") && socialPreview.includes("type === 'past'") && socialPreview.includes("type === 'update'") && socialPreview.includes('/original/studentsguide-clean.js'), 'Fresh Studentsguide page-specific preview metadata is missing'],
  [script.includes('Each EBSU guide item opens as a question — pick an answer or tap View Answer.'), 'Original interactive guide behavior was changed'],
]
for (const [valid, message] of checks) if (!valid) throw new Error(message)
console.log('Original Studentsguide version validation passed.')
