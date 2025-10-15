import { NextRequest, NextResponse } from 'next/server'

// Mock users database (ในการใช้งานจริงควรเชื่อมต่อกับ database)
let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'ผู้ดูแลระบบ' },
  { id: 2, username: 'user', password: 'user123', role: 'user', name: 'ผู้ใช้ทั่วไป' },
]

let nextId = 3

// GET - ดึงรายการ users
export async function GET() {
  try {
    // ไม่ส่ง password กลับไป
    const usersWithoutPassword = users.map(({ password, ...user }) => user)
    
    return NextResponse.json({
      success: true,
      users: usersWithoutPassword,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST - เพิ่ม user ใหม่
export async function POST(request: NextRequest) {
  try {
    const { username, password, name, role } = await request.json()

    // ตรวจสอบว่า username ซ้ำหรือไม่
    if (users.find((u) => u.username === username)) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    const newUser = {
      id: nextId++,
      username,
      password,
      name,
      role: role || 'user',
    }

    users.push(newUser)

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, username: newUser.username, name: newUser.name, role: newUser.role },
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
