import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const contentSource = await readFile(new URL('../src/content.ts', import.meta.url), 'utf8')
const workGridSource = await readFile(new URL('../src/components/WorkGrid.tsx', import.meta.url), 'utf8')

test('projects keep live demos but remove source links', () => {
  assert.doesNotMatch(contentSource, /sourceUrl/)
  assert.doesNotMatch(workGridSource, /project\.sourceUrl|copy\.work\.source/)
  assert.match(workGridSource, /href=\{project\.demoUrl\}/)
})

test('project cards show the supplied technology and capability details', () => {
  assert.match(contentSource, /tags: \['PHP', 'MySQL', 'HTML', 'Vanilla JS', 'AJAX', 'RTL \/ LTR'\]/)
  assert.match(contentSource, /features: \[/)
  assert.match(workGridSource, /project\.features\.map/)
})
