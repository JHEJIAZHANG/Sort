"use client"

import { HomeIcon, BookIcon, ClipboardIcon, DocumentIcon, UserIcon } from "./icons"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface SidebarNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function SidebarNavigation({ activeTab, onTabChange }: SidebarNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-width", isCollapsed ? "4rem" : "16rem")
  }, [isCollapsed])

  const handleMouseEnter = () => {
    setIsCollapsed(false)
    setTimeout(() => {
      setShowText(true)
    }, 200)
  }

  const handleMouseLeave = () => {
    setShowText(false)
    setIsCollapsed(true)
  }

  const tabs = [
    { id: "home", label: "首頁", icon: HomeIcon },
    { id: "courses", label: "課程", icon: BookIcon },
    { id: "tasks", label: "待辦", icon: ClipboardIcon },
    { id: "notes", label: "筆記", icon: DocumentIcon },
    { id: "profile", label: "我的", icon: UserIcon },
  ]

  return (
    <nav
      className={cn(
        "hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-full lg:bg-sidebar/95 lg:backdrop-blur-md lg:border-r lg:border-sidebar-border lg:z-30 transition-all duration-300 ease-out shadow-lg desktop-sidebar",
        isCollapsed ? "lg:w-16" : "lg:w-64",
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className={cn(
          "border-b border-sidebar-border flex items-center h-16 transition-all duration-300",
          isCollapsed ? "justify-center" : "justify-start px-6",
        )}
      >
        {!isCollapsed && showText && (
          <h1 className="text-xl font-bold text-sidebar-foreground animate-fade-in">
            Classroom
          </h1>
        )}
      </div>
      <div className="flex-1 p-4">
        <div className="space-y-3">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center rounded-xl transition-all duration-300 text-left h-12 relative overflow-hidden group",
                  "hover:scale-105 active:scale-95",
                  isCollapsed
                    ? isActive
                      ? "text-sidebar-primary-foreground bg-sidebar-primary justify-center shadow-lg shadow-primary/25"
                      : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent justify-center"
                    : isActive
                      ? "text-sidebar-primary-foreground bg-sidebar-primary shadow-lg shadow-primary/25"
                      : "text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent",
                )}
                title={isCollapsed ? tab.label : undefined}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div
                  className={cn(
                    "flex items-center justify-center flex-shrink-0 transition-transform duration-300",
                    isCollapsed ? "w-12 h-12" : "w-12 h-12",
                    isActive ? "animate-bounce-in" : "group-hover:scale-110"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                {!isCollapsed && showText && (
                  <span className="font-medium ml-2 animate-fade-in transition-all duration-300">
                    {tab.label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-sidebar-primary/10 rounded-xl animate-pulse" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
