/* Genera dist/ — lo único que se despliega a Cloudflare Pages.
   Uso:  node build.js
   - JS: Terser (sin comentarios, nombres locales acortados; SIN toplevel mangle porque el HTML
     llama funciones globales con onclick="funcName()").
   - CSS: Lightning CSS (clean-css rompía @starting-style del modal).
   - HTML: html-minifier-terser (no toca type="module").
   - Se copia solo lo que el sitio sirve: nunca supabase/, apps-script/, .git ni notas. */
const fs = require('fs');
const path = require('path');
const { minify: terser } = require('terser');
const { transform } = require('lightningcss');
const { minify: minifyHtml } = require('html-minifier-terser');

const OUT = path.join(__dirname, 'dist');
const rd = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
const wr = (p, s) => {
  const f = path.join(OUT, p);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, s);
};

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });

  const js = await terser(rd('js/app.js'), {
    compress: true,
    mangle: true,
    format: { comments: false },
  });
  if (!js.code) throw new Error('Terser no devolvió código');
  wr('js/app.js', js.code);

  const css = transform({
    filename: 'styles.css',
    code: Buffer.from(rd('css/styles.css')),
    minify: true,
  });
  wr('css/styles.css', css.code.toString());

  // La app se sirve en la raíz: banco_imagenes_hslv.html se publica como index.html.
  for (const [src, dest] of [['banco_imagenes_hslv.html', 'index.html'], ['login.html', 'login.html']]) {
    wr(dest, await minifyHtml(rd(src), {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      minifyCSS: true,
      minifyJS: true,
    }));
  }

  fs.copyFileSync(path.join(__dirname, '_redirects'), path.join(OUT, '_redirects'));
  // hslv.jpg no lo usa ninguna página; los originales de diseño viven en design-src/ (no se publican)
  fs.cpSync(path.join(__dirname, 'Assets'), path.join(OUT, 'Assets'), {
    recursive: true,
    filter: (src) => path.basename(src) !== 'hslv.jpg',
  });

  const all = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      e.isDirectory() ? walk(p) : all.push(path.relative(OUT, p));
    }
  })(OUT);
  console.log(all.length + ' archivos en dist/');
})().catch((e) => { console.error(e); process.exit(1); });
