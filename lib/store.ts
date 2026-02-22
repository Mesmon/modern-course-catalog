import fs from 'fs/promises';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'data', 'store.json');

async function ensureStore() {
  const dir = path.dirname(STORE_PATH);
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
  try {
    await fs.access(STORE_PATH);
  } catch {
    await fs.writeFile(STORE_PATH, JSON.stringify({ courses: {}, lists: {} }));
  }
}

export async function saveToStore(key: string, data: any, type: 'course' | 'list' = 'course') {
  await ensureStore();
  const content = JSON.parse(await fs.readFile(STORE_PATH, 'utf-8'));
  if (type === 'course') {
    content.courses[key] = data;
  } else {
    content.lists[key] = data;
  }
  await fs.writeFile(STORE_PATH, JSON.stringify(content, null, 2));
}

export async function getFromStore(key: string, type: 'course' | 'list' = 'course') {
  await ensureStore();
  const content = JSON.parse(await fs.readFile(STORE_PATH, 'utf-8'));
  return type === 'course' ? content.courses[key] : content.lists[key];
}
