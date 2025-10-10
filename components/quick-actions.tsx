"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PlusIcon, BookIcon, ClipboardIcon, DocumentIcon } from "@/components/icons"
import { useRef, useState } from "react"
import { ApiService } from "@/services/apiService"
import { OCRPreviewModal } from "@/components/ocr-preview-modal"

// OCR 數據類型定義
interface OCRSchedule {
  day_of_week: number
  start: string
  end: string
}

interface OCRConflict {
  day_of_week: number
  start_time: string
  end_time: string
  conflicting_course: {
    id: number
    title: string
    instructor: string
    classroom: string
    start_time: string
    end_time: string
  }
}

interface OCRCourse {
  title: string
  instructor: string
  classroom: string
  schedule: OCRSchedule[]
  conflicts?: OCRConflict[]
  has_conflicts?: boolean
}

interface OCRPreviewData {
  items: OCRCourse[]
  total_courses: number
  courses_with_conflicts: number
}

interface OCRConfirmResponse {
  coursesCreated: number
  schedulesCreated: number
  skippedCourses: Array<{ reason: string }>
}

interface QuickActionsProps {
  onAddCourse: () => void
  onAddAssignment: () => void
  onAddNote: () => void
  onViewCourses: () => void
  onRefreshCourses?: () => void // 新增刷新課程列表的回調
}

export function QuickActions({ onAddCourse, onAddAssignment, onAddNote, onViewCourses, onRefreshCourses }: QuickActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  
  // OCR 預覽相關狀態
  const [ocrPreviewOpen, setOcrPreviewOpen] = useState(false)
  const [ocrPreviewData, setOcrPreviewData] = useState<OCRPreviewData | null>(null)
  const [ocrLoading, setOcrLoading] = useState(false)

  const handleScanTimetable = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {

      const resp = await ApiService.previewTimetableImage(file)
      
      if (resp.error) {
        console.error("[OCR] 掃描失敗:", resp.error)
        alert(`OCR掃描失敗: ${resp.error}`)
        return
      }

      // 檢查是否有課程數據
      if ((resp.data as any)?.items && (resp.data as any).items.length > 0) {

        setOcrPreviewData(resp.data as OCRPreviewData)
        setOcrPreviewOpen(true)
      } else {
        console.warn("[OCR] 未識別到課程數據")
        alert("未能從圖片中識別到課程信息，請確認圖片清晰度或嘗試其他課表圖片")
      }
    } catch (err) {
      console.error('[OCR] 掃描過程發生錯誤:', err)
      alert('OCR掃描過程發生錯誤，請稍後再試')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleOcrConfirm = async (selectedCourses: OCRCourse[]) => {
    setUploading(true)
    try {

      
      const response = await ApiService.confirmTimetableImport(selectedCourses)
      
      if (response.error) {
        console.error("[OCR] 創建失敗:", response.error)
        alert(`課程創建失敗: ${response.error}`)
        return
      }

      const responseData = response.data as OCRConfirmResponse
      const coursesCreated = responseData?.coursesCreated || 0
      const schedulesCreated = responseData?.schedulesCreated || 0
      const skippedCourses = responseData?.skippedCourses || []
      
      if (coursesCreated > 0) {
        let message = `成功創建 ${coursesCreated} 個課程，${schedulesCreated} 個時段！`
        if (skippedCourses.length > 0) {
          message += `\n跳過 ${skippedCourses.length} 個課程（${skippedCourses.map(c => c.reason).join(', ')}）`
        }
        alert(message)
        
        // 關閉模態框
        setOcrPreviewOpen(false)
        setOcrPreviewData(null)
        
        // 觸發課程列表刷新
        if (onRefreshCourses) {
          // 如果有刷新回調，調用它來刷新數據
          onRefreshCourses()
        } else {
          // 如果沒有回調，則刷新頁面作為後備方案
          window.location.reload()
        }
      } else {
        alert("沒有課程被創建，可能都存在時段衝突")
        setOcrPreviewOpen(false)
        setOcrPreviewData(null)
      }
    } catch (error) {
      console.error("[OCR] 確認創建過程發生錯誤:", error)
      alert("課程創建過程發生錯誤，請稍後再試")
    } finally {
      setUploading(false)
    }
  }

  const actions = [
    {
      label: "新增課程",
      icon: BookIcon,
      onClick: onAddCourse,
      variant: "default" as const,
    },
    {
      label: "新增作業",
      icon: ClipboardIcon,
      onClick: onAddAssignment,
      variant: "outline" as const,
    },
    {
      label: "新增筆記",
      icon: DocumentIcon,
      onClick: onAddNote,
      variant: "outline" as const,
    },
    {
      label: "查看課程",
      icon: BookIcon,
      onClick: onViewCourses,
      variant: "outline" as const,
    },
    {
      label: uploading ? "掃描中..." : "掃描課表 (OCR)",
      icon: DocumentIcon,
      onClick: () => fileInputRef.current?.click(),
      variant: "outline" as const,
    },
  ]

  return (
    <>
    <Card className="p-4 mb-4">
      <h2 className="font-semibold text-foreground mb-3 flex items-center gap-2">
        <PlusIcon className="w-5 h-5 text-primary" />
        快速操作
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <Button
              key={index}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              className="flex items-center gap-2 h-auto py-3 sm:py-4 px-3 sm:px-4 touch-manipulation"
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm">{action.label}</span>
            </Button>
          )
        })}
      </div>
      {/* 隱藏的檔案選擇器供 OCR 使用 */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleScanTimetable} />
    </Card>

    {/* OCR 預覽模態框 */}
    <OCRPreviewModal
      isOpen={ocrPreviewOpen}
      onClose={() => {
        setOcrPreviewOpen(false)
        setOcrPreviewData(null)
      }}
      data={ocrPreviewData}
      onConfirm={handleOcrConfirm}
      loading={uploading}
    />
  </>
  )
}
