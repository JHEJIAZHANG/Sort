"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  PlusIcon, 
  BookIcon, 
  ClipboardIcon, 
  CalendarIcon,
  ExclamationIcon,
  LightbulbIcon,
  StarIcon
} from "@/components/icons"

interface EmptyStateProps {
  type: "assignments" | "exams" | "todos" | "courses" | "notes" | "general"
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  showAction?: boolean
  icon?: React.ReactNode
  suggestions?: string[]
}

const defaultConfigs = {
  assignments: {
    title: "還沒有任何作業",
    description: "開始新增作業來追蹤你的學習進度",
    actionText: "新增第一個作業",
    icon: <ClipboardIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: [
      "從課程大綱中找出即將到期的作業",
      "設定提醒時間避免錯過截止日期",
      "使用 OCR 功能快速匯入作業資訊"
    ]
  },
  exams: {
    title: "暫無即將到來的考試",
    description: "新增考試資訊來做好準備",
    actionText: "新增考試",
    icon: <ExclamationIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: [
      "提前規劃考試準備時間",
      "設定考試提醒通知",
      "記錄考試地點和注意事項"
    ]
  },
  todos: {
    title: "暫無待辦事項",
    description: "新增待辦事項來保持高效率",
    actionText: "新增待辦事項",
    icon: <StarIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: [
      "將大型任務分解成小步驟",
      "設定優先級和截止日期",
      "定期檢視和更新進度"
    ]
  },
  courses: {
    title: "還沒有任何課程",
    description: "開始新增課程來管理你的學習",
    actionText: "新增第一門課程",
    icon: <BookIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: [
      "使用 OCR 功能快速匯入課表",
      "設定課程時間和地點",
      "添加課程相關的作業和考試"
    ]
  },
  notes: {
    title: "暫無筆記",
    description: "開始記錄學習筆記和重點",
    actionText: "新增筆記",
    icon: <LightbulbIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: [
      "記錄課堂重點和心得",
      "整理複習資料",
      "分享學習經驗"
    ]
  },
  general: {
    title: "暫無資料",
    description: "開始新增內容",
    actionText: "新增",
    icon: <CalendarIcon className="w-12 h-12 text-muted-foreground/50" />,
    suggestions: []
  }
}

export function EmptyState({
  type,
  title,
  description,
  actionText,
  onAction,
  showAction = true,
  icon,
  suggestions
}: EmptyStateProps) {
  const config = defaultConfigs[type]
  const finalTitle = title || config.title
  const finalDescription = description || config.description
  const finalActionText = actionText || config.actionText
  const finalIcon = icon || config.icon
  const finalSuggestions = suggestions || config.suggestions

  return (
    <Card className="p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        {/* Icon */}
        <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/30">
          {finalIcon}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">
            {finalTitle}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            {finalDescription}
          </p>
        </div>

        {/* Action Button */}
        {showAction && onAction && (
          <Button onClick={onAction} className="gap-2 mt-4">
            <PlusIcon className="w-4 h-4" />
            {finalActionText}
          </Button>
        )}

        {/* Suggestions */}
        {finalSuggestions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border w-full max-w-md">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              💡 小提示
            </p>
            <ul className="text-xs text-muted-foreground space-y-2 text-left">
              {finalSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  )
}

// 簡化版本，用於較小的空間
export function EmptyStateSimple({
  title = "暫無資料",
  description,
  actionText,
  onAction,
  showAction = true
}: {
  title?: string
  description?: string
  actionText?: string
  onAction?: () => void
  showAction?: boolean
}) {
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground mb-2">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground mb-4">{description}</p>
      )}
      {showAction && onAction && actionText && (
        <Button onClick={onAction} size="sm" variant="outline" className="gap-2">
          <PlusIcon className="w-3 h-3" />
          {actionText}
        </Button>
      )}
    </div>
  )
}