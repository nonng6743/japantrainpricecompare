"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Zap, Home, Info, BookOpen, Mail, Package, LogIn, LogOut, User } from "lucide-react"

const navigation = [
  { name: "หน้าหลัก", href: "/", icon: Home },
  { name: "สินค้าจาก API", href: "/products", icon: Package },
  { name: "เกี่ยวกับเรา", href: "/about", icon: Info },
  { name: "คู่มือการใช้งาน", href: "/guide", icon: BookOpen },
  { name: "ติดต่อเรา", href: "/addCompare", icon: Mail },
]

export function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState("")

  useEffect(() => {
    // ตรวจสอบว่า login แล้วหรือยัง
    const token = localStorage.getItem("token")
    const user = localStorage.getItem("user")
    
    if (token && user) {
      setIsLoggedIn(true)
      const userData = JSON.parse(user)
      setUserName(userData.name)
    }
  }, [])

  const handleLogout = () => {
    // ลบ cookie
    document.cookie = "token=; path=/; max-age=0"
    // ลบ localStorage
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setIsLoggedIn(false)
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
            {isLoggedIn ? (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {userName}
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
