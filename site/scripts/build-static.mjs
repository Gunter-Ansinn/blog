/**
 * Static export build for GitHub Pages.
 * Temporarily moves local-only routes (API) out of the app directory
 * so Next.js doesn't try to include them in the static export,
 * then restores them afterward.
 */

import { execSync }                    from 'child_process'
import { renameSync, existsSync }      from 'fs'
import { resolve, dirname }            from 'path'
import { fileURLToPath }               from 'url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// Routes that only exist for local dev — must not appear in the static build.
// Hidden outside src/ entirely so Next.js doesn't scan them.
const LOCAL_ONLY = ['src/app/api']

const pairs = LOCAL_ONLY.map(dir => ({
  active: resolve(root, dir),
  hidden: resolve(root, '.build_tmp_' + dir.replace(/\//g, '_')),
}))

function hide()    { pairs.forEach(({ active, hidden }) => existsSync(active) && renameSync(active, hidden)) }
function restore() { pairs.forEach(({ active, hidden }) => existsSync(hidden) && renameSync(hidden, active)) }

hide()

try {
  execSync('next build', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, GITHUB_ACTIONS: 'true' },
  })
} finally {
  restore() // always restore, even if the build fails
}
