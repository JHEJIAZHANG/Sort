"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserIcon, SettingsIcon, GoogleIcon, LogOutIcon, ChevronRightIcon, LineIcon } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"
import { GoogleAuth } from "@/components/google-auth"
import { GoogleSyncAll } from "@/components/google-sync-all"
import { ApiService } from "@/services/apiService"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  UserNotificationSettings,
  mapNotificationSettingsFromApi,
  mapNotificationSettingsToApi
} from "@/lib/notification-settings"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  isLoggedIn: boolean
}

interface SemesterSettings {
  totalWeeks: number
  startDate: string
  endDate: string
}

interface ProfileContentProps {
  user?: User
  onUserChange?: (user: User) => void
  lineUserId?: string
}

export function ProfileContent({ user: propUser, onUserChange, lineUserId }: ProfileContentProps) {
  const [user, setUser] = useState<User>({
    id: "",
    name: "",
    email: "",
    avatar: "",
    isLoggedIn: false,
  })

  const [isGoogleClassroomConnected, setIsGoogleClassroomConnected] = useState(false)
  const [showSemesterSettings, setShowSemesterSettings] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [semesterSettings, setSemesterSettings] = useState<SemesterSettings>({
    totalWeeks: 18,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
  })

  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })
  const [initialNotificationSettings, setInitialNotificationSettings] = useState<UserNotificationSettings | null>(null)
  const [notificationLoading, setNotificationLoading] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)
  const [isNotificationSaving, setIsNotificationSaving] = useState(false)
  const [hasNotificationChanges, setHasNotificationChanges] = useState(false)

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  })

  const applyNotificationUpdate = (updater: (prev: UserNotificationSettings) => UserNotificationSettings) => {
    setNotificationSettings((prev) => {
      const next = updater(prev)
      if (initialNotificationSettings) {
        setHasNotificationChanges(JSON.stringify(next) !== JSON.stringify(initialNotificationSettings))
      } else {
        setHasNotificationChanges(true)
      }
      return next
    })
  }

  useEffect(() => {
    if (propUser) {
      setUser(propUser)
    }
  }, [propUser])

  useEffect(() => {
    if (lineUserId) {
      ApiService.setLineUserId(lineUserId)
      setUser((prev) => ({ ...prev, isLoggedIn: true }))
    } else {
      setUser((prev) => ({ ...prev, isLoggedIn: false }))
    }
  }, [lineUserId])

  // 從後端獲取用戶頭像
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!lineUserId) return

      try {
        const response = await ApiService.getProfile(lineUserId)
        if (response.data && response.data.picture_url) {
          setUser(prevUser => ({
            ...prevUser,
            avatar: response.data.picture_url
          }))
        }
      } catch (error) {
        console.error('無法獲取用戶頭像:', error)
      }
    }

    fetchUserProfile()
  }, [lineUserId])

  // 從後端獲取通知設定
  useEffect(() => {
    const fetchNotificationSettings = async () => {
      if (!lineUserId) {
        const fallback = { ...DEFAULT_NOTIFICATION_SETTINGS }
        setNotificationSettings(fallback)
        setInitialNotificationSettings(fallback)
        setHasNotificationChanges(false)
        return
      }

      setNotificationLoading(true)
      setNotificationError(null)
      try {
        const response = await ApiService.getNotificationSettings(lineUserId)
        if (response.data) {
          const normalized = mapNotificationSettingsFromApi(response.data)
          setNotificationSettings(normalized)
          setInitialNotificationSettings(normalized)
          setHasNotificationChanges(false)
        } else {
          const fallback = { ...DEFAULT_NOTIFICATION_SETTINGS }
          setNotificationSettings(fallback)
          setInitialNotificationSettings(fallback)
          setHasNotificationChanges(false)
        }
      } catch (error) {
        console.error('無法獲取通知設定:', error)
        setNotificationError("通知設定載入失敗，已套用預設值")
        const fallback = { ...DEFAULT_NOTIFICATION_SETTINGS }
        setNotificationSettings(fallback)
        setInitialNotificationSettings(fallback)
        setHasNotificationChanges(false)
      } finally {
        setNotificationLoading(false)
      }
    }

    fetchNotificationSettings()
  }, [lineUserId])

  // 從後端獲取學期設定
  useEffect(() => {
    const fetchSemesterSettings = async () => {
      if (!lineUserId) return

      try {
        const response = await ApiService.getSemesterSettings(lineUserId)
        if (response.data) {
          setSemesterSettings({
            totalWeeks: response.data.totalWeeks || 18,
            startDate: response.data.startDate || '2025-09-01',
            endDate: response.data.endDate || '2025-12-31',
          })
        }
      } catch (error) {
        console.error('無法獲取學期設定:', error)
      }
    }

    fetchSemesterSettings()
  }, [lineUserId])

  useEffect(() => {
    // Dispatch custom event to notify other components of settings change
    window.dispatchEvent(
      new CustomEvent("notificationSettingsChanged", {
        detail: notificationSettings,
      }),
    )
  }, [notificationSettings])

  const handleLogin = () => {
    if (loginForm.email && loginForm.password) {
      const newUser = {
        ...user,
        name: loginForm.email.split("@")[0],
        email: loginForm.email,
        isLoggedIn: true,
      }
      setUser(newUser)
      onUserChange?.(newUser)
      setShowLoginForm(false)
      setLoginForm({ email: "", password: "" })
    }
  }

  // 已移除模擬 LINE 登入流程，請改用真正的 LIFF 登入

  const handleLogout = () => {
    const newUser = {
      ...user,
      isLoggedIn: false,
    }
    setUser(newUser)
    onUserChange?.(newUser)
    setIsGoogleClassroomConnected(false)
  }

  const handleDeleteAccount = async () => {
    if (!lineUserId) {
      alert("無法獲取用戶資訊，請重新登入後再試")
      return
    }

    setIsDeleting(true)
    try {
      // 調用 API 刪除帳號
      await ApiService.deleteAccount(lineUserId)

      // 刪除成功後清空用戶資料
      const newUser = {
        id: "",
        name: "",
        email: "",
        avatar: "",
        isLoggedIn: false,
      }
      setUser(newUser)
      onUserChange?.(newUser)
      setIsGoogleClassroomConnected(false)

      alert("帳號已成功刪除，頁面即將刷新")
      setShowDeleteAccountDialog(false)

      // 延遲 1 秒後刷新頁面，讓用戶看到成功訊息
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (error) {
      console.error("刪除帳號失敗:", error)
      alert("刪除帳號失敗，請稍後再試")
    } finally {
      setIsDeleting(false)
    }
  }



  // 自動計算學期總週數
  const calculateTotalWeeks = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 18
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.ceil(diffDays / 7)
  }

  const handleSemesterSettingsSave = async () => {
    if (!lineUserId) {
      alert("無法儲存設定：未找到用戶 ID")
      return
    }

    // 自動計算總週數
    const totalWeeks = calculateTotalWeeks(semesterSettings.startDate, semesterSettings.endDate)

    try {
      await ApiService.updateSemesterSettings(lineUserId, {
        totalWeeks: totalWeeks,
        startDate: semesterSettings.startDate,
        endDate: semesterSettings.endDate,
      })

      // 更新本地狀態
      setSemesterSettings(prev => ({ ...prev, totalWeeks }))

      setShowSemesterSettings(false)
      alert("學期設定已儲存！")
    } catch (error) {
      console.error('儲存學期設定失敗:', error)
      alert("儲存設定失敗，請稍後再試")
    }
  }

  if (showLoginForm) {
    return (
      <div>
        <PageHeader title="登入帳戶" onBack={() => setShowLoginForm(false)} />

        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">電子郵件</Label>
              <Input
                id="email"
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="請輸入電子郵件"
              />
            </div>

            <div>
              <Label htmlFor="password">密碼</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="請輸入密碼"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleLogin} className="flex-1">
                登入
              </Button>
              <Button variant="outline" onClick={() => setShowLoginForm(false)} className="flex-1">
                取消
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (showSemesterSettings) {
    return (
      <div>
        <PageHeader title="學期設定" onBack={() => setShowSemesterSettings(false)} />

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="startDate">學期開始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={semesterSettings.startDate}
                onChange={(e) => {
                  const newStartDate = e.target.value
                  const totalWeeks = calculateTotalWeeks(newStartDate, semesterSettings.endDate)
                  setSemesterSettings({
                    ...semesterSettings,
                    startDate: newStartDate,
                    totalWeeks: totalWeeks,
                  })
                }}
              />
            </div>

            <div>
              <Label htmlFor="endDate">學期結束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={semesterSettings.endDate}
                onChange={(e) => {
                  const newEndDate = e.target.value
                  const totalWeeks = calculateTotalWeeks(semesterSettings.startDate, newEndDate)
                  setSemesterSettings({
                    ...semesterSettings,
                    endDate: newEndDate,
                    totalWeeks: totalWeeks,
                  })
                }}
              />
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">學期總週數：{semesterSettings.totalWeeks} 週</p>
              <p className="text-xs text-muted-foreground mt-1">（根據開始和結束日期自動計算）</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSemesterSettingsSave} className="flex-1">
                儲存設定
              </Button>
              <Button variant="outline" onClick={() => setShowSemesterSettings(false)} className="flex-1">
                取消
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (showNotificationSettings) {
    return (
      <div>
        <PageHeader title="通知設定" onBack={() => setShowNotificationSettings(false)} />

        <div className="space-y-6">
          {notificationLoading && (
            <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
              通知設定載入中，請稍候...
            </div>
          )}
          {notificationError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {notificationError}
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg mb-3">一般通知</h3>
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">作業提醒</p>
                    <p className="text-sm text-muted-foreground">作業截止前提醒</p>
                  </div>
                  <Switch
                    checked={notificationSettings.assignmentReminders}
                    onCheckedChange={(checked) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        assignmentReminders: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">考試提醒</p>
                    <p className="text-sm text-muted-foreground">考試前提醒</p>
                  </div>
                  <Switch
                    checked={notificationSettings.examReminders}
                    onCheckedChange={(checked) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        examReminders: checked,
                      }))
                    }
                  />
                </div>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">提醒時間</h3>
            <Card className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="assignmentReminderTiming" className="font-medium text-base">
                    作業提醒時機
                  </Label>
                  <Select
                    value={notificationSettings.assignmentReminderTiming}
                    onValueChange={(value) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        assignmentReminderTiming: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15分鐘前</SelectItem>
                      <SelectItem value="30min">30分鐘前</SelectItem>
                      <SelectItem value="1hour">1小時前</SelectItem>
                      <SelectItem value="2hours">2小時前</SelectItem>
                      <SelectItem value="1day">1天前</SelectItem>
                      <SelectItem value="2days">2天前</SelectItem>
                      <SelectItem value="1week">1週前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="examReminderTiming" className="font-medium text-base">
                    考試提醒時機
                  </Label>
                  <Select
                    value={notificationSettings.examReminderTiming}
                    onValueChange={(value) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        examReminderTiming: value,
                      }))
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15min">15分鐘前</SelectItem>
                      <SelectItem value="30min">30分鐘前</SelectItem>
                      <SelectItem value="1hour">1小時前</SelectItem>
                      <SelectItem value="2hours">2小時前</SelectItem>
                      <SelectItem value="1day">1天前</SelectItem>
                      <SelectItem value="2days">2天前</SelectItem>
                      <SelectItem value="1week">1週前</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">通知方式</h3>
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">LINE 推播</p>
                    <p className="text-sm text-muted-foreground">透過 LINE 接收通知</p>
                  </div>
                  <Switch
                    checked={notificationSettings.lineNotifications}
                    onCheckedChange={(checked) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        lineNotifications: checked,
                      }))
                    }
                  />
                </div>

              </div>
            </Card>
          </div>

          <div>
            <h3 className="font-bold text-lg mb-3">勿擾時間</h3>
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">啟用勿擾模式</p>
                    <p className="text-sm text-muted-foreground">特定時間內不接收通知</p>
                  </div>
                  <Switch
                    checked={notificationSettings.doNotDisturbEnabled}
                    onCheckedChange={(checked) =>
                      applyNotificationUpdate((prev) => ({
                        ...prev,
                        doNotDisturbEnabled: checked,
                      }))
                    }
                  />
                </div>

                {notificationSettings.doNotDisturbEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">開始時間</Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={notificationSettings.doNotDisturbStart}
                        onChange={(e) =>
                          applyNotificationUpdate((prev) => ({
                            ...prev,
                            doNotDisturbStart: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">結束時間</Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={notificationSettings.doNotDisturbEnd}
                        onChange={(e) =>
                          applyNotificationUpdate((prev) => ({
                            ...prev,
                            doNotDisturbEnd: e.target.value,
                          }))
                        }
                        className="mt-1"
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!lineUserId) {
                    alert("無法儲存設定：未找到用戶 ID")
                    return
                  }
                  if (!hasNotificationChanges || isNotificationSaving) return

                  try {
                    setIsNotificationSaving(true)
                    await ApiService.updateNotificationSettings(
                      lineUserId,
                      mapNotificationSettingsToApi(notificationSettings)
                    )
                    setInitialNotificationSettings(notificationSettings)
                    setHasNotificationChanges(false)
                    setShowNotificationSettings(false)
                    alert("通知設定已儲存！")
                  } catch (error) {
                    console.error('儲存通知設定失敗:', error)
                    setNotificationError("儲存設定失敗，請稍後再試")
                    alert("儲存設定失敗，請稍後再試")
                  } finally {
                    setIsNotificationSaving(false)
                  }
                }}
                className="flex-1"
                disabled={!hasNotificationChanges || isNotificationSaving || notificationLoading}
              >
                {isNotificationSaving ? "儲存中..." : "儲存設定"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (initialNotificationSettings) {
                    setNotificationSettings(initialNotificationSettings)
                  } else {
                    setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS })
                  }
                  setHasNotificationChanges(false)
                  setShowNotificationSettings(false)
                }}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar} alt={user.name || "用戶頭像"} />
              <AvatarFallback className="bg-muted">
                <UserIcon className="w-5 h-5" />
              </AvatarFallback>
            </Avatar>
            我的
          </div>
        }
        subtitle="個人資料與設定"
      />

      <Card className="p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 sm:p-8 text-white flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xl font-bold">升級到 Pro，解鎖進階功能</div>
            <div className="text-sm opacity-90">更高配額、進階提醒、AI 建議與更快同步</div>
          </div>
          <Link href="/pricing" className="shrink-0">
            <Button size="lg" variant="secondary" className="font-semibold rounded-xl">立即升級</Button>
          </Link>
        </div>
      </Card>

      {/* 用戶資訊卡片 */}
      <Card className="p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user.avatar} alt={user.name || "用戶頭像"} />
            <AvatarFallback className="bg-muted">
              {user.isLoggedIn ? (
                user.name?.charAt(0) || 'U'
              ) : (
                <LineIcon className="w-8 h-8" />
              )}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            {user.isLoggedIn ? (
              <div>
                <h3 className="font-semibold text-lg">{user.name}</h3>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            ) : (
              <div>
                <h3 className="font-semibold text-lg">未登入</h3>
                <p className="text-muted-foreground text-sm">請登入以同步資料</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 帳單紀錄 */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4">帳單紀錄</h3>
        <Link href="/me/subscriptions" className="block">
          <Button variant="outline" className="w-full rounded-xl">查看付款紀錄</Button>
        </Link>
      </Card>

      {/* Google 同步功能 */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <GoogleIcon className="w-5 h-5" />
          Google 同步
        </h3>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            一鍵同步 Google Classroom 課程、作業和 Google Calendar 事件
          </p>
          <GoogleSyncAll onSync={() => {
            // 同步完成後可以重新載入頁面資料
            window.location.reload()
          }} />
        </div>
      </Card>

      {/* 設定選項 */}
      <Card className="p-6 rounded-2xl">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          設定
        </h3>

        <div className="space-y-1">
          <button
            onClick={() => setShowSemesterSettings(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="text-left">
              <p className="font-medium">學期設定</p>
              <p className="text-sm text-muted-foreground">
                {semesterSettings.totalWeeks}週 • {semesterSettings.startDate} 至 {semesterSettings.endDate}
              </p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          <Separator />

          <button
            onClick={() => setShowNotificationSettings(true)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="text-left">
              <p className="font-medium">通知設定</p>
              <p className="text-sm text-muted-foreground">管理提醒和通知偏好</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </Card>

      {/* 應用資訊 */}
      <Card className="p-6 rounded-2xl">
        <div className="text-center text-muted-foreground">
          <p className="text-sm">課程管理系統</p>
          <p className="text-xs mt-1">版本 1.0.0</p>
        </div>
      </Card>

      {/* 刪除帳號 */}
      <AlertDialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <AlertDialogTrigger asChild>
          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
          >
            刪除帳號
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除帳號</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除帳號嗎？此操作將永久刪除您的所有資料，包括：
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>所有課程資料</li>
                <li>所有作業和考試記錄</li>
                <li>所有筆記內容</li>
                <li>個人設定和偏好</li>
              </ul>
              <p className="mt-3 font-semibold text-destructive">此操作無法復原，請謹慎考慮。</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                handleDeleteAccount()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function getNotificationSettings(): UserNotificationSettings {
  return { ...DEFAULT_NOTIFICATION_SETTINGS }
}
