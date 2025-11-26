export interface TranslationItem {
  original: string;
  translated: string;
  description: string;
}

export interface TranslationResponse {
  results: TranslationItem[];
}

export enum InputMode {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: InputMode;
  querySnippet: string; // First few chars of text or "Image Translation"
  results: TranslationItem[];
}
