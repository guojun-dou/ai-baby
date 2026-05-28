/**
 * 生成 TabBar 占位 PNG（64×64，透明底 + 中心圆点），后期替换为 IconPark 线性导出图。
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '..', 'src', 'static', 'tab')

function pngChunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const t = Buffer.from(type, 'binary')
  const chunk = Buffer.concat([t, data])
  let crc = 0xffffffff
  for (let i = 0; i < chunk.length; i++) {
    crc ^= chunk[i]
    for (let k = 0; k < 8; k++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
    }
  }
  crc = (crc ^ 0xffffffff) >>> 0
  const c = Buffer.alloc(4)
  c.writeUInt32BE(crc, 0)
  return Buffer.concat([len, chunk, c])
}

/**
 * RGBA PNG，透明背景；中心圆 r，颜色 rgb
 */
function circleDotPng(w, h, r, cr, cg, cb) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0
  const cx = (w - 1) / 2
  const cy = (h - 1) / 2
  const stride = 1 + w * 4
  const raw = Buffer.alloc(stride * h)
  const r2 = r * r
  for (let y = 0; y < h; y++) {
    const row = y * stride
    raw[row] = 0
    for (let x = 0; x < w; x++) {
      const dx = x - cx
      const dy = y - cy
      const inCircle = dx * dx + dy * dy <= r2
      const o = row + 1 + x * 4
      if (inCircle) {
        raw[o] = cr
        raw[o + 1] = cg
        raw[o + 2] = cb
        raw[o + 3] = 255
      }
      else {
        raw[o] = 0
        raw[o + 1] = 0
        raw[o + 2] = 0
        raw[o + 3] = 0
      }
    }
  }
  const idat = deflateSync(raw)
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ])
}

const gray = [153, 153, 153]
const primary = [255, 139, 167]
const size = 64
const dotR = 10

mkdirSync(outDir, { recursive: true })

const inactive = ['home', 'cart', 'order', 'my']
for (const name of inactive) {
  writeFileSync(join(outDir, `${name}.png`), circleDotPng(size, size, dotR, ...gray))
}
for (const name of inactive) {
  writeFileSync(
    join(outDir, `${name}-active.png`),
    circleDotPng(size, size, dotR, ...primary),
  )
}

console.log('Wrote tab icons to', outDir)
