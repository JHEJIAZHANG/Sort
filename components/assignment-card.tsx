"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckIcon, ClockIcon, ExclamationIcon } from "@/components/icons"
import type { Assignment, Course } from "@/types/course"
import { getDaysDifferenceTaiwan, isTodayTaiwan, isTomorrowTaiwan } from "@/lib/taiwan-time"
import { LearningResources } from "./learning-resources"
import { useStatusUpdateFeedback } from "@/hooks/use-status-update-feedback"

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
import { ExternalLink } from "lucide-react"

interface AssignmentCardProps {
  assignment: Assignment
  course?: Course
  onStatusChange: (id: string, status: Assignment["status"]) => void
  onEdit?: () => void
  onDelete?: () => void
  onViewDetail?: () => void
}

export function AssignmentCard({
  assignment,
  course,
  onStatusChange,
  onEdit,
  onDelete,
  onViewDetail,
}: AssignmentCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  
  // 使用狀態更新反饋系統
  const { executeWithFeedback, getUpdateState } = useStatusUpdateFeedback()
  const isUpdating = getUpdateState(assignment.id).isUpdating

  const getStatusColor = (status: Assignment["status"], dueDate: Date) => {
    if (status === "completed") {
      return "text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700/50"
    }

    if (status === "pending") {
      return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
    }

    const daysUntilDue = getDaysDifferenceTaiwan(new Date(), dueDate)

    if (daysUntilDue <= 0) {
      return "text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700/50"
    }
    if (daysUntilDue <= 2) {
      return "text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50"
    }
    if (daysUntilDue <= 7) {
      return "text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50"
    }
    return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
  }

  const getStatusIcon = (status: Assignment["status"]) => {
    switch (status) {
      case "completed":
        return CheckIcon
      case "overdue":
        return ExclamationIcon
      default:
        return ClockIcon
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

  const getDaysUntilDue = () => {
    const daysUntilDue = getDaysDifferenceTaiwan(new Date(), assignment.dueDate)

    if (daysUntilDue < 0) return "已逾期"
    if (isTodayTaiwan(assignment.dueDate)) return "今天到期"
    if (isTomorrowTaiwan(assignment.dueDate)) return "明天到期"
    return `${daysUntilDue}天後到期`
  }

  const StatusIcon = getStatusIcon(assignment.status)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return
    }
    if (assignment.description) {
      setShowDescription(!showDescription)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = () => {
    onDelete?.()
    setShowDeleteDialog(false)
  }

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDescription(!showDescription)
  }

  const handleStatusChange = async (e: React.MouseEvent, newStatus: Assignment["status"]) => {
    e.stopPropagation()
    
    const statusMessages = {
      completed: "作業已標記為完成",
      pending: "作業已標記為未完成",
      overdue: "作業狀態已更新"
    }
    
    try {
      await executeWithFeedback(
        assignment.id,
        async () => onStatusChange(assignment.id, newStatus),
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
      <Card
        className={`p-3 sm:p-5 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-slate-900/90`}
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <StatusIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0 ${getStatusColor(assignment.status, assignment.dueDate).split(" ")[0]}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight mb-2">
                {assignment.title || "未命名作業"}
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {(course?.name || assignment.courseName) && (
                  <p className="text-sm text-muted-foreground font-medium truncate">{course?.name || assignment.courseName}</p>
                )}
                {assignment.source === "google_classroom" && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-300 font-medium dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50 py-px px-2 w-fit">
                      Google Classroom
                    </span>
                    {assignment.googleClassroomUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(assignment.googleClassroomUrl, '_blank')
                        }}
                        title="前往 Google Classroom"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {assignment.description && showDescription && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{assignment.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div
          className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 ${getStatusColor(assignment.status, assignment.dueDate)}`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold ${getStatusColor(assignment.status, assignment.dueDate).split(" ")[0]}`}
            >
              {getStatusText(assignment.status)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {assignment.dueDate.toLocaleDateString("zh-TW")}{" "}
              {assignment.dueDate.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {assignment.status === "pending" && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-foreground">{getDaysUntilDue()}</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
           {(assignment.status === "pending" || assignment.status === "overdue") && (
             <Button
               size="sm"
               variant="outline"
               onClick={(e) => handleStatusChange(e, "completed")}
               disabled={isUpdating}
               className="flex-1 min-w-0 rounded-xl font-medium text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
             >
               {isUpdating ? "更新中..." : "標記完成"}
             </Button>
           )}
           {assignment.status === "completed" && (
             <Button
               size="sm"
               variant="outline"
               onClick={(e) => handleStatusChange(e, "pending")}
               disabled={isUpdating}
               className="flex-1 min-w-0 rounded-xl font-medium text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
             >
               {isUpdating ? "更新中..." : "標記未完成"}
             </Button>
           )}
          {assignment.googleClassroomUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                window.open(assignment.googleClassroomUrl, '_blank', 'noopener,noreferrer')
              }}
              className="hidden sm:flex rounded-xl font-medium bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 text-sm h-10 px-4 touch-manipulation"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span>Classroom</span>
            </Button>
          )}
          {onViewDetail && (
            <Button
              size="sm"
              variant="outline"
              onClick={onViewDetail}
              className="rounded-xl font-medium bg-transparent text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
            >
              <span className="hidden sm:inline">查看詳情</span>
              <span className="sm:hidden">詳情</span>
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit} className="rounded-xl font-medium bg-transparent text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation">
              編輯
            </Button>
          )}
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDeleteClick}
              className="text-destructive hover:text-destructive bg-transparent rounded-xl font-medium text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
            >
              刪除
            </Button>
          )}
        </div>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個作業嗎？</AlertDialogTitle>
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
}//test
