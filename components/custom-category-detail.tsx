"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/page-header"
import { LearningResources } from "@/components/learning-resources"
import { CheckIcon, ClockIcon } from "@/components/icons"
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
import type { Course } from "@/types/course"
import type { CustomCategoryItem } from "./custom-category-form"
import { getDaysDifferenceTaiwan, isTodayTaiwan, isSameDayTaiwan, getTaiwanTime } from "@/lib/taiwan-time"
import { calculateNotificationTime, getReminderTimingText } from "@/lib/utils"

interface CustomCategoryDetailProps {
  item: CustomCategoryItem
  course?: Course
  onBack: () => void
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (id: string, status: "pending" | "completed" | "overdue") => void
  notificationSettings?: {
    assignmentReminderTiming: string
  }
}

// 計算提醒時間改用共用工具

export function CustomCategoryDetail({
  item,
  course,
  onBack,
  onEdit,
  onDelete,
  onStatusChange,
  notificationSettings,
}: CustomCategoryDetailProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const today = getTaiwanTime()
  const daysUntilDue = getDaysDifferenceTaiwan(today, item.dueDate)
  const isOverdue = item.status === "overdue" || (item.status === "pending" && daysUntilDue < 0)
  const isDueToday = isSameDayTaiwan(item.dueDate, today)
  const isViewingToday = isTodayTaiwan(today)
  
  // 動態計算提醒時間
  // 優先使用個別作業的設定，如果是 "default" 或未設定則使用統一設定
  const effectiveReminderTiming = item.customReminderTiming && item.customReminderTiming !== 'default' 
    ? item.customReminderTiming 
    : notificationSettings?.assignmentReminderTiming || '1week'
  
  const notificationTime = calculateNotificationTime(item.dueDate, effectiveReminderTiming)

  const getStatusColor = (status: CustomCategoryItem["status"]) => {
    switch (status) {
      case "completed":
        return "text-chart-4 bg-chart-4/10 border-chart-4/20"
      case "overdue":
        return "text-destructive bg-destructive/10 border-destructive/20"
      default:
        if (isOverdue) return "text-destructive bg-destructive/10 border-destructive/20"
        return "text-chart-5 bg-chart-5/10 border-chart-5/20"
    }
  }

  const getStatusText = () => {
    if (item.status === "completed") return "已完成"
    if (item.status === "overdue" || isOverdue) return "已逾期"
    if (isDueToday) return isViewingToday ? "今天到期" : "當天到期"
    if (daysUntilDue === 1) return isViewingToday ? "明天到期" : "隔天到期"
    if (daysUntilDue > 1) return `${daysUntilDue}天後到期`
    return "進行中"
  }

  const handleDeleteConfirm = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  return (
    <>
      <PageHeader
        title={item.title}
        action={
          <Button variant="outline" size="sm" onClick={onBack}>
            返回
          </Button>
        }
      />

      <div className="space-y-6 mb-6">
        {/* Status and Course Info */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(item.status)}`}>
              {getStatusText()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {course && <p className="text-sm text-muted-foreground">課程：{course.name}</p>}
            <span className="text-sm px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
              {item.category}
            </span>
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-1">
          <span className="text-sm font-medium">截止時間</span>
          <p className="text-sm text-muted-foreground">{item.dueDate.toLocaleString("zh-TW")}</p>
        </div>

        {/* Notification Time */}
        {notificationTime && (
          <div className="space-y-1">
            <span className="text-sm font-medium">提醒時間</span>
            <p className="text-sm text-muted-foreground">{notificationTime.toLocaleString("zh-TW")}</p>
          </div>
        )}

        {/* Description */}
        {item.description && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">項目描述</h3>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.description}</p>
          </div>
        )}
      </div>

      <div className="mb-4">
        <LearningResources
          assignment={{
            id: item.id,
            title: item.title,
            description: item.description || "",
            dueDate: item.dueDate,
            status: item.status as "pending" | "completed" | "overdue",
            courseId: course?.id || "",
            source: "manual" as const,
          }}
          course={course}
        />
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          {(item.status === "pending" || item.status === "overdue") && (
            <Button onClick={() => onStatusChange(item.id, "completed")} className="flex-1">
              <CheckIcon className="w-4 h-4 mr-2" />
              標記完成
            </Button>
          )}
          {item.status === "completed" && (
            <Button variant="outline" onClick={() => onStatusChange(item.id, "pending")} className="flex-1">
              <ClockIcon className="w-4 h-4 mr-2" />
              標記未完成
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
          刪除項目
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個項目？</AlertDialogTitle>
            <AlertDialogDescription>此操作無法復原。項目「{item.title}」將被永久刪除。</AlertDialogDescription>
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
