import { create } from 'zustand'
export const useFileStore = create((set) => ({
  files: [],
  activeDocId: null,
  summaryData: null,
  setFiles: (files) => set({ files }),
  setActive: (docId, summaryData = null) => set({ activeDocId: docId, summaryData }),
  setSummary: (data) => set({ summaryData: data }),
  clearActive: () => set({ activeDocId: null, summaryData: null }),
}))
