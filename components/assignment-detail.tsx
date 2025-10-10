"use client"
import { useState } from "react"
import { calculateNotificationTime, getReminderTimingText } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { LearningResources } from "@/components/learning-resources"
import { CheckIcon, ClockIcon } from "@/components/icons"
import { ExternalLink } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useStatusUpdateFeedback } from "@/hooks/use-status-update-feedback"
import type { Assignment, Course } from "@/types/course"

interface AssignmentDetailProps {
  assignment: Assignment
  course?: Course
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (status: Assignment["status"]) => void
  notificationSettings?: {
    assignmentReminderTiming: string
  }
}

export function AssignmentDetail({
  assignment,
  course,
  onBack,
  onEdit,
  onDelete,
  onStatusChange,
  notificationSettings,
}: AssignmentDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // 使用狀態更新反饋系統
  const { executeWithFeedback, getUpdateState } = useStatusUpdateFeedback()
  const isUpdating = getUpdateState(assignment.id).isUpdating

  // 計算提醒時間改用共用工具

  // 顯示文字改用共用工具

  // 決定使用哪個提醒時機設定
  const effectiveReminderTiming = assignment.customReminderTiming && assignment.customReminderTiming !== 'default' 
    ? assignment.customReminderTiming 
    : notificationSettings?.assignmentReminderTiming || '1week'
  
  // 優先使用資料庫中已儲存的提醒時間，如果沒有則重新計算
  const notificationTime = assignment.notificationTime || calculateNotificationTime(assignment.dueDate, effectiveReminderTiming)

  const getStatusColor = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "text-chart-4 bg-chart-4/10 border-chart-4/20"
      case "overdue":
        return "text-destructive bg-destructive/10 border-destructive/20"
      default:
        return "text-chart-5 bg-chart-5/10 border-chart-5/20"
    }
  }

  const getStatusText = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return "已完成"
      case "overdue":
        return "已逾期"
      default:
        return "進行中"
    }
  }

  const handleDeleteConfirm = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  const handleStatusChange = async (newStatus: Assignment["status"]) => {
    const statusMessages = {
      completed: `作業「${assignment.title || "未命名作業"}」已標記為完成`,
      pending: `作業「${assignment.title || "未命名作業"}」已標記為未完成`,
      overdue: `作業「${assignment.title || "未命名作業"}」狀態已更新`
    }

    try {
      await executeWithFeedback(
        assignment.id,
        async () => onStatusChange(newStatus),
        {
          successMessage: statusMessages[newStatus],
          errorMessage: "狀態更新失敗，請稍後再試"
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      // 重複點擊時的友善處理：忽略錯誤即可
      if (message.includes("操作進行中")) {
        return
      }
      // 其他錯誤僅記錄，錯誤提示由 useStatusUpdateFeedback 已處理
      console.error("更新作業狀態失敗:", error)
    }
  }

  return (
    <>
      <PageHeader
        title={assignment.title || "未命名作業"}
        action={
          <Button variant="outline" size="sm" onClick={onBack}>
            返回
          </Button>
        }
      />

      {/* Assignment Info */}
      <div className="space-y-6 mb-6">
        {/* Status and Course Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(assignment.status)}`}>
              {getStatusText(assignment.status)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {course && <p className="text-sm text-muted-foreground">課程：{course.name}</p>}
            {assignment.source === "google_classroom" && (
              <span className="text-sm px-3 py-1 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Google Classroom
              </span>
            )}
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <span className="text-sm font-medium">截止時間</span>
          <p className="text-sm text-muted-foreground">{assignment.dueDate.toLocaleString("zh-TW")}</p>
        </div>

        {/* Reminder Settings */}
        <div className="space-y-1">
          <span className="text-sm font-medium">提醒設定</span>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              提醒時機：{getReminderTimingText(assignment.customReminderTiming || 'default')}
              {assignment.customReminderTiming === 'default' || !assignment.customReminderTiming ? (
                <span className="text-xs text-muted-foreground ml-1">
                  (實際：{getReminderTimingText(notificationSettings?.assignmentReminderTiming || '1week')})
                </span>
              ) : null}
            </p>
            <p className="text-sm text-muted-foreground">
              提醒時間：{notificationTime.toLocaleString("zh-TW")}
            </p>
          </div>
        </div>

        {/* Description */}
        {assignment.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">作業描述</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {assignment.description}
            </p>
          </div>
        )}

        {/* Google Classroom Link */}
        {assignment.googleClassroomUrl && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Google Classroom 連結</h3>
            <a 
              href={assignment.googleClassroomUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              前往 Google Classroom 查看作業
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>

      {/* Learning Resources */}
      <div className="mb-4">
        <LearningResources assignment={assignment} course={course} />
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <div className="flex gap-2">
          {(assignment.status === "pending" || assignment.status === "overdue") && (
            <Button 
              onClick={() => handleStatusChange("completed")} 
              disabled={isUpdating}
              className="flex-1"
            >
              <CheckIcon className="w-4 h-4 mr-2" />
              {isUpdating ? "更新中..." : "標記完成"}
            </Button>
          )}
          {assignment.status === "completed" && (
            <Button 
              variant="outline" 
              onClick={() => handleStatusChange("pending")} 
              disabled={isUpdating}
              className="flex-1"
            >
              <ClockIcon className="w-4 h-4 mr-2" />
              {isUpdating ? "更新中..." : "標記未完成"}
            </Button>
          )}
          <Button variant="outline" onClick={onEdit}>
            編輯
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full text-destructive hover:text-destructive bg-transparent"
        >
          刪除作業
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個作業？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法復原。作業「{assignment.title}」將被永久刪除。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
