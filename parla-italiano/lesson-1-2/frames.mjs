// Restart-proof render: node frames.mjs <worker> <workers> [fps]. Run from the library root (LIB).
// Saves frames/f_00000.jpg … and skips frames already on disk, so a restart only loses frames in flight.
import fs from 'fs'; import path from 'path';
const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const HERE = path.dirname(new URL(import.meta.url).pathname), OUT = path.join(HERE, 'out/frames');
const [w, WK, fps = 30] = process.argv.slice(2).map(Number); fs.mkdirSync(OUT, { recursive: true });
const { browser, page } = await openDemo(HERE, { w: 1080, h: 1920, q: 'nodof=1' });
const DUR = await page.evaluate(() => window.DUR), TOTAL = Math.ceil(DUR * fps);
let done = 0; const t0 = Date.now();
for (let f = w; f < TOTAL; f += WK) {
  const file = path.join(OUT, `f_${String(f).padStart(5, '0')}.jpg`);
  if (fs.existsSync(file)) continue;
  await page.evaluate(t => window.render(t), f / fps);
  await page.screenshot({ path: file + '.tmp', type: 'jpeg', quality: 93 }); fs.renameSync(file + '.tmp', file);
  if (++done % 50 === 0) console.log(`w${w} ${done} new, at frame ${f}/${TOTAL}, ${((Date.now() - t0) / done / 1000).toFixed(1)} s/frame`);
}
console.log(`w${w} finished`); await browser.close(); closeServer();
