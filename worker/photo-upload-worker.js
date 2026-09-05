// Cloudflare Worker: bridges manage-photos.html into the repo. Unlike
// new-project-worker.js, there is no PDF/Issue pipeline to hand off to here
// -- both actions below commit straight to `main` via the GitHub Contents
// API. Deploy by pasting this whole file into the Cloudflare dashboard's
// Worker Quick Edit (ES-module "Hello World" template) — no build step, no
// deps. Needs its own GITHUB_TOKEN and FORM_PASSPHRASE secrets (the same
// values used by the jk-new-pdf-project-form Worker can be reused).

const OWNER = 'jude-froob';
const REPO_NAME = 'jkbuildsolutions.com.au';
const BRANCH = 'main';
const ALLOWED_ORIGIN = 'https://jude-froob.github.io';
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const MAX_GALLERY_PHOTOS = 10;
const RECENT_PROJECTS_SLOTS = 4;

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

async function handlePost(request, env) {
  const formData = await request.formData();

  if (formData.get('passphrase') !== env.FORM_PASSPHRASE) {
    return json(401, { ok: false, error: 'Incorrect passphrase' });
  }

  const action = (formData.get('action') || '').toString();
  if (action === 'gallery-add') return handleGalleryAdd(formData, env);
  if (action === 'recent-update') return handleRecentUpdate(formData, env);
  return json(400, { ok: false, error: `Unknown action: "${action}"` });
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
