// Issue-attachment CDN URLs (github.com/user-attachments/... and
// user-images.githubusercontent.com/...) are blob storage, not the API
// proper, so it isn't certain ahead of a real run whether they honor a
// Bearer token the same way api.github.com does. Try authenticated first,
// then fall back to an unauthenticated request, which works for public-repo
// attachments.
export async function fetchImage(url, token) {
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

  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  return Buffer.from(await res.arrayBuffer());
}
