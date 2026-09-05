import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAX_SHEET_PHOTOS = 4;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Splits the 340px sidebar column evenly across up to 4 photos (the fixed
// two-slot 300px-each layout in the original mockup doesn't generalize to an
// arbitrary photo count). All submitted photos still go into the repo and
// the gallery page regardless of this cap — it only limits this one printed
// sheet, since more than 4 would be unreadably thin on an A4-shaped page.
function renderPhotosHtml(photoAbsPaths, title) {
  const shown = photoAbsPaths.slice(0, MAX_SHEET_PHOTOS);
  return shown
    .map(
      (absPath) =>
        `<img src="${pathToFileURL(absPath).href}" alt="${escapeHtml(
          title
        )}" style="width:100%; flex:1 1 0; min-height:0; object-fit:cover; display:block;">`
    )
    .join('\n      ');
}

function renderTagsHtml(tags) {
  return tags
    .map(
      (tag) =>
        `<span style="font-size: 12px; background: oklch(93% 0.005 75); padding: 7px 14px; border-radius: 3px; color: oklch(35% 0.005 75);">${escapeHtml(
          tag
        )}</span>`
    )
    .join('\n        ');
}

export async function renderProjectSheetHtml(project, { logoPath }) {
  const templatePath = path.join(__dirname, 'templates', 'project-sheet.html');
  let html = await readFile(templatePath, 'utf8');

  const tokens = {
    TITLE: escapeHtml(project.title),
    LOCATION: escapeHtml(project.location),
    DESCRIPTION: escapeHtml(project.description),
    SCOPE: escapeHtml(project.scope),
    SIZE: escapeHtml(project.size),
    MATERIALS: escapeHtml(project.materials),
    DURATION: escapeHtml(project.duration),
    LOGO_SRC: pathToFileURL(logoPath).href,
    TAGS_HTML: renderTagsHtml(project.tags),
    PHOTOS_HTML: renderPhotosHtml(project.photoAbsPaths, project.title),
  };

  for (const [key, value] of Object.entries(tokens)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }

  return html;
}

export async function renderPdf(html, outputPath, { launch } = {}) {
  const puppeteer = (await import('puppeteer')).default;
  const { writeFile, mkdtemp, rm } = await import('node:fs/promises');
  const os = await import('node:os');

  const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'project-sheet-'));
  const tmpHtmlPath = path.join(tmpDir, 'sheet.html');
  await writeFile(tmpHtmlPath, html, 'utf8');

  const browser = await (launch || puppeteer.launch)({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1123 });
    await page.goto(pathToFileURL(tmpHtmlPath).href, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: outputPath,
      width: '794px',
      height: '1123px',
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
  } finally {
    await browser.close();
    await rm(tmpDir, { recursive: true, force: true });
  }
}
