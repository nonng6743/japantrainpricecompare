"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock, User, LogIn } from "lucide-react"
import { apiUrl } from "@/lib/env"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch(apiUrl("api/users/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log("📥 Login response data:", data)

      if (response.ok && data.success && data.data) {
        const { token, user } = data.data

        // กรอง lineUserId ออกก่อนบันทึก
        const { lineUserId, ...userWithoutLineUserId } = user || {}

        // บันทึก token / user (ไม่มี lineUserId)
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(userWithoutLineUserId))

        document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`

        console.log("✅ Saved user (without lineUserId):", userWithoutLineUserId)
        console.log("✅ Saved token:", token)

        // หน่วงเวลาเล็กน้อยก่อน redirect
        setTimeout(() => {
          router.push("/profile")
        }, 400)
      } else {
        setError(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      }
    } catch (err) {
      console.error("❌ Login error:", err)
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-full">
              <Lock className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">
            เข้าสู่ระบบ
          </CardTitle>
          <p className="text-sm text-gray-600">
            กรุณาเข้าสู่ระบบเพื่อจัดการข้อมูลของคุณ
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {/* แสดง error message */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ช่องกรอกอีเมล */}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* ปุ่มเข้าสู่ระบบ */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>

            <div className="text-center text-sm text-gray-600 mt-4">
              <p>ทดสอบ: admin@example.com / admin123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
