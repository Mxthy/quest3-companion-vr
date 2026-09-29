import type { ContentStudioData } from "./types";

const STORAGE_KEY = "vivi-content-studio-draft-v1";
const HISTORY_KEY = "vivi-content-studio-history-v1";

export type ContentRevision = {
  id: string;
  createdAt: string;
  label: string;
  data: ContentStudioData;
};

export function loadDraft(): ContentStudioData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContentStudioData) : null;
  } catch {
    return null;
  }
}

export function saveDraft(data: ContentStudioData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearDraft() {
  localStorage.removeItem(STORAGE_KEY);
}

export function loadHistory(): ContentRevision[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ContentRevision[]) : [];
  } catch {
    return [];
  }
}

export function createRevision(
  data: ContentStudioData,
  label = "Manual snapshot",
): ContentRevision {
  const revision: ContentRevision = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    label,
    data: structuredClone(data),
  };

  const history = [revision, ...loadHistory()].slice(0, 30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  return revision;
}

export function restoreRevision(revision: ContentRevision) {
  saveDraft(revision.data);
}
