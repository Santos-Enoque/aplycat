import { openDB, DBSchema, IDBPDatabase } from "idb";

const DB_NAME = "AplycatUserDB";
const DB_VERSION = 2;
const IMPROVEMENTS_STORE = "resumeImprovements";

interface AplycatDBSchema extends DBSchema {
  [IMPROVEMENTS_STORE]: {
    key: string;
    value: any;
    indexes: { timestamp: number };
  };
}

let dbPromise: Promise<IDBPDatabase<AplycatDBSchema>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<AplycatDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2 && db.objectStoreNames.contains(IMPROVEMENTS_STORE)) {
          // To fix the schema, we delete the old store if it exists from version 1.
          db.deleteObjectStore(IMPROVEMENTS_STORE);
        }
        if (!db.objectStoreNames.contains(IMPROVEMENTS_STORE)) {
          // And create it fresh with the correct `keyPath` and no `autoIncrement`.
          const store = db.createObjectStore(IMPROVEMENTS_STORE, {
            keyPath: "id",
          });
          store.createIndex("timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function saveImprovement(data: any) {
  const db = await getDB();
  const tx = db.transaction(IMPROVEMENTS_STORE, "readwrite");
  const store = tx.objectStore(IMPROVEMENTS_STORE);
  await store.put(data);
  return tx.done;
}

export async function getImprovements() {
  const db = await getDB();
  const tx = db.transaction(IMPROVEMENTS_STORE, "readonly");
  const store = tx.objectStore(IMPROVEMENTS_STORE);
  const items = await store.getAll();
  // Sort by timestamp descending to get the most recent items
  return items.sort((a, b) => b.timestamp - a.timestamp);
}

export async function getImprovementById(id: string) {
  const db = await getDB();
  const tx = db.transaction(IMPROVEMENTS_STORE, "readonly");
  const store = tx.objectStore(IMPROVEMENTS_STORE);
  return store.get(id);
}

export async function deleteImprovement(id: string) {
  const db = await getDB();
  const tx = db.transaction(IMPROVEMENTS_STORE, "readwrite");
  await tx.objectStore(IMPROVEMENTS_STORE).delete(id);
  return tx.done;
} 