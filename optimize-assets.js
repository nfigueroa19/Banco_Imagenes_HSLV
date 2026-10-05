/* Reduce los logos al tamaño con que realmente se muestran (a 2× para pantallas de alta densidad).
   Uso:  node optimize-assets.js
   Parte de los originales en alta resolución; si ya se redujeron, restaurar el original antes
   (en git: `git show d03631d:Assets/Logo/<archivo>`) — este script solo achica, no agranda.
   Tamaños de pantalla (css/styles.css): .login-logo 130px de ancho, .header-logo 38px. */
const sharp = require('sharp');
const path = require('path');

const LOGO = (f) => path.join(__dirname, 'Assets', 'Logo', f);

(async () => {
  const jobs = [
    // login: 130px CSS → 260px
    ['hslv-lockup.png', (s) => s.resize({ width: 260, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 })],
    // cabecera: caja de 38px, logo apaisado ~1.46:1 → 76px de ancho
    ['hslv-mark.png', (s) => s.resize({ width: 76, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 })],
    // pestaña del navegador
    ['favicon.png', (s) => s.resize({ width: 64, height: 64, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true, quality: 90 })],
  ];
  for (const [name, fn] of jobs) {
    const buf = await fn(sharp(LOGO(name))).toBuffer();
    require('fs').writeFileSync(LOGO(name), buf);
    const m = await sharp(buf).metadata();
    console.log(name, m.width + '×' + m.height, (buf.length / 1024).toFixed(1) + ' KB');
  }

  // Imago (pantalla de carga): solo la palabra "IMAGO", recortada del arte completo
  // (design-src/imago-original.jpg, 1376×768). Los puntos y las ondas de fondo se
  // reemplazan por CSS. WebP a 635×200 = 2× del ancho con que se muestra (~320px).
  const out = LOGO('imago-wordmark.webp');
  const info = await sharp(path.join(__dirname, 'design-src', 'imago-original.jpg'))
    .extract({ left: 370, top: 270, width: 635, height: 200 })
    .webp({ quality: 88 })
    .toFile(out);
  console.log('imago-wordmark.webp', info.width + '×' + info.height, (info.size / 1024).toFixed(1) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
