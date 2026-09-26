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
// The site has moved between hosts before (github.io -> the custom domain),
// and HTTPS enforcement can lag a DNS cutover -- allow-list every origin the
// live site might actually be served from rather than hardcoding one.
const ALLOWED_ORIGINS = new Set([
  'https://jude-froob.github.io',
  'https://jkbuildsolutions.com.au',
  'http://jkbuildsolutions.com.au',
]);
const DEFAULT_ORIGIN = 'https://jkbuildsolutions.com.au';
const MAX_PHOTOS = 8;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const FIXED_TAGS = [
  'Council approved',
  'Engineered',
  'Fully managed',
  'Custom design',
  'Plumbing',
  'Electrical',
  'Earthworks',
  'Driveway',
  'Landscaping',
  'Retaining wall',
];
const REQUIRED_TEXT_FIELDS = [
  ['project-title', 'Project title'],
  ['location', 'Location'],
  ['scope', 'Scope'],
  ['size', 'Size'],
  ['materials', 'Materials'],
  ['duration', 'Duration'],
  ['description', 'Description'],
];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.has(origin) ? origin : DEFAULT_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(status, body, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
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

async function handlePost(request, env, origin) {
  const formData = await request.formData();

  if (formData.get('passphrase') !== env.FORM_PASSPHRASE) {
    return json(401, { ok: false, error: 'Incorrect passphrase' }, origin);
  }

  const fields = {};
  const missing = [];
  for (const [name, label] of REQUIRED_TEXT_FIELDS) {
    const value = (formData.get(name) || '').toString().trim();
    if (!value) missing.push(label);
    fields[name] = value;
  }
  if (missing.length > 0) {
    return json(400, { ok: false, error: `Missing required field(s): ${missing.join(', ')}` }, origin);
  }

  const checkedTags = new Set(formData.getAll('tags').map(String));
  const tagsOther = (formData.get('tags-other') || '').toString().trim();

  const photos = formData.getAll('photos').filter((p) => p instanceof File);
  if (photos.length === 0) {
    return json(400, { ok: false, error: 'Please attach at least one photo' }, origin);
  }
  if (photos.length > MAX_PHOTOS) {
    return json(400, { ok: false, error: `Please attach at most ${MAX_PHOTOS} photos` }, origin);
  }
  for (const file of photos) {
    if (!file.type.startsWith('image/')) {
      return json(400, { ok: false, error: `"${file.name}" is not an image` }, origin);
    }
    if (file.size > MAX_PHOTO_BYTES) {
      return json(400, { ok: false, error: `"${file.name}" is too large` }, origin);
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
      return json(502, { ok: false, error: `Failed to stage photo ${i + 1}: ${res.status}` }, origin);
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
    return json(502, { ok: false, error: `Failed to create issue: ${issueRes.status}` }, origin);
  }
  const issue = await issueRes.json();

  return json(201, { ok: true, issueNumber: issue.number, issueUrl: issue.html_url }, origin);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'POST') {
      return json(405, { ok: false, error: 'Method not allowed' }, origin);
    }
    try {
      return await handlePost(request, env, origin);
    } catch (err) {
      return json(500, { ok: false, error: err.message }, origin);
    }
  },
};
