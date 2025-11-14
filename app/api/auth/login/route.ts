import { NextRequest, NextResponse } from 'next/server'

// Mock users (ในการใช้งานจริงควรเชื่อมต่อกับ database)
const users = [
  { 
    id: 1, 
    username: 'admin', 
    email: 'admin@example.com',
    password: 'admin123', 
    role: 'admin', 
    firstName: 'ผู้ดูแล',
    lastName: 'ระบบ',
    lastLogin: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 2, 
    username: 'user', 
    email: 'user@example.com',
    password: 'user123', 
    role: 'user', 
    firstName: 'ผู้ใช้',
    lastName: 'ทั่วไป',
    lastLogin: null,
    createdAt: new Date().toISOString()
  },
]

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // ตรวจสอบ email และ password
    const user = users.find(
      (u) => u.email === email && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // อัปเดต lastLogin
    user.lastLogin = new Date().toISOString()

    // สร้าง token (ในการใช้งานจริงควรใช้ JWT)
    const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64')

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      token,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}
