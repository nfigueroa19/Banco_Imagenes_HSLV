/* Genera Assets/Logo/imago-wordmark.png (fondo transparente) a partir del recorte claro del arte.
   Quita el fondo casi-blanco calculando la transparencia por píxel. Uso: node optimize-wm.js */
const sharp = require('sharp');
const path = require('path');
(async () => {
  const src = path.join(__dirname, 'design-src', 'imago-original.jpg');
  const { data, info } = await sharp(src).extract({ left: 370, top: 270, width: 635, height: 200 })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    let a = Math.max(255 - r, 255 - g, 255 - b) / 255;
    if (a < 0.08) { data[i] = data[i + 1] = data[i + 2] = 0; data[i + 3] = 0; continue; }
    a = Math.min(1, (a - 0.08) / 0.92 * 1.0 + 0.0);
    // des-mezcla contra blanco para recuperar el color original
    data[i] = Math.max(0, Math.round(255 - (255 - r) / Math.max(a, 0.01)));
    data[i + 1] = Math.max(0, Math.round(255 - (255 - g) / Math.max(a, 0.01)));
    data[i + 2] = Math.max(0, Math.round(255 - (255 - b) / Math.max(a, 0.01)));
    data[i + 3] = Math.round(a * 255);
  }
  const f = path.join(__dirname, 'Assets', 'Logo', 'imago-wordmark.png');
  const out = await sharp(data, { raw: info }).resize({ width: 240 }).png({ compressionLevel: 9 }).toBuffer();
  require('fs').writeFileSync(f, out);
  const m = await sharp(out).metadata();
  console.log('imago-wordmark.png', m.width + '×' + m.height, (out.length / 1024).toFixed(1) + ' KB');
})();
