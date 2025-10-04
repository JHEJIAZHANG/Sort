"use client"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"

interface AddCourseDropdownProps {
  onManualAdd: () => void
  onGoogleClassroomImport: () => void
}

export function AddCourseDropdown({ onManualAdd, onGoogleClassroomImport }: AddCourseDropdownProps) {
  return (
    <Button size="sm" className="gap-1" onClick={onManualAdd}>
      <PlusIcon className="w-4 h-4" />
      新增
    </Button>
  )
}
