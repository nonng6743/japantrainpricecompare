"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { User, Calendar, Shield, Edit, Save, X } from "lucide-react"
import { apiUrl } from "@/lib/env"

interface UserProfile {
  id: string | number
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  lastLogin?: string | null
  createdAt?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  // ✅ โหลดข้อมูลผู้ใช้จาก localStorage
  useEffect(() => {
    if (typeof window === "undefined") return

    const loadUserData = () => {
      const token = localStorage.getItem("token")
      const userData = localStorage.getItem("user")

      console.log("Token:", token)
      console.log("User data from localStorage:", userData)

      if (!token || !userData) {
        console.warn("❌ ไม่มีข้อมูล token หรือ user — redirect ไปหน้า login")
        setLoading(false)
        router.push("/login")
        return
      }

      try {
        const parsedUser = JSON.parse(userData)
        console.log("✅ Parsed user object:", parsedUser)

        const formattedUser: UserProfile = {
          id: parsedUser._id || parsedUser.id || 0,
          username: parsedUser.username || "ไม่ระบุ",
          email: parsedUser.email || "",
          firstName: parsedUser.firstName || "",
          lastName: parsedUser.lastName || "",
          role: parsedUser.role || "user",
          lastLogin: parsedUser.lastLogin || null,
          createdAt: parsedUser.createdAt || new Date().toISOString(),
        }

        setUser(formattedUser)
        setFormData({
          firstName: formattedUser.firstName,
          lastName: formattedUser.lastName,
          email: formattedUser.email,
        })
      } catch (error) {
        console.error("❌ Error parsing user data:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    // ✅ รอให้ localStorage sync เสร็จก่อน (หลัง redirect จาก login)
    setTimeout(loadUserData, 200)
  }, [router])

  // แก้ไขข้อมูล
  const handleEdit = () => setIsEditing(true)
  const handleCancel = () => {
    setIsEditing(false)
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      })
    }
  }

  const handleSave = async () => {
    if (!user) return

    if (!localStorage.getItem("token")) {
      alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง")
      router.push("/login")
      return
    }

    try {
      const response = await fetch(apiUrl(`api/users/${user.id}`), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        const updatedUser = { ...user, ...formData }
        localStorage.setItem("user", JSON.stringify(updatedUser))
        setUser(updatedUser)
        setIsEditing(false)
        alert("✅ บันทึกข้อมูลสำเร็จ")
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก")
      }
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">ไม่พบข้อมูลผู้ใช้ กรุณาเข้าสู่ระบบใหม่</p>
          <Button onClick={() => router.push("/login")} className="bg-blue-600 hover:bg-blue-700">
            ไปที่หน้าเข้าสู่ระบบ
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <User className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">โปรไฟล์ผู้ใช้</h1>
          <p className="text-lg text-gray-600">จัดการข้อมูลส่วนตัวของคุณ</p>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              <strong>ข้อมูลจริง:</strong> กำลังแสดงข้อมูลจากระบบ Login
            </p>
            <p className="text-green-700 text-xs mt-1">
              ID: {user.id} | Username: {user.username} | Role: {user.role}
            </p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                ข้อมูลส่วนตัว
              </CardTitle>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  แก้ไข
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    บันทึก
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    ยกเลิก
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <Label className="text-sm font-medium text-gray-600">ชื่อผู้ใช้</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-medium">{user.username}</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <Label className="text-sm font-medium text-gray-600">สิทธิ์</Label>
                <div className="mt-1">
                  <Badge
                    variant={user.role === "admin" ? "default" : "secondary"}
                    className="text-sm"
                  >
                    <Shield className="h-3 w-3 mr-1" />
                    {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                  </Badge>
                </div>
              </div>

              {/* First Name */}
              <div>
                <Label className="text-sm font-medium text-gray-600">ชื่อจริง</Label>
                {isEditing ? (
                  <Input
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{user.firstName}</span>
                  </div>
                )}
              </div>

              {/* Last Name */}
              <div>
                <Label className="text-sm font-medium text-gray-600">นามสกุล</Label>
                {isEditing ? (
                  <Input
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{user.lastName}</span>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <Label className="text-sm font-medium text-gray-600">อีเมล</Label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg">{user.email}</span>
                  </div>
                )}
              </div>

              {/* Last Login */}
              <div>
                <Label className="text-sm font-medium text-gray-600">เข้าสู่ระบบล่าสุด</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">
                    {user.lastLogin ? formatDate(user.lastLogin) : "ไม่เคยเข้าสู่ระบบ"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              ข้อมูลบัญชี
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm font-medium text-gray-600">วันที่สร้างบัญชี</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">
                    {user.createdAt ? formatDate(user.createdAt) : "ไม่ระบุ"}
                  </span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">ID ผู้ใช้</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-mono break-all">{user.id}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
