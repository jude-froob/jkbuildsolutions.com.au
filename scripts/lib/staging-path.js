const RAW_URL_RE = /^https:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/;

// Maps a raw.githubusercontent.com URL back to its repo-relative path, but
// only if it points at THIS repo/branch and lives under photos/_incoming/ —
// the web-form Worker's staging area. Returns null for anything else (e.g.
// the github.com/user-attachments URLs from issue-UI submissions), so those
// are left untouched.
export function stagingPathFromUrl(url, repo, branch = 'main') {
  const match = RAW_URL_RE.exec(url);
  if (!match) return null;
  const [, owner, repoName, urlBranch, filePath] = match;
  if (`${owner}/${repoName}` !== repo || urlBranch !== branch) return null;
  if (!filePath.startsWith('photos/_incoming/')) return null;
  return filePath;
}
