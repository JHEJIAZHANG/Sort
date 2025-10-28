"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TrashIcon, CheckIcon, XIcon } from "@/components/icons"
import {
  BookIcon,
  ClipboardIcon,
  ExclamationIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  LightbulbIcon,
  TargetIcon,
  FlagIcon,
  MusicIcon,
  CameraIcon,
  GiftIcon,
  GamepadIcon,
  CoffeeIcon,
  BriefcaseIcon,
  ShieldIcon,
  FireIcon,
} from "@/components/icons"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

const AVAILABLE_ICONS = [
  { id: "book", icon: BookIcon, label: "書本" },
  { id: "clipboard", icon: ClipboardIcon, label: "剪貼板" },
  { id: "exclamation", icon: ExclamationIcon, label: "驚嘆號" },
  { id: "calendar", icon: CalendarIcon, label: "日曆" },
  { id: "star", icon: StarIcon, label: "星星" },
  { id: "heart", icon: HeartIcon, label: "愛心" },
  { id: "lightbulb", icon: LightbulbIcon, label: "燈泡" },
  { id: "target", icon: TargetIcon, label: "目標" },
  { id: "flag", icon: FlagIcon, label: "旗幟" },
  { id: "check", icon: CheckIcon, label: "勾選" },
  { id: "music", icon: MusicIcon, label: "音樂" },
  { id: "camera", icon: CameraIcon, label: "相機" },
  { id: "gift", icon: GiftIcon, label: "禮物" },
  { id: "gamepad", icon: GamepadIcon, label: "遊戲" },
  { id: "coffee", icon: CoffeeIcon, label: "咖啡" },
  { id: "briefcase", icon: BriefcaseIcon, label: "公事包" },
  { id: "shield", icon: ShieldIcon, label: "盾牌" },
  { id: "fire", icon: FireIcon, label: "火焰" },
]

interface CustomCategoryEditorProps {
  categoryName: string
  categoryIcon: string
  onSave: (name: string, icon: string) => void
  onDelete: () => void
  onCancel: () => void
}

export function CustomCategoryEditor({
  categoryName,
  categoryIcon,
  onSave,
  onDelete,
  onCancel,
}: CustomCategoryEditorProps) {
  const [editName, setEditName] = useState(categoryName)
  const [editIcon, setEditIcon] = useState(categoryIcon)
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleSave = () => {
    if (editName.trim()) {
      onSave(editName.trim(), editIcon)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  const handleDeleteConfirm = () => {
    onDelete()
    setShowDeleteDialog(false)
  }

  const selectedIconData = AVAILABLE_ICONS.find((icon) => icon.id === editIcon)
  const SelectedIconComponent = selectedIconData?.icon || ClipboardIcon

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
      <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-8 h-8 p-0 bg-transparent" type="button">
            <SelectedIconComponent className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3">
          <div className="grid grid-cols-6 gap-2">
            {AVAILABLE_ICONS.map((iconOption) => {
              const IconComponent = iconOption.icon
              return (
                <button
                  key={iconOption.id}
                  type="button"
                  onClick={() => {
                    setEditIcon(iconOption.id)
                    setIsIconPickerOpen(false)
                  }}
                  className={`p-2 border rounded-lg flex flex-col items-center gap-1 hover:bg-muted transition-colors ${
                    editIcon === iconOption.id ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-xs">{iconOption.label}</span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      <Input
        type="text"
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        onKeyDown={handleKeyPress}
        className="flex-1"
        autoFocus
      />

      <Button size="sm" onClick={handleSave} disabled={!editName.trim()}>
        <CheckIcon className="w-4 h-4" />
      </Button>

      <Button size="sm" variant="outline" onClick={onCancel}>
        <XIcon className="w-4 h-4" />
      </Button>

      <Button size="sm" variant="destructive" onClick={() => setShowDeleteDialog(true)} title="刪除分類">
        <TrashIcon className="w-4 h-4" />
      </Button>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除這個分類？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法復原。分類「{categoryName}」及其下的所有待辦事項將被永久刪除。
            </AlertDialogDescription>
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
    </div>
  )
}
