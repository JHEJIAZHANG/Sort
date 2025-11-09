"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

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

interface CustomCategoryCreatorProps {
  onAddCategory: (name: string, icon: string) => void
  onCancel: () => void
}

export function CustomCategoryCreator({ onAddCategory, onCancel }: CustomCategoryCreatorProps) {
  const [categoryName, setCategoryName] = useState("")
  const [selectedIcon, setSelectedIcon] = useState("clipboard")
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)

  const handleSubmit = () => {
    if (categoryName.trim()) {
  
      onAddCategory(categoryName.trim(), selectedIcon)
      setCategoryName("")
      setSelectedIcon("clipboard")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSubmit()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  const selectedIconData = AVAILABLE_ICONS.find((icon) => icon.id === selectedIcon)
  const SelectedIconComponent = selectedIconData?.icon || ClipboardIcon

  

  return (
    <div className="flex items-center gap-2">
      <Popover open={isIconPickerOpen} onOpenChange={setIsIconPickerOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-10 h-8 p-0 bg-transparent" type="button">
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
            
                    setSelectedIcon(iconOption.id)
                    setIsIconPickerOpen(false)
                  }}
                  className={`p-2 border rounded-lg flex flex-col items-center gap-1 hover:bg-muted transition-colors ${
                    selectedIcon === iconOption.id ? "border-primary bg-primary/10" : "border-border"
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
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        onKeyDown={handleKeyPress}
        placeholder="分類名稱"
        className="flex-1"
        autoFocus
      />

      <Button size="sm" onClick={handleSubmit} disabled={!categoryName.trim()}>
        確定
      </Button>

      <Button size="sm" variant="outline" onClick={onCancel}>
        取消
      </Button>
    </div>
  )
}
