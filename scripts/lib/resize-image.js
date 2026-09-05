import sharp from 'sharp';

const MAX_WIDTH = 1600;
const JPEG_QUALITY = 82;

// Submitted photos come straight off a phone/camera (often several MB each).
// Re-encoding to a web-reasonable width and JPEG quality keeps both the
// gallery page and the generated PDF fast to load and the repo from
// ballooning in size over many submissions.
export async function resizeForWeb(buffer) {
  return sharp(buffer)
    .rotate() // apply EXIF orientation before stripping metadata
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toBuffer();
}
