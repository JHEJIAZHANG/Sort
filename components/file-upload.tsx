"use client"

import type React from "react"
import { useRef, useState } from "react"
import { Button } from "./ui/button"
import { PaperclipIcon, XIcon } from "@/components/icons"
import { ApiService } from "@/services/apiService"

interface FileAttachment {
  id: string
  name: string
  size: number
  type: string
  url: string
}

interface FileUploadProps {
  attachments: FileAttachment[]
  onAttachmentsChange: (attachments: FileAttachment[]) => void
  maxFiles?: number
  maxSize?: number // in MB
}

export function FileUpload({ attachments, onAttachmentsChange, maxFiles = 5, maxSize = 10 }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Check file count limit
    if (attachments.length + files.length > maxFiles) {
      alert(`最多只能上傳 ${maxFiles} 個檔案`)
      return
    }

    setUploading(true)

    try {
      const newAttachments: FileAttachment[] = []

      for (const file of files) {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          alert(`檔案 "${file.name}" 超過 ${maxSize}MB 限制`)
          continue
        }

        try {
          // 使用 API 上傳檔案（若外層已知 noteId，可改為傳入 extra）
          const response = await ApiService.uploadFile(file)
          
          if (response.error) {
            throw new Error(response.error)
          }

          if (response.data) {
            const attachment: FileAttachment = {
              id: (response.data as any).id.toString(),
              name: (response.data as any).name || file.name,
              size: (response.data as any).size || file.size,
              type: (response.data as any).type || file.type,
              url: (response.data as any).url || (response.data as any).file_url,
            }
            newAttachments.push(attachment)
          }
        } catch (apiError) {
          console.error("API upload failed, using local fallback:", apiError)
          // 如果 API 上傳失敗，使用本地 blob URL 作為備用方案
          const url = URL.createObjectURL(file)
          const attachment: FileAttachment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            url: url,
          }
          newAttachments.push(attachment)
        }
      }

      onAttachmentsChange([...attachments, ...newAttachments])
    } catch (error) {
      console.error("File upload error:", error)
      alert("檔案上傳失敗")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const removeAttachment = (id: string) => {
    const attachment = attachments.find((a) => a.id === id)
    if (attachment) {
      URL.revokeObjectURL(attachment.url)
    }
    onAttachmentsChange(attachments.filter((a) => a.id !== id))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || attachments.length >= maxFiles}
          className="flex items-center gap-2"
        >
          <PaperclipIcon className="h-4 w-4" />
          {uploading ? "上傳中..." : "附加檔案"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {attachments.length}/{maxFiles} 個檔案
        </span>
      </div>

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} accept="*/*" />

      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div key={attachment.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {attachment.type?.startsWith('image/') ? (
                  <img src={`${ApiService.backendOrigin}${attachment.url}`} alt={attachment.name} className="h-10 w-10 object-cover rounded" />
                ) : (
                  <PaperclipIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeAttachment(attachment.id)}
                className="flex-shrink-0"
              >
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
