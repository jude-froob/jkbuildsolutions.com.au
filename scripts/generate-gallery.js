import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderGroup(project) {
  const photos = project.photos
    .map(
      (src) =>
        `<div class="row-wrap" style="flex: 1; height:100%;"><img class="row-img" src="${escapeHtml(
          src
        )}" alt="${escapeHtml(project.title)}" style="width:100%; height:100%; object-fit:cover; display:block;"></div>`
    )
    .join('\n      ');

  return `
  <div style="padding: 0 64px 56px; max-width: 1280px; margin: 0 auto;">
    <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom: 16px;">
      <h2 class="h-serif" id="${escapeHtml(project.slug)}" style="font-size: 22px; font-weight: 500; font-style: italic; margin: 0;">${escapeHtml(
    project.title
  )}</h2>
      <a href="${escapeHtml(project.pdf)}" style="font-size: 13px; border-bottom: 1px solid oklch(50% 0.14 40);">View project &amp; download PDF</a>
    </div>
    <div style="display:flex; flex-wrap:wrap; gap: 12px; height: 340px;">
      ${photos}
    </div>
  </div>`;
}

export async function generateGalleryHtml(projects) {
  const templatePath = path.join(__dirname, 'templates', 'projects-page.html');
  const template = await readFile(templatePath, 'utf8');

  const sorted = [...projects].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
  );
  const groupsHtml = sorted.map(renderGroup).join('\n');

  return template.replace('{{PROJECT_GROUPS_HTML}}', groupsHtml);
}
