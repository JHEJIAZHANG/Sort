"use client"

import { useRef, useState, useId } from "react"
import { Button } from "@/components/ui/button"
import { Upload } from "lucide-react"
import { OCRPreviewModal } from "@/components/ocr-preview-modal"
import type { OCRPreviewData, OCRCourse } from "@/contexts/ocr-context"
import { ApiService } from "@/services/apiService"

interface TeacherOCRImportButtonProps {
  onImportComplete?: () => void
}

export function TeacherOCRImportButton({ onImportComplete }: TeacherOCRImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<OCRPreviewData | null>(null)
  const [confirming, setConfirming] = useState(false)
  const inputId = useId()

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const response = await ApiService.teacherOcrPreview(file)
      if (response.error) {
        console.error("[Teacher OCR] 預覽失敗:", response.error)
        alert(response.error || "OCR 預覽失敗")
        return
      }
      if (response.data) {
        setPreviewData(response.data as OCRPreviewData)
        setPreviewOpen(true)
      } else {
        alert("未能從圖片中識別到課程資訊，請確認圖片清晰度")
      }
    } catch (error) {
      console.error("[Teacher OCR] 預覽過程發生錯誤:", error)
      alert("OCR 預覽過程發生錯誤，請稍後再試")
    } finally {
      setUploading(false)
      if (event.target) {
        event.target.value = ""
      }
    }
  }

  const handleConfirm = async (selectedCourses: OCRCourse[]) => {
    if (selectedCourses.length === 0) {
      alert("請至少選擇一堂課程")
      return
    }
    setConfirming(true)
    try {
      const response = await ApiService.teacherOcrConfirm(selectedCourses, { autoCreateClassroom: true })
      if (response.error) {
        console.error("[Teacher OCR] 匯入失敗:", response.error)
        alert(response.error || "匯入失敗，請稍後再試")
        return
      }
      const summary = (response.data as any) || {}
      const createdCount = summary.courses_created ?? summary.coursesCreated ?? selectedCourses.length
      alert(`成功匯入 ${createdCount} 個 Classroom 課程！`)
      setPreviewOpen(false)
      setPreviewData(null)
      onImportComplete?.()
    } catch (error) {
      console.error("[Teacher OCR] 確認匯入過程發生錯誤:", error)
      alert("匯入過程發生錯誤，請稍後再試")
    } finally {
      setConfirming(false)
    }
  }

  return (
    <>
      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={uploading || confirming}
      />
      <Button
        asChild
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={uploading || confirming}
      >
        <label
          htmlFor={inputId}
          className={`flex items-center gap-2 ${uploading || confirming ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          onClick={(event) => {
            if (uploading || confirming) {
              event.preventDefault()
            }
          }}
        >
          <Upload className="w-4 h-4" />
          {uploading ? "掃描中..." : "OCR 匯入課程"}
        </label>
      </Button>

      <OCRPreviewModal
        isOpen={previewOpen}
        onClose={() => {
          if (confirming) return
          setPreviewOpen(false)
          setPreviewData(null)
        }}
        data={previewData}
        onConfirm={handleConfirm}
        loading={confirming}
      />
    </>
  )
}


