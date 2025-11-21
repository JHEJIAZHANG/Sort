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
import { UserIcon, SettingsIcon, GoogleIcon, ChevronRightIcon, LineIcon } from "@/components/icons"
import { PageHeader } from "@/components/page-header"
import { GoogleSyncAll } from "@/components/google-sync-all"
import { ApiService } from "@/services/apiService"
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  UserNotificationSettings,
  mapNotificationSettingsFromApi,
  mapNotificationSettingsToApi
} from "@/lib/notification-settings"
import Link from "next/link"
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

interface TeacherProfileContentProps {
  user?: User
  onUserChange?: (user: User) => void
  lineUserId?: string
}

export function TeacherProfileContent({ user: propUser, onUserChange, lineUserId }: TeacherProfileContentProps) {
  const [user, setUser] = useState<User>({
    id: "",
    name: "",
    email: "",
    avatar: "",
    isLoggedIn: false,
  })

  const [showSemesterSettings, setShowSemesterSettings] = useState(false)
  const [showNotificationSettings, setShowNotificationSettings] = useState(false)
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [semesterSettings, setSemesterSettings] = useState<SemesterSettings>({
    totalWeeks: 18,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
  })

  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>({ ...DEFAULT_NOTIFICATION_SETTINGS })

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
        setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS })
        return
      }
      
      try {
        const response = await ApiService.getNotificationSettings(lineUserId)
        if (response.data) {
          setNotificationSettings(mapNotificationSettingsFromApi(response.data))
        } else {
          setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS })
        }
      } catch (error) {
        console.error('無法獲取通知設定:', error)
        setNotificationSettings({ ...DEFAULT_NOTIFICATION_SETTINGS })
      }
    }
    
    fetchNotificationSettings()
  }, [lineUserId])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("notificationSettingsChanged", {
        detail: notificationSettings,
      }),
    )
  }, [notificationSettings])

  const handleDeleteAccount = async () => {
    if (!lineUserId) {
      alert("無法獲取用戶資訊，請重新登入後再試")
      return
    }

    setIsDeleting(true)
    try {
      await ApiService.deleteAccount(lineUserId)

      const newUser = {
        id: "",
        name: "",
        email: "",
        avatar: "",
        isLoggedIn: false,
      }
      setUser(newUser)
      onUserChange?.(newUser)

      alert("帳號已成功刪除，頁面即將刷新")
      setShowDeleteAccountDialog(false)
      
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

  const handleSemesterSettingsSave = () => {
    setShowSemesterSettings(false)
    alert("學期設定已儲存！")
  }

  const handleTestNotification = () => {
    if (notificationSettings.browserNotifications) {
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification("通知測試", {
              body: "通知功能正常運作",
              icon: "/favicon.ico",
            })
          }
        })
      } else if (Notification.permission === "granted") {
        new Notification("通知測試", {
          body: "通知功能正常運作",
          icon: "/favicon.ico",
        })
      }
    }

    if (notificationSettings.lineNotifications) {
      alert("LINE 通知測試已發送")
    }

    if (!notificationSettings.browserNotifications && !notificationSettings.lineNotifications) {
      alert("請先啟用至少一種通知方式")
    }
  }

  if (showSemesterSettings) {
    return (
      <div>
        <PageHeader title="學期設定" onBack={() => setShowSemesterSettings(false)} />

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="totalWeeks">學期總週數</Label>
              <Input
                id="totalWeeks"
                type="number"
                value={semesterSettings.totalWeeks}
                onChange={(e) =>
                  setSemesterSettings({
                    ...semesterSettings,
                    totalWeeks: Number.parseInt(e.target.value) || 18,
                  })
                }
                min="1"
                max="52"
              />
            </div>

            <div>
              <Label htmlFor="startDate">學期開始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={semesterSettings.startDate}
                onChange={(e) =>
                  setSemesterSettings({
                    ...semesterSettings,
                    startDate: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="endDate">學期結束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={semesterSettings.endDate}
                onChange={(e) =>
                  setSemesterSettings({
                    ...semesterSettings,
                    endDate: e.target.value,
                  })
                }
              />
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
                      setNotificationSettings({
                        ...notificationSettings,
                        assignmentReminders: checked,
                      })
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
                      setNotificationSettings({
                        ...notificationSettings,
                        examReminders: checked,
                      })
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
                      setNotificationSettings({
                        ...notificationSettings,
                        assignmentReminderTiming: value,
                      })
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
                      setNotificationSettings({
                        ...notificationSettings,
                        examReminderTiming: value,
                      })
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
                      setNotificationSettings({
                        ...notificationSettings,
                        lineNotifications: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">瀏覽器推播</p>
                    <p className="text-sm text-muted-foreground">網頁推播通知</p>
                  </div>
                  <Switch
                    checked={notificationSettings.browserNotifications}
                    onCheckedChange={(checked) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        browserNotifications: checked,
                      })
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
                      setNotificationSettings({
                        ...notificationSettings,
                        doNotDisturbEnabled: checked,
                      })
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
                          setNotificationSettings({
                            ...notificationSettings,
                            doNotDisturbStart: e.target.value,
                          })
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
                          setNotificationSettings({
                            ...notificationSettings,
                            doNotDisturbEnd: e.target.value,
                          })
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
            <Button onClick={handleTestNotification} variant="outline" className="w-full bg-transparent">
              測試推播通知
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={async () => {
                  if (!lineUserId) {
                    alert("無法儲存設定：未找到用戶 ID")
                    return
                  }
                  
                  try {
                    await ApiService.updateNotificationSettings(lineUserId, mapNotificationSettingsToApi(notificationSettings))
                    setShowNotificationSettings(false)
                    alert("通知設定已儲存！")
                  } catch (error) {
                    console.error('儲存通知設定失敗:', error)
                    alert("儲存設定失敗，請稍後再試")
                  }
                }}
                className="flex-1"
              >
                儲存設定
              </Button>
              <Button variant="outline" onClick={() => setShowNotificationSettings(false)} className="flex-1">
                取消
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 pb-safe">
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

      {/* 升級到 Pro 卡片 */}
      <Card className="p-0 overflow-hidden rounded-2xl">
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 sm:p-8 text-white flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xl font-bold">升級到 Pro，解鎖進階功能</div>
            <div className="text-sm opacity-90">更高配額、進階提醒、AI 建議與更快同步</div>
          </div>
          <Link href="/teacher/pricing" className="shrink-0">
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
        <Link href="/teacher/me/subscriptions" className="block">
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
          <p className="text-sm">課程管理系統 - 教師版</p>
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
