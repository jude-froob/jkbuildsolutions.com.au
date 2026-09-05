// Cloudflare Worker: bridges the public submit-project.html form into the
// existing GitHub Issue automation pipeline, unchanged. It does the minimum
// needed to recreate what the GitHub Issue Form + drag-and-drop would have
// produced: stage each photo into the repo, then open an issue whose body
// exactly matches the format scripts/lib/parse-issue.js already expects.
// Deploy by pasting this whole file into the Cloudflare dashboard's Worker
// Quick Edit (ES-module "Hello World" template) — no build step, no deps.

const OWNER = 'jude-froob';
const REPO_NAME = 'jkbuildsolutions.com.au';
const BRANCH = 'main';
const ALLOWED_ORIGIN = 'https://jude-froob.github.io';
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 10;
const RECENT_PROJECTS_SLOTS = 4;
const FIXED_TAGS = ['Council approved', 'Engineered', 'Fully managed', 'Custom design'];
const REQUIRED_TEXT_FIELDS = [
  ['project-title', 'Project title'],
  ['location', 'Location'],
  ['scope', 'Scope'],
  ['size', 'Size'],
  ['materials', 'Materials'],
  ['duration', 'Duration'],
  ['description', 'Description'],
];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

// Never spread a whole Uint8Array as call args (String.fromCharCode(...bytes))
// — throws past roughly 100KB. Chunking keeps this safe for multi-hundred-KB
// photos.
function arrayBufferToBase64(bytes) {
  const CHUNK = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function githubApi(env, path, init = {}) {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'jkbuildsolutions-form-worker',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
}

function heading(label, value) {
  return `### ${label}\n\n${value}\n\n`;
}

// Exported (alongside the default export Cloudflare actually uses) purely so
// this pure formatting logic can be unit-tested in Node against the real
// parser in scripts/lib/parse-issue.js. Harmless extra export for Cloudflare
// — it only looks at `export default`.
export function buildIssueBody({ fields, checkedTags, tagsOther, photoUrls }) {
  const tagsBlock = FIXED_TAGS.map((t) => `- [${checkedTags.has(t) ? 'x' : ' '}] ${t}`).join('\n');
  const photosBlock = photoUrls.map((u) => `![photo](${u})`).join('\n');
  return (
    heading('Project title', fields['project-title']) +
    heading('Location', fields['location']) +
    heading('Scope', fields['scope']) +
    heading('Size', fields['size']) +
    heading('Materials', fields['materials']) +
    heading('Duration', fields['duration']) +
    heading('Description', fields['description']) +
    heading('Tags', tagsBlock) +
    heading('Additional tags', tagsOther || '') +
    heading('Project Photos', photosBlock)
  );
}

async function getJsonFile(env, path) {
  const res = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`);
  if (res.status === 404) return { sha: null, content: null };
  if (!res.ok) throw new Error(`Failed to read ${path}: ${res.status}`);
  const data = await res.json();
  const content = JSON.parse(atob(data.content.replace(/\n/g, '')));
  return { sha: data.sha, content };
}

async function putJsonFile(env, path, content, sha, message) {
  const bytes = new TextEncoder().encode(JSON.stringify(content, null, 2) + '\n');
  const res = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: arrayBufferToBase64(bytes),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Failed to update ${path}: ${res.status}`);
}

async function putPhotoFile(env, path, file, message) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const existing = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/contents/${path}?ref=${BRANCH}`);
  const sha = existing.ok ? (await existing.json()).sha : undefined;
  const res = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/contents/${path}`, {
    method: 'PUT',
    body: JSON.stringify({
      message,
      content: arrayBufferToBase64(bytes),
      branch: BRANCH,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Failed to upload photo to ${path}: ${res.status}`);
}

async function handleGalleryAdd(formData, env) {
  const photos = formData.getAll('photos').filter((p) => p instanceof File);
  const alts = formData.getAll('alts').map(String);

  if (photos.length === 0) {
    return json(400, { ok: false, error: 'Please attach at least one photo' });
  }
  if (photos.length > MAX_GALLERY_PHOTOS) {
    return json(400, { ok: false, error: `Please attach at most ${MAX_GALLERY_PHOTOS} photos` });
  }
  for (const file of photos) {
    if (!file.type.startsWith('image/')) {
      return json(400, { ok: false, error: `"${file.name}" is not an image` });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return json(400, { ok: false, error: `"${file.name}" is too large` });
    }
  }

  const { sha, content } = await getJsonFile(env, 'data/gallery.json');
  const gallery = content || [];

  const uuid = crypto.randomUUID();
  for (let i = 0; i < photos.length; i++) {
    const path = `assets/gallery/${uuid}-${i + 1}.jpg`;
    await putPhotoFile(env, path, photos[i], 'Add photo to gallery');
    gallery.push({ src: path, alt: alts[i] || '' });
  }

  await putJsonFile(env, 'data/gallery.json', gallery, sha, `Add ${photos.length} photo(s) to gallery`);
  return json(201, { ok: true, added: photos.length });
}

async function handleRecentUpdate(formData, env) {
  const { sha, content } = await getJsonFile(env, 'data/recent-projects.json');
  const current = Array.isArray(content) ? content : [];

  const slots = [];
  for (let i = 0; i < RECENT_PROJECTS_SLOTS; i++) {
    const caption = (formData.get(`slot-${i}-caption`) || '').toString().trim();
    const deleted = formData.get(`slot-${i}-delete`) === 'true';
    const file = formData.get(`slot-${i}-photo`);
    const existing = current[i] || null;

    if (file instanceof File) {
      if (!file.type.startsWith('image/')) {
        return json(400, { ok: false, error: `Slot ${i + 1} photo is not an image` });
      }
      if (file.size > MAX_PHOTO_BYTES) {
        return json(400, { ok: false, error: `Slot ${i + 1} photo is too large` });
      }
      const path = `assets/home/recent-${i + 1}.jpg`;
      await putPhotoFile(env, path, file, `Update recent-projects photo ${i + 1}`);
      slots.push({ src: path, alt: caption, caption });
      continue;
    }

    if (deleted || !existing) {
      slots.push(null);
      continue;
    }

    slots.push({ ...existing, caption });
  }

  await putJsonFile(env, 'data/recent-projects.json', slots, sha, 'Update recent projects photos');
  return json(200, { ok: true, slots });
}

async function handleNewProject(formData, env) {
  const fields = {};
  const missing = [];
  for (const [name, label] of REQUIRED_TEXT_FIELDS) {
    const value = (formData.get(name) || '').toString().trim();
    if (!value) missing.push(label);
    fields[name] = value;
  }
  if (missing.length > 0) {
    return json(400, { ok: false, error: `Missing required field(s): ${missing.join(', ')}` });
  }

  const checkedTags = new Set(formData.getAll('tags').map(String));
  const tagsOther = (formData.get('tags-other') || '').toString().trim();

  const photos = formData.getAll('photos').filter((p) => p instanceof File);
  if (photos.length === 0) {
    return json(400, { ok: false, error: 'Please attach at least one photo' });
  }
  if (photos.length > MAX_PHOTOS) {
    return json(400, { ok: false, error: `Please attach at most ${MAX_PHOTOS} photos` });
  }
  for (const file of photos) {
    if (!file.type.startsWith('image/')) {
      return json(400, { ok: false, error: `"${file.name}" is not an image` });
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return json(400, { ok: false, error: `"${file.name}" is too large` });
    }
  }

  const uuid = crypto.randomUUID();
  const photoUrls = [];

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const bytes = new Uint8Array(await file.arrayBuffer());
    const filePath = `photos/_incoming/${uuid}/photo-${i + 1}.jpg`;

    const res = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/contents/${filePath}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Stage photo for new project submission',
        content: arrayBufferToBase64(bytes),
        branch: BRANCH,
      }),
    });
    if (!res.ok) {
      return json(502, { ok: false, error: `Failed to stage photo ${i + 1}: ${res.status}` });
    }
    photoUrls.push(`https://raw.githubusercontent.com/${OWNER}/${REPO_NAME}/${BRANCH}/${filePath}`);
  }

  const issueRes = await githubApi(env, `/repos/${OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title: `[New Project]: ${fields['project-title']}`,
      body: buildIssueBody({ fields, checkedTags, tagsOther, photoUrls }),
      labels: ['new-project'],
    }),
  });
  if (!issueRes.ok) {
    return json(502, { ok: false, error: `Failed to create issue: ${issueRes.status}` });
  }
  const issue = await issueRes.json();

  return json(201, { ok: true, issueNumber: issue.number, issueUrl: issue.html_url });
}

async function handlePost(request, env) {
  const formData = await request.formData();

  if (formData.get('passphrase') !== env.FORM_PASSPHRASE) {
    return json(401, { ok: false, error: 'Incorrect passphrase' });
  }

  const action = (formData.get('action') || 'new-project').toString();
  if (action === 'gallery-add') return handleGalleryAdd(formData, env);
  if (action === 'recent-update') return handleRecentUpdate(formData, env);
  return handleNewProject(formData, env);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' });
    }
    try {
      return await handlePost(request, env);
    } catch (err) {
      return json(500, { ok: false, error: err.message });
    }
  },
};
