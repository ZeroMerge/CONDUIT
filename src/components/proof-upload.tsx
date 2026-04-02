"use client"

import { useState, useRef } from 'react'
import { Upload, Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface ProofUploadProps {
  onUpload: (url: string) => void
  onRemove: () => void
  uploadedUrl: string | null
}

type UploadState = 'idle' | 'uploading' | 'done'

export function ProofUpload({ onUpload, onRemove, uploadedUrl }: ProofUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>(uploadedUrl ? 'done' : 'idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setFileName(file.name)
    setUploadState('uploading')
    setProgress(30) // Show initial progress

    try {
      // 1. Create a unique file name
      const fileExt = file.name.split('.').pop()
      const uniqueName = `${crypto.randomUUID()}.${fileExt}`
      const filePath = `${uniqueName}`

      // 2. Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from('proof-images')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 3. Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('proof-images')
        .getPublicUrl(filePath)

      setProgress(100)
      setUploadState('done')
      onUpload(publicUrl) // Pass the real URL back to the form

    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadState('idle')
      alert('Failed to upload image. Please try again.')
    }
  }

  const handleRemove = () => {
    setUploadState('idle')
    setProgress(0)
    setFileName('')
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    onRemove()
  }

  if (uploadState === 'idle') {
    return (
      <button
        onClick={handleClick}
        className="w-full border-2 border-dashed border-[var(--border)] rounded p-8 text-center hover:border-[var(--border-strong)] transition-colors duration-150"
      >
        <Upload className="h-6 w-6 mx-auto text-[var(--text-tertiary)]" />
        <p className="text-sm text-[var(--text-tertiary)] mt-2">
          Upload a screenshot of your result
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          PNG, JPG up to 5MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </button>
    )
  }

  if (uploadState === 'uploading') {
    return (
      <div className="w-full border-2 border-dashed border-[var(--border)] rounded p-8 text-center">
        <Loader2 className="h-6 w-6 mx-auto text-[var(--text-secondary)] animate-spin" />
        <p className="text-sm text-[var(--text-secondary)] mt-2">Uploading&hellip;</p>
        <div className="h-1 bg-[var(--border)] rounded mt-3 max-w-[200px] mx-auto">
          <div
            className="h-full bg-[var(--accent)] transition-all duration-150 rounded"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">{progress}%</p>
      </div>
    )
  }

  return (
    <div className="border border-[var(--border)] rounded overflow-hidden">
      <img
        src={uploadedUrl || ''}
        alt="Proof"
        className="w-full max-h-48 object-cover"
      />
      <div className="flex justify-between items-center p-3 bg-[var(--bg-secondary)]">
        <span className="text-sm text-[var(--text-secondary)] truncate max-w-[200px]">
          {fileName || 'proof-image.png'}
        </span>
        <button
          onClick={handleRemove}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--risky)] transition-colors duration-150"
        >
          <X className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  )
}
