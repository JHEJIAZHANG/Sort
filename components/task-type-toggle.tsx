"use client"

import { Button } from "@/components/ui/button"
import { ExclamationIcon, ClipboardIcon, PlusIcon, EditIcon } from "@/components/icons"
import {
  BookIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  LightbulbIcon,
  TargetIcon,
  FlagIcon,
  CheckIcon,
  MusicIcon,
  CameraIcon,
  GiftIcon,
  GamepadIcon,
  CoffeeIcon,
  BriefcaseIcon,
  ShieldIcon,
  FireIcon,
} from "@/components/icons"
import { useState } from "react"
import { CustomCategoryCreator } from "./custom-category-creator"
import { CustomCategoryEditor } from "./custom-category-editor"

interface TaskTypeToggleProps {
  taskType: string
  setTaskType: (type: string) => void
  pendingAssignmentCount?: number
  pendingExamCount?: number
  customCategoryData?: Array<{ name: string; icon?: string; count: number }>
  onAddCategory?: (name: string, icon: string) => void
  onEditCategory?: (oldName: string, newName: string, newIcon: string) => void
  onDeleteCategory?: (category: string) => void
}

const getIconComponent = (iconId?: string) => {
  const iconMap = {
    book: BookIcon,
    clipboard: ClipboardIcon,
    exclamation: ExclamationIcon,
    calendar: CalendarIcon,
    star: StarIcon,
    heart: HeartIcon,
    lightbulb: LightbulbIcon,
    target: TargetIcon,
    flag: FlagIcon,
    check: CheckIcon,
    music: MusicIcon,
    camera: CameraIcon,
    gift: GiftIcon,
    gamepad: GamepadIcon,
    coffee: CoffeeIcon,
    briefcase: BriefcaseIcon,
    shield: ShieldIcon,
    fire: FireIcon,
  }
  return iconMap[iconId as keyof typeof iconMap] || ClipboardIcon
}

export function TaskTypeToggle({
  taskType,
  setTaskType,
  pendingAssignmentCount,
  pendingExamCount,
  customCategoryData = [],
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
}: TaskTypeToggleProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)

  const handleAddCategory = (name: string, icon: string) => {

    if (onAddCategory) {
      onAddCategory(name, icon)
      setIsAdding(false)
    }
  }

  const handleEditCategory = (oldName: string, newName: string, newIcon: string) => {

    if (onEditCategory) {
      onEditCategory(oldName, newName, newIcon)
      setEditingCategory(null)
    }
  }

  const handleDeleteCategory = (categoryName: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(categoryName)
      setEditingCategory(null)
    }
  }

  const isCustomCategorySelected = customCategoryData.some((cat) => cat.name === taskType)
  const selectedCustomCategory = customCategoryData.find((cat) => cat.name === taskType)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 overflow-x-auto">
          <div className="inline-flex bg-muted rounded-lg p-1">
            <Button
              variant={taskType === "assignment" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTaskType("assignment")}
              className="flex-shrink-0 flex items-center gap-2"
            >
              <ExclamationIcon className="w-4 h-4" />
              作業
              {pendingAssignmentCount !== undefined && (
                <span className="ml-1 text-xs bg-background/20 px-1.5 py-0.5 rounded">{pendingAssignmentCount}</span>
              )}
            </Button>
            <Button
              variant={taskType === "exam" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTaskType("exam")}
              className="flex-shrink-0 flex items-center gap-2"
            >
              <ClipboardIcon className="w-4 h-4" />
              考試
              {pendingExamCount !== undefined && (
                <span className="ml-1 text-xs bg-background/20 px-1.5 py-0.5 rounded">{pendingExamCount}</span>
              )}
            </Button>

            {customCategoryData.map((category) => {
              const IconComponent = getIconComponent(category.icon)
              return (
                <Button
                  key={category.name}
                  variant={taskType === category.name ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTaskType(category.name)}
                  className="flex-shrink-0 flex items-center gap-2"
                >
                  <IconComponent className="w-4 h-4" />
                  {category.name}
                  <span className="ml-1 text-xs bg-background/20 px-1.5 py-0.5 rounded">{category.count}</span>
                </Button>
              )
            })}
          </div>
        </div>

        {isCustomCategorySelected && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditingCategory(taskType)}
            className="w-8 h-8 p-0 flex-shrink-0"
            title="編輯分類"
          >
            <EditIcon className="w-4 h-4" />
          </Button>
        )}

        {!isAdding && (
          <Button variant="outline" size="sm" onClick={() => setIsAdding(true)} className="w-8 h-8 p-0 flex-shrink-0">
            <PlusIcon className="w-4 h-4" />
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="mb-4">
          <CustomCategoryCreator onAddCategory={handleAddCategory} onCancel={() => setIsAdding(false)} />
        </div>
      )}

      {editingCategory && (
        <CustomCategoryEditor
          categoryName={editingCategory}
          categoryIcon={customCategoryData.find((cat) => cat.name === editingCategory)?.icon || "clipboard"}
          onSave={(newName, newIcon) => handleEditCategory(editingCategory, newName, newIcon)}
          onDelete={() => handleDeleteCategory(editingCategory)}
          onCancel={() => setEditingCategory(null)}
        />
      )}
    </div>
  )
}
