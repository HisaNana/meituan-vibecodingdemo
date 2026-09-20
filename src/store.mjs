import { createInitialState } from "./data.mjs";

export const STORAGE_KEY = "skillswap.v2";
const DB_NAME = "skillswap-files";
const STORE_NAME = "proofs";
const LEGACY_HOMEWORK_STAGES = new Set(["待完成", "待搭子确认", "已确认", "已打卡"]);

export function normalizeState(saved, initial = createInitialState()) {
  const hasLegacyHomework = saved?.assignments?.some((item) => LEGACY_HOMEWORK_STAGES.has(item.status) || !item.partnerName);
  const posts = (saved?.posts || initial.posts || []).filter((post) => !String(post.content || "").includes("已通过搭子确认"));
  return {
    ...initial,
    ...saved,
    assignments: hasLegacyHomework ? initial.assignments : (saved?.assignments || initial.assignments),
    posts
  };
}

export function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved?.version === 2) return normalizeState(saved);
  } catch (error) {
    console.warn("SkillSwap state could not be restored", error);
  }
  return createInitialState();
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function resetState() {
  localStorage.removeItem(STORAGE_KEY);
  return createInitialState();
}

function openFileDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveProofBlob(id, file) {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(file, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getProofBlob(id) {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearProofBlobs() {
  const db = await openFileDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
