import { NextRequest, NextResponse } from 'next/server'

// Mock users (ในการใช้งานจริงควรเชื่อมต่อกับ database)
const users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'ผู้ดูแลระบบ' },
  { id: 2, username: 'user', password: 'user123', role: 'user', name: 'ผู้ใช้ทั่วไป' },
]

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    // ตรวจสอบ username และ password
    const user = users.find(
      (u) => u.username === username && u.password === password
    )

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      )
    }

    // สร้าง token (ในการใช้งานจริงควรใช้ JWT)
    const token = Buffer.from(`${user.id}:${user.username}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}
