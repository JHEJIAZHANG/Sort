"use client"

import type React from "react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClockIcon, TrashIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from "@/components/icons"
import type { Course } from "@/types/course"
import type { CustomCategoryItem } from "./custom-category-form"
import { getDaysDifferenceTaiwan, isTodayTaiwan, isSameDayTaiwan, getTaiwanTime } from "@/lib/taiwan-time"
import { useStatusUpdateFeedback } from "@/hooks/use-status-update-feedback"

interface CustomCategoryCardProps {
  item: CustomCategoryItem
  course?: Course
  onStatusChange: (id: string, status: "pending" | "completed" | "overdue") => void
  onViewDetail: () => void
  onEdit: () => void
  onDelete: () => void
}

export function CustomCategoryCard({
  item,
  course,
  onStatusChange,
  onViewDetail,
  onEdit,
  onDelete,
}: CustomCategoryCardProps) {
  const [showDescription, setShowDescription] = useState(false)
  const { executeWithFeedback, getUpdateState } = useStatusUpdateFeedback()
  const isUpdating = getUpdateState(item.id).isUpdating

  const today = getTaiwanTime()
  const daysUntilDue = getDaysDifferenceTaiwan(today, item.dueDate)
  const isOverdue = item.status === "overdue" || (item.status === "pending" && daysUntilDue < 0)
  const isDueToday = isSameDayTaiwan(item.dueDate, today)
  const isViewingToday = isTodayTaiwan(today)

  const getStatusColor = () => {
    if (item.status === "completed") {
      return "text-green-700 bg-green-100 border-green-300 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700/50"
    }

    if (item.status === "pending") {
      return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
    }

    if (isOverdue) {
      return "text-red-700 bg-red-100 border-red-300 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700/50"
    }
    if (isDueToday) {
      return "text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50"
    }
    if (daysUntilDue <= 2) {
      return "text-orange-700 bg-orange-100 border-orange-300 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700/50"
    }
    if (daysUntilDue <= 7) {
      return "text-yellow-700 bg-yellow-100 border-yellow-300 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700/50"
    }
    return "text-blue-700 bg-blue-100 border-blue-300 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700/50"
  }

  const getStatusText = () => {
    if (item.status === "completed") return "已完成"
    if (item.status === "overdue" || isOverdue) return "已逾期"
    if (isDueToday) return isViewingToday ? "今天到期" : "當天到期"
    if (daysUntilDue === 1) return isViewingToday ? "明天到期" : "隔天到期"
    if (daysUntilDue > 1) return `${daysUntilDue}天後到期`
    return "進行中"
  }

  const getStatusIcon = () => {
    if (item.status === "completed") return CheckIcon
    if (isOverdue) return TrashIcon
    return ClockIcon
  }

  const StatusIcon = getStatusIcon()

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("a")) {
      return
    }
    if (item.description) {
      setShowDescription(!showDescription)
    }
  }

  const handleToggleDescription = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDescription(!showDescription)
  }

  const handleStatusChange = async (e: React.MouseEvent, newStatus: "pending" | "completed") => {
    e.stopPropagation()

    const statusMessages = {
      completed: "待辦事項已標記為完成",
      pending: "待辦事項已標記為未完成",
    }

    try {
      await executeWithFeedback(
        item.id,
        async () => {
          await onStatusChange(item.id, newStatus)
        },
        {
          successMessage: statusMessages[newStatus],
          errorMessage: "狀態更新失敗，請稍後再試",
        }
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (message.includes("操作進行中")) {
        return
      }
      console.error("更新自訂待辦狀態失敗:", error)
    }
  }

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all duration-200 ease-out hover:bg-white/90 dark:hover:bg-slate-900/90"
      onClick={handleCardClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          <StatusIcon className={`w-5 h-5 mt-1 ${getStatusColor().split(" ")[0]}`} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-balance text-lg leading-tight mb-2">{item.title}</h3>
            <div className="flex items-center gap-3">
              {course && <p className="text-sm text-muted-foreground font-medium">{course.name}</p>}
            </div>
            {item.description && showDescription && (
              <div className="mt-3">
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            )}
            {item.description && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleDescription}
                className="mt-2 p-0 h-auto text-xs text-muted-foreground hover:text-foreground"
              >
                {showDescription ? (
                  <>
                    <ChevronUpIcon className="w-3 h-3 mr-1" />
                    隱藏描述
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="w-3 h-3 mr-1" />
                    查看描述
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-3">
          <span className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-800 font-medium dark:bg-gray-800/50 dark:text-gray-300">
            {item.category}
          </span>
        </div>
      </div>

      <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${getStatusColor()}`}>
        <div>
          <p className={`text-sm font-semibold ${getStatusColor().split(" ")[0]}`}>{getStatusText()}</p>
          <p className="text-xs text-muted-foreground mt-1 font-medium">
            {item.dueDate.toLocaleDateString("zh-TW")} {" "}
            {item.dueDate.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        {item.status === "pending" && (
          <div className="text-right">
            <p className="text-xs font-semibold text-foreground">{getStatusText()}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-4">
        {(item.status === "pending" || item.status === "overdue") && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleStatusChange(e, "completed")}
            disabled={isUpdating}
            className="flex-1 rounded-xl font-medium"
          >
            標記完成
          </Button>
        )}
        {item.status === "completed" && (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => handleStatusChange(e, "pending")}
            disabled={isUpdating}
            className="flex-1 rounded-xl font-medium"
          >
            標記未完成
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onViewDetail()
          }}
          className="rounded-xl font-medium bg-transparent"
        >
          查看詳情
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="rounded-xl font-medium bg-transparent"
        >
          編輯
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-destructive hover:text-destructive bg-transparent rounded-xl font-medium"
        >
          刪除
        </Button>
      </div>
    </Card>
  )
}
