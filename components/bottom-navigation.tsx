"use client"

import { HomeIcon, BookIcon, ClipboardIcon, DocumentIcon, UserIcon } from "./icons"
import { cn } from "@/lib/utils"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "home", label: "首頁", icon: HomeIcon },
    { id: "courses", label: "課程", icon: BookIcon },
    { id: "tasks", label: "待辦", icon: ClipboardIcon },
    { id: "notes", label: "筆記", icon: DocumentIcon },
    { id: "profile", label: "我的", icon: UserIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md lg:hidden shadow-lg z-50 animate-slide-up">
      <div className="flex items-center justify-around py-2 pb-safe px-2">
        {tabs.map((tab, index) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 min-w-[60px] min-h-[56px] touch-manipulation relative overflow-hidden group",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "text-primary-foreground bg-primary shadow-lg shadow-primary/25" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              )}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <div className={cn(
                "transition-transform duration-300",
                isActive ? "animate-bounce-in" : "group-hover:scale-110"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn(
                "text-xs font-medium transition-all duration-300",
                isActive ? "font-semibold" : "group-hover:font-medium"
              )}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute inset-0 bg-primary/10 rounded-xl animate-pulse" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
