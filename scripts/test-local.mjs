// Local smoke test: exercises rendering + gallery generation end-to-end
// using existing repo photos instead of real GitHub attachment downloads.
// Not part of the production pipeline — run manually, then delete its output.
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderProjectSheetHtml, renderPdf } from './render-project-sheet.js';
import { generateGalleryHtml } from './generate-gallery.js';
import { uniqueSlug, slugify } from './lib/slug.js';
import { resizeForWeb } from './lib/resize-image.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function main() {
  const title = 'Black Cladding Shed';
  const slug = uniqueSlug(slugify(title), []);

  const photosDir = path.join(ROOT, 'photos', 'projects', slug);
  await mkdir(photosDir, { recursive: true });

  const sourcePhotos = [
    'shed-exterior-black-cladding-1.jpg',
    'shed-exterior-black-windows.jpg',
    'shed-interior-frame.jpg',
  ];
  const photoAbsPaths = [];
  const photoRelPaths = [];
  for (let i = 0; i < sourcePhotos.length; i++) {
    const rawBuffer = await readFile(path.join(ROOT, 'photos', sourcePhotos[i]));
    const buffer = await resizeForWeb(rawBuffer);
    const destAbs = path.join(photosDir, `photo-${i + 1}.jpg`);
    await writeFile(destAbs, buffer);
    photoAbsPaths.push(destAbs);
    photoRelPaths.push(`photos/projects/${slug}/photo-${i + 1}.jpg`);
  }

  const record = {
    slug,
    title,
    location: 'Beaudesert, QLD',
    scope: 'Shed design & construction',
    size: '9m x 6m',
    materials: 'Colorbond® steel, dark finish',
    duration: '6 weeks',
    description:
      'A fully engineered steel-frame shed with dark Colorbond® steel cladding — design, council approval and construction managed end to end by JK Build Solutions.',
    tags: ['Council approved', 'Engineered', 'Fully managed'],
    photos: photoRelPaths,
    pdf: `project-sheets/${slug}.pdf`,
    issueNumber: 1,
    submittedAt: new Date().toISOString(),
  };

  const logoPath = path.join(ROOT, 'Logo', 'logo-white-no-bg.png');
  const sheetHtml = await renderProjectSheetHtml({ ...record, photoAbsPaths }, { logoPath });

  const pdfAbsPath = path.join(ROOT, record.pdf);
  await mkdir(path.dirname(pdfAbsPath), { recursive: true });
  await renderPdf(sheetHtml, pdfAbsPath);
  console.log('Wrote PDF to', pdfAbsPath);

  const projects = [record];
  const galleryHtml = await generateGalleryHtml(projects);
  await writeFile(path.join(ROOT, 'projects.html'), galleryHtml);
  console.log('Wrote projects.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
