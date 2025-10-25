"use client"

import { useState, useEffect } from "react"
import { TeacherSidebarNavigation } from "./teacher-sidebar-navigation"
import { TeacherBottomNavigation } from "./teacher-bottom-navigation"

interface TeacherLayoutProps {
  children: React.ReactNode
  currentTab?: string
  onTabChange?: (tab: string) => void
}

export function TeacherLayout({ 
  children, 
  currentTab = "dashboard",
  onTabChange 
}: TeacherLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState(currentTab)

  // 檢測螢幕尺寸
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)

    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    onTabChange?.(tab)
  }

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {/* 桌面版側邊欄 */}
      {!isMobile && (
        <div className="fixed inset-y-0 left-0 z-50">
          <TeacherSidebarNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      )}

      {/* 主要內容區域：改用 CSS 變數控制側欄寬度，避免擠壓或重疊 */}
      <div
        className={isMobile ? 'pb-20 pb-safe' : ''}
        style={!isMobile ? { marginLeft: 'var(--sidebar-width, 16rem)' } : undefined}
      >
        <main className="px-3 sm:px-4 md:px-6">
          <div className="mx-auto w-full max-w-screen-sm md:max-w-screen-md lg:max-w-[1100px]">
            {children}
          </div>
        </main>
      </div>

      {/* 手機版底部導航 */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <TeacherBottomNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      )}
    </div>
  )
}