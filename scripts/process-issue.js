import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseIssueBody, parseCheckedTags, parseFreeTags, extractImageUrls, looksLikeImageMarkup } from './lib/parse-issue.js';
import { fetchImage } from './lib/fetch-image.js';
import { resizeForWeb } from './lib/resize-image.js';
import { slugify, uniqueSlug } from './lib/slug.js';
import { renderProjectSheetHtml, renderPdf } from './render-project-sheet.js';
import { generateGalleryHtml } from './generate-gallery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

async function fetchIssue(repo, issueNumber, token) {
  const res = await fetch(`https://api.github.com/repos/${repo}/issues/${issueNumber}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'jkbuildsolutions-project-bot',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch issue #${issueNumber}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function loadProjects() {
  const raw = await readFile(path.join(ROOT, 'data', 'projects.json'), 'utf8');
  return JSON.parse(raw);
}

async function main() {
  const { GITHUB_TOKEN, ISSUE_NUMBER, REPO } = process.env;
  if (!GITHUB_TOKEN || !ISSUE_NUMBER || !REPO) {
    throw new Error('GITHUB_TOKEN, ISSUE_NUMBER, and REPO must be set');
  }

  const issue = await fetchIssue(REPO, ISSUE_NUMBER, GITHUB_TOKEN);
  const fields = parseIssueBody(issue.body || '');

  const tags = [...parseCheckedTags(fields['Tags']), ...parseFreeTags(fields['Additional tags'])];
  const photoUrls = extractImageUrls(fields['Project Photos']);
  if (photoUrls.length === 0) {
    throw new Error('No photos found in the "Project Photos" field');
  }
  if (looksLikeImageMarkup(fields['Description'])) {
    throw new Error(
      'The "Description" field looks like it has a photo dropped into it instead of a written description. Please open a new issue with photos only in the "Project Photos" box, and a plain-text description.'
    );
  }

  const projects = await loadProjects();
  const slug = uniqueSlug(slugify(fields['Project title']), projects.map((p) => p.slug));

  const photosDir = path.join(ROOT, 'photos', 'projects', slug);
  await mkdir(photosDir, { recursive: true });

  const photoRelPaths = [];
  const photoAbsPaths = [];
  for (let i = 0; i < photoUrls.length; i++) {
    const rawBuffer = await fetchImage(photoUrls[i], GITHUB_TOKEN);
    const buffer = await resizeForWeb(rawBuffer);
    const filename = `photo-${i + 1}.jpg`;
    const absPath = path.join(photosDir, filename);
    await writeFile(absPath, buffer);
    photoAbsPaths.push(absPath);
    photoRelPaths.push(`photos/projects/${slug}/${filename}`);
  }

  const pdfRelPath = `project-sheets/${slug}.pdf`;
  const record = {
    slug,
    title: fields['Project title'],
    location: fields['Location'],
    scope: fields['Scope'],
    size: fields['Size'],
    materials: fields['Materials'],
    duration: fields['Duration'],
    description: fields['Description'],
    tags,
    photos: photoRelPaths,
    pdf: pdfRelPath,
    issueNumber: Number(ISSUE_NUMBER),
    submittedAt: new Date().toISOString(),
  };

  const logoPath = path.join(ROOT, 'Logo', 'logo-white-no-bg.png');
  const sheetHtml = await renderProjectSheetHtml({ ...record, photoAbsPaths }, { logoPath });

  const pdfAbsPath = path.join(ROOT, pdfRelPath);
  await mkdir(path.dirname(pdfAbsPath), { recursive: true });
  await renderPdf(sheetHtml, pdfAbsPath);

  projects.push(record);
  await writeFile(path.join(ROOT, 'data', 'projects.json'), JSON.stringify(projects, null, 2) + '\n');

  const galleryHtml = await generateGalleryHtml(projects);
  await writeFile(path.join(ROOT, 'projects.html'), galleryHtml);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    await writeFile(githubOutput, `slug=${slug}\ntitle=${record.title}\n`, { flag: 'a' });
  }

  console.log(`Published project "${record.title}" as ${slug}`);
}

main().catch(async (err) => {
  console.error(err.message);
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    const delimiter = `EOF_${Date.now()}`;
    await writeFile(githubOutput, `error<<${delimiter}\n${err.message}\n${delimiter}\n`, { flag: 'a' });
  }
  process.exit(1);
});
