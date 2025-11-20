"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Zap, Home, Package, LogIn, LogOut, User, TrendingUp, Clock, TrendingDown } from "lucide-react"

const navigation = [
  { name: "หน้าหลัก", href: "/", icon: Home },
  { name: "สินค้าจาก API", href: "/products", icon: Package },
  { name: "ประวัติราคา", href: "/price-log", icon: Clock },
  { name: "ประวัติส่วนลด", href: "/discount-log", icon: TrendingDown },
  { name: "เทียมราคา", href: "/addCompare", icon: TrendingUp },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")
  const [userRole, setUserRole] = useState("")

  useEffect(() => {
    // ตรวจสอบว่า login แล้วหรือยัง (ตรวจสอบ localStorage ก่อน)
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    
    if (token && user && user !== 'null' && user !== 'undefined' && user !== '') {
      setIsLoggedIn(true)
      try {
        const userData = JSON.parse(user)
        // กรอง lineUserId ออกก่อนแสดง
        const { lineUserId, ...userWithoutLineUserId } = userData
        // ใช้ firstName และ lastName หรือ username ถ้าไม่มี
        setUserName(userWithoutLineUserId.firstName && userWithoutLineUserId.lastName 
          ? `${userWithoutLineUserId.firstName} ${userWithoutLineUserId.lastName}`
          : userWithoutLineUserId.username || userWithoutLineUserId.email || 'ผู้ใช้'
        )
        console.log('userData.role'+userWithoutLineUserId.role)
        setUserRole(userWithoutLineUserId.role || '')
      } catch (error) {
        console.error('Error parsing user data:', error)
        setUserName('ผู้ใช้')
        setUserRole('')
        // ลบข้อมูลที่เสียออกจาก localStorage
        localStorage.removeItem("user")
        localStorage.removeItem("token")
        setIsLoggedIn(false)
      }
    } else {
      setIsLoggedIn(false)
      setUserName("")
      setUserRole("")
    }
  }, [])

  const handleLogout = () => {
    // ลบ cookie
    if (typeof document !== 'undefined') {
      document.cookie = "token=; path=/; max-age=0"
    }
    // ลบ localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
    setIsLoggedIn(false)
    setUserName("")
    setUserRole("")
    router.push("/login")
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
            <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
              <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                เปรียบเทียบราคาตั๋วรถไฟญี่ปุ่น
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                เปรียบเทียบราคาจาก Klook, KKday และ JapanAllPass
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={pathname === item.href ? "default" : "ghost"}
                    className={cn(
                      "flex items-center gap-2",
                      pathname === item.href && "bg-blue-600 text-white"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
            
            {/* User Info & Logout */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              {/* แสดงเมนู Admin เฉพาะเมื่อ user มี role เป็น admin */}
              {isLoggedIn && userRole === "admin" && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    จัดการผู้ใช้
                  </Button>
                </Link>
              )}
              
              {/* เมนูโปรไฟล์ - แสดงเสมอ */}
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  โปรไฟล์
                </Button>
              </Link>
              
              {/* แสดงข้อมูล user ถ้า login แล้ว */}
              {isLoggedIn ? (
                <>
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {userName}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    เข้าสู่ระบบ
                  </Button>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  {navigation.map((item) => {
                    const Icon = item.icon
                    return (
                      <Link key={item.name} href={item.href}>
                        <Button
                          variant={pathname === item.href ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-3",
                            pathname === item.href && "bg-blue-600 text-white"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Button>
                      </Link>
                    )
                  })}
                  
                  {/* เมนูโปรไฟล์ - แสดงเสมอ */}
                  <Link href="/profile">
                    <Button
                      variant={pathname === "/profile" ? "default" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3",
                        pathname === "/profile" && "bg-blue-600 text-white"
                      )}
                    >
                      <User className="h-4 w-4" />
                      โปรไฟล์
                    </Button>
                  </Link>
                  
                  {/* แสดงเมนู Admin เฉพาะเมื่อ user มี role เป็น admin */}
                  {isLoggedIn && userRole === "admin" && (
                    <Link href="/admin">
                      <Button
                        variant={pathname === "/admin" ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3",
                          pathname === "/admin" && "bg-blue-600 text-white"
                        )}
                      >
                        <User className="h-4 w-4" />
                        จัดการผู้ใช้
                      </Button>
                    </Link>
                  )}
                  
                  {/* User Info & Logout สำหรับ Mobile */}
                  {isLoggedIn ? (
                    <>
                      <div className="border-t pt-4 mt-4">
                        <div className="text-sm text-gray-600 mb-2">
                          เข้าสู่ระบบเป็น: {userName}
                        </div>
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3"
                          onClick={handleLogout}
                        >
                          <LogOut className="h-4 w-4" />
                          ออกจากระบบ
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="border-t pt-4 mt-4">
                      <Link href="/login">
                        <Button
                          variant="outline"
                          className="w-full justify-start gap-3"
                        >
                          <LogIn className="h-4 w-4" />
                          เข้าสู่ระบบ
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
