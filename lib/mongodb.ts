import { Db, MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;

const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 2500,
  connectTimeoutMS: 5000,
};

type GlobalMongoState = typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoUnavailableUntil?: number;
  _mongoIndexesEnsured?: boolean;
};

const globalWithMongo = globalThis as GlobalMongoState;

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    return Promise.reject(new Error('Invalid/Missing environment variable: "MONGODB_URI"'));
  }
  if (!globalWithMongo._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    const p = client.connect().catch((err) => {
      // Clear cached failed promise so future attempts after cooldown can reconnect
      globalWithMongo._mongoClientPromise = undefined;
      throw err;
    });
    // Prevent unhandled rejection warning when consumers only await on demand
    p.catch(() => {});
    globalWithMongo._mongoClientPromise = p;
  }
  return globalWithMongo._mongoClientPromise;
}

const clientPromise: Promise<MongoClient> = uri
  ? createClientPromise()
  : (() => {
      const p = Promise.reject<MongoClient>(
        new Error('Invalid/Missing environment variable: "MONGODB_URI"')
      );
      p.catch(() => {});
      return p;
    })();

async function ensureCatalogIndexes(db: Db) {
  if (globalWithMongo._mongoIndexesEnsured) return;
  globalWithMongo._mongoIndexesEnsured = true;
  try {
    await Promise.all([
      db.collection('courses').createIndex({ id: 1 }, { background: true }),
      db
        .collection('course_details')
        .createIndex({ id: 1, year: 1, semester: 1 }, { background: true }),
      db
        .collection('course_details')
        .createIndex({ 'relatedCourses.id': 1 }, { background: true }),
      db.collection('user_profiles').createIndex({ email: 1 }, { background: true }),
    ]);
  } catch {
    // Non-fatal (e.g. read-only credentials); queries still succeed
  }
}

const DB_RETRY_COOLDOWN_MS = 30_000;

/**
 * Returns the connected `course_catalog` database, or `null` immediately
 * when MongoDB is unconfigured or temporarily unreachable (enabling fast
 * offline/in-memory fallback without 5s timeouts on every request).
 */
export async function getCatalogDb(): Promise<Db | null> {
  if (!uri) return null;
  const now = Date.now();
  if (globalWithMongo._mongoUnavailableUntil && now < globalWithMongo._mongoUnavailableUntil) {
    return null;
  }

  try {
    const client = await createClientPromise();
    globalWithMongo._mongoUnavailableUntil = undefined;
    const db = client.db('course_catalog');
    void ensureCatalogIndexes(db);
    return db;
  } catch {
    globalWithMongo._mongoUnavailableUntil = Date.now() + DB_RETRY_COOLDOWN_MS;
    return null;
  }
}

export default clientPromise;
