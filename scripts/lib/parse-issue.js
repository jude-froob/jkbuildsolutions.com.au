// GitHub issue forms render each field as "### <label>\n\n<value>\n\n" in
// the issue body, in field order. This splits on that heading boundary and
// keys the result by the exact label text, so field reordering in the YAML
// template doesn't break lookups (only renaming a label would).
export function parseIssueBody(body) {
  const chunks = body.split(/\r?\n(?=### )/).filter((c) => c.startsWith('### '));
  const fields = {};
  for (const chunk of chunks) {
    const newlineIdx = chunk.indexOf('\n');
    const heading = chunk.slice(4, newlineIdx === -1 ? undefined : newlineIdx).trim();
    let value = newlineIdx === -1 ? '' : chunk.slice(newlineIdx + 1).trim();
    if (value === '_No response_') value = '';
    fields[heading] = value;
  }
  return fields;
}

export function parseCheckedTags(tagsValue) {
  if (!tagsValue) return [];
  return [...tagsValue.matchAll(/^- \[[xX]\]\s+(.+)$/gm)].map((m) => m[1].trim());
}

export function parseFreeTags(tagsOtherValue) {
  if (!tagsOtherValue) return [];
  return tagsOtherValue
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Scoped to a single field's value (the "Project Photos" textarea), not the
// whole issue body. Matches both github.com/user-attachments/... and legacy
// user-images.githubusercontent.com/... URLs, since both appear as plain
// https:// URLs inside standard markdown image syntax.
export function extractImageUrls(photosValue) {
  if (!photosValue) return [];
  return [...photosValue.matchAll(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/g)].map((m) => m[1]);
}
