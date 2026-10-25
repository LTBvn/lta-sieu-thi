// Chạy cùng lúc backend (cổng 4000, thư mục backend/) và frontend Vite (cổng 5173, thư mục frontend/).
// Backend được bật trước; frontend chỉ bật khi backend đã sẵn sàng. Tắt bằng Ctrl+C: cả hai cùng dừng.
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HEALTH_URL = 'http://localhost:4000/api/health'
const children = []

// Lần đầu sau khi tách thư mục: nhắc cài thư viện
for (const dir of ['backend', 'frontend']) {
  if (!fs.existsSync(path.join(root, dir, 'node_modules'))) {
    console.error(`Chưa cài thư viện cho ${dir}/. Chạy: npm run install:all`)
    process.exit(1)
  }
}

function run(name, color, cwd, args) {
  const child = spawn(process.execPath, args, { cwd: path.join(root, cwd), stdio: ['inherit', 'pipe', 'pipe'], env: { ...process.env, FORCE_COLOR: '1' } })
  const prefix = `${color}[${name}]\x1b[0m `
  for (const [stream, out] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
    let buf = ''
    stream.on('data', chunk => {
      buf += chunk
      const lines = buf.split(/\r?\n/)
      buf = lines.pop()
      for (const line of lines) out.write(prefix + line + '\n')
    })
  }
  child.on('exit', code => {
    console.log(`${prefix}đã dừng (mã ${code ?? 0})`)
    shutdown()
  })
  children.push(child)
}

let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  for (const c of children) {
    if (c.exitCode !== null) continue
    // Windows: kill() chỉ dừng tiến trình cha (node --watch), tiến trình con vẫn giữ cổng → dừng cả cây
    if (process.platform === 'win32') spawn('taskkill', ['/pid', String(c.pid), '/T', '/F'], { stdio: 'ignore' })
    else c.kill()
  }
  setTimeout(() => process.exit(0), 800)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

run('backend', '\x1b[35m', 'backend', ['--env-file-if-exists=.env', '--watch', 'src/index.js'])

// Chờ backend trả lời (tối đa 30 giây) rồi mới bật frontend
for (let i = 0; i < 60 && !stopping; i++) {
  try {
    if ((await fetch(HEALTH_URL)).ok) break
  } catch {}
  await new Promise(r => setTimeout(r, 500))
}

if (!stopping) run('frontend', '\x1b[36m', 'frontend', ['node_modules/vite/bin/vite.js'])
