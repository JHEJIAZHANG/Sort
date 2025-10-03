import { ApiService } from './apiService'
import type { OCRPreviewData, OCRCourse, OCRConfirmResponse } from '@/contexts/ocr-context'

export class OCRService {
  /**
   * 掃描圖片並獲取 OCR 預覽數據
   */
  static async scanImage(file: File): Promise<{
    success: boolean
    data?: OCRPreviewData
    error?: string
  }> {
    try {
      console.log("[OCR] 開始掃描圖片:", file.name)
      
      const response = await ApiService.ocrSchedulePreview(file)
      const ok = !response.error
      if (!ok) {
        console.error("[OCR] 掃描失敗:", response.error)
        return {
          success: false,
          error: response.error || 'OCR掃描失敗'
        }
      }

      if (response.data && (response.data as any).total_courses > 0) {
        console.log("[OCR] 成功識別課程:", (response.data as any).total_courses, "個")
        return {
          success: true,
          data: response.data as OCRPreviewData
        }
      } else {
        console.warn("[OCR] 未識別到課程數據")
        return {
          success: false,
          error: "未識別到課程數據，請確認圖片清晰度或重新拍攝"
        }
      }
    } catch (error) {
      console.error("[OCR] 掃描過程發生錯誤:", error)
      return {
        success: false,
        error: "OCR掃描過程發生錯誤，請稍後再試"
      }
    }
  }

  /**
   * 確認創建選中的課程
   */
  static async confirmCourses(selectedCourses: OCRCourse[]): Promise<{
    success: boolean
    data?: OCRConfirmResponse
    error?: string
  }> {
    try {
      console.log("[OCR] 確認創建課程:", selectedCourses.length, "個")
      
      const response = await ApiService.ocrScheduleConfirm(selectedCourses)
      const ok = !response.error
      if (!ok) {
        console.error("[OCR] 創建失敗:", response.error)
        return {
          success: false,
          error: response.error || '課程創建失敗'
        }
      }

      return {
        success: true,
        data: response.data as OCRConfirmResponse
      }
    } catch (error) {
      console.error("[OCR] 確認創建過程發生錯誤:", error)
      return {
        success: false,
        error: "課程創建過程發生錯誤，請稍後再試"
      }
    }
  }

  /**
   * 觸發文件選擇器進行 OCR 掃描
   */
  static triggerFilePicker(onFileSelected: (file: File) => void) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        onFileSelected(file)
      }
    }
    input.click()
  }
}