import { useEffect } from 'react'
import { useFileStore } from '../store/fileStore'
import { summarizeAPI } from '../utils/api'

export const useAnalysisPolling = (activeDocId, isProcessing) => {
  const { setSummary } = useFileStore()

  useEffect(() => {
    if (!isProcessing || !activeDocId) return

    const pollInterval = setInterval(async () => {
      try {
        const res = await summarizeAPI.get(activeDocId)
        setSummary(res)
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [isProcessing, activeDocId, setSummary])
}
