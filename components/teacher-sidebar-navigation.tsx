"use client"

import { HomeIcon, BookIcon, ClipboardIcon, DocumentIcon, UserIcon, BriefcaseIcon, TargetIcon } from "./icons"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

interface TeacherSidebarNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export function TeacherSidebarNavigation({ activeTab, onTabChange }: TeacherSidebarNavigationProps) {
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
    { id: "dashboard", label: "首頁", icon: HomeIcon },
    { id: "courses", label: "我的課程", icon: BookIcon },
    { id: "assignments", label: "作業管理", icon: ClipboardIcon },
    { id: "students", label: "學生管理", icon: BriefcaseIcon },
    { id: "reports", label: "週報統計", icon: TargetIcon },
    { id: "profile", label: "個人設定", icon: UserIcon },
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
          "flex flex-col h-full py-4 px-2 transition-all duration-300",
          isCollapsed ? "items-center" : "items-start"
        )}
      >
        {/* Logo/Title */}
        <div className={cn(
          "mb-8 transition-all duration-300",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {isCollapsed ? (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              {showText && (
                <div className="animate-fade-in">
                  <h2 className="font-bold text-sidebar-foreground">教師系統</h2>
                  <p className="text-xs text-sidebar-foreground/60">課程管理平台</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 w-full space-y-2">
          {tabs.map((tab, index) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
                  "hover:scale-105 active:scale-95 touch-manipulation",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isCollapsed ? "justify-center" : "justify-start"
                )}
                style={{
                  animationDelay: `${index * 50}ms`
                }}
              >
                <div className={cn(
                  "transition-transform duration-300 flex-shrink-0",
                  isActive ? "animate-bounce-in" : "group-hover:scale-110"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                {!isCollapsed && showText && (
                  <span className={cn(
                    "font-medium transition-all duration-300 animate-fade-in",
                    isActive ? "font-semibold" : "group-hover:font-medium"
                  )}>
                    {tab.label}
                  </span>
                )}
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl animate-pulse" />
                )}
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className={cn(
          "mt-4 pt-4 border-t border-sidebar-border transition-all duration-300",
          isCollapsed ? "px-2" : "px-4"
        )}>
          {!isCollapsed && showText && (
            <div className="animate-fade-in">
              <p className="text-xs text-sidebar-foreground/60 text-center">
                NTUB 教師系統 v2.0
              </p>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}