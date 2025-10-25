"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PlusIcon, BookIcon, ClipboardIcon, NoteIcon, DocumentIcon } from "@/components/icons"
import { OCRScanButton } from "./ocr-scan-button"

interface FloatingActionButtonProps {
  onAddCourse: () => void
  onAddAssignment: () => void
  onAddNote: () => void
  onAddExam: () => void // 新增考試回調函數
}

export function FloatingActionButton({
  onAddCourse,
  onAddAssignment,
  onAddNote,
  onAddExam,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    {
      label: "新增課程",
      icon: BookIcon,
      onClick: () => {
        onAddCourse()
        setIsOpen(false)
      },
      color: "bg-primary text-primary-foreground",
    },
    {
      label: "新增作業",
      icon: ClipboardIcon,
      onClick: () => {
        onAddAssignment()
        setIsOpen(false)
      },
      color: "bg-success text-success-foreground",
    },
    {
      label: "新增考試",
      icon: ClipboardIcon,
      onClick: () => {
        onAddExam()
        setIsOpen(false)
      },
      color: "bg-warning text-warning-foreground",
    },
    {
      label: "新增筆記",
      icon: NoteIcon,
      onClick: () => {
        onAddNote()
        setIsOpen(false)
      },
      color: "bg-info text-info-foreground",
    },
    {
      label: "掃描課表",
      icon: DocumentIcon,
      onClick: () => {
        setIsOpen(false)
      },
      color: "bg-accent text-accent-foreground",
      isOCRButton: true,
    },
  ]

  return (
    /* floating action button visible on all screen sizes */
    <div>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-fade-in" 
          onClick={() => setIsOpen(false)} 
        />
      )}

      {/* Action Menu */}
      {isOpen && (
        <div className="fixed bottom-32 sm:bottom-40 right-3 sm:right-4 z-50 animate-slide-up">
          <Card className="bg-card/95 backdrop-blur-md border shadow-xl p-3 min-w-[140px] max-w-[160px] animate-scale-in">
            <div className="space-y-2">
              {actions.map((action, index) => (
                (action as any).isOCRButton ? (
                  <OCRScanButton
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 px-3 touch-manipulation hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    showIcon={false}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${action.color} shadow-md flex-shrink-0`}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium truncate">{action.label}</span>
                  </OCRScanButton>
                ) : (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-3 h-12 px-3 touch-manipulation hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={action.onClick}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${action.color} shadow-md flex-shrink-0`}>
                      <action.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium truncate">{action.label}</span>
                  </Button>
                )
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Main FAB */}
      <Button
        size="lg"
        className={`fixed bottom-20 sm:bottom-28 right-3 sm:right-4 z-50 w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-xl hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 ease-bounce touch-manipulation hover:scale-110 active:scale-95 ${
          isOpen ? "rotate-45 bg-destructive hover:bg-destructive-hover" : "animate-bounce-slow"
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <PlusIcon className="w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300" />
      </Button>
    </div>
  )
}
