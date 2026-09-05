export function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function uniqueSlug(base, existingSlugs) {
  if (!existingSlugs.includes(base)) return base;
  let n = 2;
  while (existingSlugs.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}
