"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Shield,
  User as UserIcon,
} from "lucide-react"

interface User {
  id?: number
  _id?: string
  username: string
  email: string
  firstName: string
  lastName: string
  role: string
  lastLogin?: string | null
  createdAt?: string
}

export default function AdminPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user",
  })

  // 🔹 ตรวจสอบ token และดึงข้อมูล
  useEffect(() => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")

    if (!token || !user) {
      router.push("/login")
      return
    }

    try {
      const parsed = JSON.parse(user)
      setCurrentUser(parsed)
      fetchUsers(token)
    } catch (err) {
      console.error("Error parsing user:", err)
      router.push("/login")
    }
  }, [router])

  // 🔹 ดึงข้อมูลจาก backend จริง
  const fetchUsers = async (token: string) => {
    try {
      console.log("🔍 Fetching users from /api/users")
      const response = await fetch("/api/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      
      console.log("📡 Response status:", response.status)
      const data = await response.json()
      console.log("📦 Users fetched:", data)

      if (data.success && data.users) {
        setUsers(data.users)
      } else if (Array.isArray(data)) {
        // กรณี backend ส่ง array ตรง ๆ
        setUsers(data)
      } else {
        console.warn("⚠️ Unexpected data format:", data)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0"
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  // 🔹 เพิ่มผู้ใช้
  const handleAddUser = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:4000/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setIsAddDialogOpen(false)
        setFormData({
          username: "",
          email: "",
          password: "",
          firstName: "",
          lastName: "",
          role: "user",
        })
        fetchUsers(token!)
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้")
      }
    } catch (error) {
      console.error("Error adding user:", error)
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
    }
  }

  // 🔹 แก้ไขผู้ใช้
  const handleEditUser = async () => {
    if (!selectedUser) return
    const token = localStorage.getItem("token")

    try {
      const response = await fetch(
        `http://localhost:4000/api/users/${selectedUser._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()
      if (data.success) {
        setIsEditDialogOpen(false)
        setSelectedUser(null)
        fetchUsers(token!)
      } else {
        alert(data.error || "ไม่สามารถอัปเดตผู้ใช้ได้")
      }
    } catch (error) {
      console.error("Error editing user:", error)
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
    }
  }

  // 🔹 ลบผู้ใช้
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("ต้องการลบผู้ใช้นี้หรือไม่?")) return
    const token = localStorage.getItem("token")

    try {
      const response = await fetch(`http://localhost:4000/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (data.success) {
        fetchUsers(token!)
      } else {
        alert(data.error || "ไม่สามารถลบผู้ใช้ได้")
      }
    } catch (error) {
      console.error("Error deleting user:", error)
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
    }
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: "",
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    })
    setIsEditDialogOpen(true)
  }

  if (!currentUser) {
    return <div className="flex items-center justify-center min-h-screen">กำลังโหลด...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">จัดการผู้ใช้</h1>
              <div className="text-gray-600">
                ยินดีต้อนรับ, {currentUser.firstName || currentUser.username}
                <Badge variant="secondary" className="ml-2">
                  {currentUser.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              ออกจากระบบ
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</p>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ผู้ดูแลระบบ</p>
                  <p className="text-3xl font-bold text-green-600">
                    {users.filter((u) => u.role === "admin").length}
                  </p>
                </div>
                <Shield className="h-12 w-12 text-green-600 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">ผู้ใช้ทั่วไป</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {users.filter((u) => u.role === "user").length}
                  </p>
                </div>
                <UserIcon className="h-12 w-12 text-purple-600 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>รายการผู้ใช้ทั้งหมด</CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    เพิ่มผู้ใช้
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                    <DialogDescription>กรอกข้อมูลผู้ใช้ใหม่</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="add-username">ชื่อผู้ใช้</Label>
                      <Input
                        id="add-username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-email">อีเมล</Label>
                      <Input
                        id="add-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-password">รหัสผ่าน</Label>
                      <Input
                        id="add-password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="add-firstname">ชื่อจริง</Label>
                        <Input
                          id="add-firstname"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-lastname">นามสกุล</Label>
                        <Input
                          id="add-lastname"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="add-role">สิทธิ์</Label>
                      <select
                        id="add-role"
                        className="w-full border rounded-md p-2"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="user">ผู้ใช้ทั่วไป</option>
                        <option value="admin">ผู้ดูแลระบบ</option>
                      </select>
                    </div>
                    <Button onClick={handleAddUser} className="w-full">
                      เพิ่มผู้ใช้
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>ชื่อผู้ใช้</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>ชื่อจริง</TableHead>
                  <TableHead>นามสกุล</TableHead>
                  <TableHead>สิทธิ์</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user, index) => (
                  <TableRow key={user._id || user.id || `user-${index}`}>
                    <TableCell>{user._id || user.id}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.firstName}</TableCell>
                    <TableCell>{user.lastName}</TableCell>
                    <TableCell>
                      <Badge
                        variant={user.role === "admin" ? "default" : "secondary"}
                      >
                        {user.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ใช้ทั่วไป"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteUser(user._id || user.id?.toString() || '')}
                          disabled={user._id === currentUser._id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
