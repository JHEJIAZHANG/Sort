"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
import { CheckIcon, ClockIcon, ExclamationIcon, MapPinIcon } from "@/components/icons"
import type { Exam, Course } from "@/types/course"
import { isExamEndedTaiwan, getDaysToExamEndTaiwan, getExamDueTimeText } from "@/lib/taiwan-time"
import { useStatusUpdateFeedback } from "@/hooks/use-status-update-feedback"

interface ExamCardProps {
  exam: Exam
  course?: Course
  onStatusChange: (id: string, status: Exam["status"]) => void
  onEdit?: () => void
  onDelete?: () => void
  onViewDetail?: () => void
}

export function ExamCard({ exam, course, onStatusChange, onEdit, onDelete, onViewDetail }: ExamCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  
  // 使用狀態更新反饋系統
  const { executeWithFeedback, getUpdateState } = useStatusUpdateFeedback()
  const isUpdating = getUpdateState(exam.id).isUpdating

  const getStatusColor = (status: Exam["status"], examDate: Date, duration: number) => {
    if (status === "completed") {
      return "text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700/50"
    }

    if (status === "pending") {
      return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
    }

    const isEnded = isExamEndedTaiwan(examDate, duration)
    const daysToExamEnd = getDaysToExamEndTaiwan(examDate, duration)

    if (isEnded) {
      return "text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700/50"
    }
    if (daysToExamEnd <= 2) {
      return "text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50"
    }
    if (daysToExamEnd <= 7) {
      return "text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50"
    }
    return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
  }

  const getStatusIcon = (status: Exam["status"]) => {
    switch (status) {
      case "completed":
        return CheckIcon
      case "overdue":
        return ExclamationIcon
      default:
        return ClockIcon
    }
  }

  const getStatusText = (status: Exam["status"], examDate: Date, duration: number) => {
    if (status === "completed") {
      return "已結束"
    }

    const isEnded = isExamEndedTaiwan(examDate, duration)
    const daysToExamEnd = getDaysToExamEndTaiwan(examDate, duration)

    if (isEnded) {
      return "已結束"
    }
    if (daysToExamEnd <= 7) {
      return "即將來臨"
    }
    return "已排程"
  }

  const getExamTypeText = (type: Exam["type"]) => {
    switch (type) {
      case "midterm":
        return "期中考"
      case "final":
        return "期末考"
      case "quiz":
        return "小考"
      default:
        return "考試"
    }
  }

  const StatusIcon = getStatusIcon(exam.status)

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return
    }
    if (exam.description) {
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

  const handleStatusChange = async (e: React.MouseEvent, newStatus: Exam["status"]) => {
    e.stopPropagation()
    
    const statusMessages = {
      completed: "考試已標記為結束",
      pending: "考試已標記為未完成",
      overdue: "考試狀態已更新"
    }
    
    try {
      await executeWithFeedback( exam.id, async () => onStatusChange(exam.id, newStatus),
        {
          successMessage: statusMessages[newStatus],
          errorMessage: "狀態更新失敗，請稍後再試"
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("操作進行中")) {
        return
      }
      console.error("更新考試狀態失敗:", error)
    }
  }

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDescription(!showDescription)
  }

  return (
    <>
      <Card
        className="p-3 sm:p-5 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-slate-900/90"
        onClick={handleCardClick}
      >
        <div className="flex items-start justify-between mb-3 sm:mb-4">
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <StatusIcon
              className={`w-4 h-4 sm:w-5 sm:h-5 mt-1 flex-shrink-0 ${getStatusColor(exam.status, exam.examDate, exam.duration).split(" ")[0]}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-balance text-base sm:text-lg leading-tight">{exam.title}</h3>
              {course && <p className="text-sm text-muted-foreground mt-2 font-medium truncate">{course.name}</p>}
              {exam.description && showDescription && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">{exam.description}</p>
                </div>
              )}
              {exam.location && (
                <div className="flex items-center gap-2 mt-3">
                  <MapPinIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground font-medium truncate">{exam.location}</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 ml-2 sm:ml-3 flex-shrink-0">
            <span className="text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 text-gray-800 font-medium dark:bg-gray-800/50 dark:text-gray-300 w-fit">
              {getExamTypeText(exam.type)}
            </span>
          </div>
        </div>

        <div
          className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border-2 ${getStatusColor(exam.status, exam.examDate, exam.duration)}`}
        >
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold ${getStatusColor(exam.status, exam.examDate, exam.duration).split(" ")[0]}`}
            >
              {getStatusText(exam.status, exam.examDate, exam.duration)}
            </p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">
              {new Date(exam.examDate).toLocaleDateString("zh-TW")}{" "}
              {new Date(exam.examDate).toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>

          {exam.status !== "completed" && (
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-semibold text-foreground">
                {getExamDueTimeText(exam.examDate, exam.duration)}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
          {exam.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => handleStatusChange(e, "completed")}
              disabled={isUpdating}
              className="flex-1 min-w-0 rounded-xl font-medium text-sm h-9 sm:h-10 px-3 sm:px-4 touch-manipulation"
            >
              {isUpdating ? "更新中..." : "標記結束"}
            </Button>
          )}
          {exam.status === "completed" && (
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
            <AlertDialogTitle>確定要刪除這個考試嗎？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法復原。考試「{exam.title}」將被永久刪除。</AlertDialogDescription>
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
