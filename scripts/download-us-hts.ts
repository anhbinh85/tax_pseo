import fs from 'fs';
import path from 'path';
import https from 'https';

// The official API endpoint for the "Current Edition" (may return HTML if SPA is served)
const API_ENDPOINT = 'https://hts.usitc.gov/api/edition/current';
// Fallback: direct USITC JSON URLs (API sometimes returns HTML; data.gov / www.usitc.gov host the files)
const FALLBACK_URLS = [
  'https://www.usitc.gov/sites/default/files/tata/hts/hts_2025_revision_32_json.json',
  'https://www.usitc.gov/sites/default/files/tata/hts/hts_2025_basic_edition_json.json',
  'https://www.usitc.gov/sites/default/files/tata/hts/hts_2024_revision_10_json.json',
];
const OUTPUT_DIR = path.join(process.cwd(), 'Ref', 'hts-ref');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'us-hts.json');

async function getDownloadUrl(): Promise<{ url: string; description: string }> {
  // 1. Try API (hts.usitc.gov sometimes returns HTML for all routes)
  try {
    const metadata = await fetchJson(API_ENDPOINT);
    if (metadata?.links?.json) {
      let url = metadata.links.json;
      if (url.startsWith('/')) url = `https://hts.usitc.gov${url}`;
      return { url, description: metadata.description || 'Current (API)' };
    }
  } catch {
    // API failed or returned HTML
  }

  // 2. Fallback: use known direct USITC JSON URLs (API may serve SPA HTML)
  const label = FALLBACK_URLS[0].includes('2025')
    ? FALLBACK_URLS[0].includes('revision')
      ? '2025 (revision)'
      : '2025 Basic'
    : '2024';
  return { url: FALLBACK_URLS[0], description: `US HTS ${label}` };
}

async function downloadUSData() {
  console.log('🚀 Starting US HTS Auto-Download...');

  console.log(`🔎 Resolving download URL...`);
  const { url: downloadUrl, description } = await getDownloadUrl();
  console.log(`✅ Using: ${description}`);
  console.log(`⬇️ Downloading from: ${downloadUrl}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const file = fs.createWriteStream(OUTPUT_FILE);
  const requestOptions = {
    headers: {
      'User-Agent': 'curl/8.0.0',
      Accept: 'application/json',
    },
  };

  https
    .get(downloadUrl, requestOptions, (response) => {
      if (response.statusCode !== 200) {
        console.error(`❌ Download failed. Status Code: ${response.statusCode}`);
        process.exit(1);
      }

      const totalSize = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;

      response.pipe(file);

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (totalSize) {
          const percent = ((downloaded / totalSize) * 100).toFixed(2);
          process.stdout.write(
            `\r⏳ Progress: ${percent}% (${(downloaded / 1024 / 1024).toFixed(2)} MB)`
          );
        }
      });

      file.on('finish', () => {
        file.close();
        console.log(`\n\n✅ Success! Saved to: ${OUTPUT_FILE}`);
        console.log(`   Next Step: Run 'npm run process-us-data' to integrate it.`);
      });
    })
    .on('error', (err) => {
      fs.unlink(OUTPUT_FILE, () => {});
      console.error(`\n❌ Error downloading file: ${err.message}`);
      process.exit(1);
    });
}

// Helper: Fetch JSON (detect HTML SPA response)
function fetchJson(url: string): Promise<any> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const trimmed = (data || '').trim();
          if (trimmed.startsWith('<')) {
            reject(new Error('API returned HTML'));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error('Failed to parse JSON response'));
          }
        });
      })
      .on('error', reject);
  });
}

downloadUSData();
