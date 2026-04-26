import { useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { documentAPI, summarizeAPI } from '../utils/api'
import { useFileStore } from '../store/fileStore'

export const useFileUpload = () => {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)
  const { setFiles } = useFileStore()

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    const tid = toast.loading(`Uploading ${file.name}…`)
    try {
      const res = await documentAPI.upload(file)
      try {
        await summarizeAPI.trigger(res.doc_id)
      } catch {}
      toast.success('Uploaded!', { id: tid })
      const updated = await documentAPI.list()
      setFiles(updated.documents || [])
    } catch (err) {
      toast.error(err.message, { id: tid })
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return {
    dragging,
    setDragging,
    uploading,
    inputRef,
    handleFile,
    onDrop
  }
}
