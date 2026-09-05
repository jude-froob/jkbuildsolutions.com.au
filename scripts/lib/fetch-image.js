function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptFetch(url, token) {
  let res = await fetch(url, {
    redirect: 'follow',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'jkbuildsolutions-project-bot',
    },
  });

  if (res.status === 401 || res.status === 403) {
    res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'jkbuildsolutions-project-bot' },
    });
  }

  return res;
}

// Issue-attachment CDN URLs (github.com/user-attachments/... and
// user-images.githubusercontent.com/...) are blob storage, not the API
// proper, so it isn't certain ahead of a real run whether they honor a
// Bearer token the same way api.github.com does. Try authenticated first,
// then fall back to an unauthenticated request, which works for public-repo
// attachments.
//
// A raw.githubusercontent.com URL (the web-form Worker's staged photos)
// can occasionally 404 for a moment right after the commit that created it,
// so a 404 gets a couple of short retries before giving up.
export async function fetchImage(url, token) {
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await attemptFetch(url, token);
    if (res.status !== 404) break;
    if (attempt < 2) await sleep(500 * (attempt + 1));
  }

  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
