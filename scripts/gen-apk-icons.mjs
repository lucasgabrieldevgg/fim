// Gera os ícones do APK Fim! (fork do ntfy-android) a partir de SVGs renderizados com sharp.
// Fundo: verde sólido #16A34A | Primeiro plano: exclamação branca.
import sharp from "sharp";
import { mkdirSync } from "fs";

const RES = "/home/z/my-project/apk-build/ntfy-android/app/src/main/res";

// Camadas adaptativas: 108dp -> px por dpi
const ADAPTIVE = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 324, xxxhdpi: 432 };
// Ícone legado: 48dp -> px por dpi
const LEGACY = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };

const GREEN = "#16A34A";
const WHITE = "#FFFFFF";

// Exclamação: barra arredondada + ponto (dentro da zona segura de 66%)
const glyph = (scale = 1) => `
  <g transform="scale(${scale})">
    <rect x="47" y="28" width="14" height="34" rx="7" fill="${WHITE}"/>
    <circle cx="54" cy="75" r="8.5" fill="${WHITE}"/>
  </div>`.replace("</div>", "</g>");

const foregroundSvg = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 108 108">${glyph(1)}</svg>`;

const legacySvg = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 48 48">
     <rect width="48" height="48" rx="10" fill="${GREEN}"/>
     <rect x="21" y="12" width="6" height="15" rx="3" fill="${WHITE}"/>
     <circle cx="24" cy="33" r="4" fill="${WHITE}"/>
   </svg>`;

const bgSvg = (px) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}"><rect width="${px}" height="${px}" fill="${GREEN}"/></svg>`;

for (const [dpi, px] of Object.entries(ADAPTIVE)) {
  const dir = `${RES}/mipmap-${dpi}`;
  mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(bgSvg(px))).png().toFile(`${dir}/ic_launcher_background.png`);
  await sharp(Buffer.from(foregroundSvg(px))).png().toFile(`${dir}/ic_launcher_foreground.png`);
}
for (const [dpi, px] of Object.entries(LEGACY)) {
  const dir = `${RES}/mipmap-${dpi}`;
  mkdirSync(dir, { recursive: true });
  await sharp(Buffer.from(legacySvg(px))).png().toFile(`${dir}/ic_launcher.png`);
  await sharp(Buffer.from(legacySvg(px))).png().toFile(`${dir}/ic_launcher_round.png`);
}
console.log("Ícones Fim! gerados.");
