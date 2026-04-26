import { useEffect, useRef, useState } from 'react'
import { fetchFileAsBlob } from '../utils/api'

export const useDocumentFetch = (docId, filename) => {
  const [blobUrl, setBlobUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fileType, setFileType] = useState(null)
  const prevUrl = useRef(null)

  useEffect(() => {
    if (!docId) {
      setBlobUrl(null)
      setError(null)
      return
    }

    if (prevUrl.current) {
      URL.revokeObjectURL(prevUrl.current)
      prevUrl.current = null
    }

    const ext = filename?.split('.').pop()?.toLowerCase()
    setFileType(ext)
    setLoading(true)
    setError(null)

    fetchFileAsBlob(docId)
      .then(blob => {
        const url = URL.createObjectURL(blob)
        prevUrl.current = url
        setBlobUrl(url)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

    return () => {
      if (prevUrl.current) {
        URL.revokeObjectURL(prevUrl.current)
        prevUrl.current = null
      }
    }
  }, [docId, filename])

  return {
    blobUrl,
    loading,
    error,
    fileType
  }
}
