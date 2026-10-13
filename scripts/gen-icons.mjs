// Gera os ícones PWA do app "Fim!" a partir de um SVG (ponto de exclamação + badge).
import sharp from "sharp"
import { mkdirSync, writeFileSync } from "fs"

const svg = (size, withBadge = true) => {
  const s = size
  return `<svg width="${s}" height="${s}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#09090b"/>
  <!-- barra do ponto de exclamação -->
  <rect x="222" y="86" width="68" height="224" rx="34" fill="#fafafa"/>
  <!-- ponto do ponto de exclamação -->
  <circle cx="256" cy="386" r="38" fill="#fafafa"/>
  ${
    withBadge
      ? `<!-- badge de notificação -->
  <circle cx="392" cy="120" r="60" fill="#09090b"/>
  <circle cx="392" cy="120" r="52" fill="#10b981"/>`
      : ""
  }
</svg>`
}

const outDir = "/home/z/my-project/public"
mkdirSync(outDir, { recursive: true })

for (const size of [192, 512]) {
  const png = await sharp(Buffer.from(svg(512, true)))
    .resize(size, size)
    .png()
    .toBuffer()
  writeFileSync(`${outDir}/icon-${size}.png`, png)
  console.log(`icone-${size}.png ok`)
}

console.log("Icones gerados em", outDir)
