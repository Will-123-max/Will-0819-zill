import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })
await cp('public', 'dist', { recursive: true })
await writeFile('dist/index.html', await readFile('index.html'))
console.log('Static Studentsguide build completed.')
