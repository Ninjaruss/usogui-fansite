import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const API_BASE = 'https://usogui.fandom.com/api.php';

function writeJson(relPath: string, data: any) {
  const outPath = path.resolve(__dirname, '..', 'data', relPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf8');
}

function readJson<T>(relPath: string): T | null {
  const p = path.resolve(__dirname, '..', 'data', relPath);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as T;
}

async function apiGet(params: Record<string, string>) {
  const url = new URL(API_BASE);
  params.format = 'json';
  for (const [k, v] of Object.entries(params)) url.searchParams.append(k, v);
  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': 'l-file-seeder/1.0' },
  });
  if (!res.ok)
    throw new Error(`API request failed: ${res.status} ${res.statusText}`);
  return res.json();
}

async function findCoverForTitle(title: string): Promise<string | null> {
  // Try pageimages first
  try {
    const q = await apiGet({
      action: 'query',
      titles: title,
      prop: 'pageimages',
      pithumbsize: '1000',
    });
    if (q && q.query && q.query.pages) {
      const pages = q.query.pages;
      for (const pid of Object.keys(pages)) {
        const page = pages[pid];
        if (page && page.thumbnail && page.thumbnail.source)
          return page.thumbnail.source;
      }
    }
  } catch (err) {
    // continue to next method
  }

  // Try listing images on the page and retrieving imageinfo URLs
  try {
    const q2 = await apiGet({
      action: 'query',
      titles: title,
      prop: 'images',
      imlimit: '50',
    });
    if (q2 && q2.query && q2.query.pages) {
      const pages = q2.query.pages;
      for (const pid of Object.keys(pages)) {
        const page = pages[pid];
        if (page && page.images) {
          for (const img of page.images as Array<any>) {
            const imageTitle = img.title; // e.g., File:Cover.jpg
            try {
              const info = await apiGet({
                action: 'query',
                titles: imageTitle,
                prop: 'imageinfo',
                iiprop: 'url',
              });
              if (info && info.query && info.query.pages) {
                for (const ipid of Object.keys(info.query.pages)) {
                  const ipage = info.query.pages[ipid];
                  if (
                    ipage &&
                    ipage.imageinfo &&
                    ipage.imageinfo[0] &&
                    ipage.imageinfo[0].url
                  ) {
                    return ipage.imageinfo[0].url;
                  }
                }
              }
            } catch (err) {
              // ignore image-level failures
            }
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }

  return null;
}

async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function run() {
  const volumes = readJson<Array<any>>('volumes.json');
  if (!volumes) {
    console.error('volumes.json not found in server/src/database/data/');
    process.exit(1);
  }

  console.log(
    `Loaded ${volumes.length} volumes; checking for missing coverUrl...`,
  );

  for (const v of volumes) {
    if (v.coverUrl) continue; // already present

    // Build search queries to find likely volume page
    const queries = [
      `Usogui Volume ${v.number}`,
      `Volume ${v.number} Usogui`,
      `Usogui (manga) volume ${v.number}`,
      `Usogui volume ${v.number} cover`,
      `Volume ${v.number}`,
    ];

    let foundUrl: string | null = null;
    for (const q of queries) {
      try {
        const search = await apiGet({
          action: 'query',
          list: 'search',
          srsearch: q,
          srlimit: '5',
        });
        await sleep(200); // be gentle
        if (
          search &&
          search.query &&
          search.query.search &&
          search.query.search.length > 0
        ) {
          // prefer result that contains the word 'Volume' or has 'volume' in title
          const first = search.query.search[0];
          const title = first.title as string;
          // try to get cover from this title
          const candidate = await findCoverForTitle(title);
          if (candidate) {
            foundUrl = candidate;
            break;
          }
        }
      } catch (err) {
        // ignore and continue
      }
    }

    if (!foundUrl) {
      // As a last resort, try the List of Chapters page to find an image with "Volume N" in nearby text.
      // This is intentionally minimal; the earlier scraper already tried heuristics.
    }

    if (foundUrl) {
      console.log(`Volume ${v.number}: found cover ${foundUrl}`);
      v.coverUrl = foundUrl;
      // be gentle to API
      await sleep(250);
    } else {
      console.log(`Volume ${v.number}: no cover found`);
    }
  }

  writeJson('volumes.json', volumes);
  console.log('Wrote updated volumes.json');
}

run().catch((err) => {
  console.error('Error in API scraper:', err);
  process.exit(1);
});
