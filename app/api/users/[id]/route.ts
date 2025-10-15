import { NextRequest, NextResponse } from 'next/server'

// Mock users database (ใช้ตัวแปรเดียวกับ route.ts หลัก)
// ในการใช้งานจริงควรเชื่อมต่อกับ database
let users = [
  { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'ผู้ดูแลระบบ' },
  { id: 2, username: 'user', password: 'user123', role: 'user', name: 'ผู้ใช้ทั่วไป' },
]

// PUT - แก้ไข user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { username, password, name, role } = await request.json()

    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // ตรวจสอบว่า username ซ้ำกับคนอื่นหรือไม่
    const existingUser = users.find((u) => u.username === username && u.id !== id)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // อัปเดตข้อมูล
    users[userIndex] = {
      ...users[userIndex],
      username,
      name,
      role,
      // อัปเดต password ถ้ามีการส่งมา
      ...(password && { password }),
    }

    const { password: _, ...userWithoutPassword } = users[userIndex]

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// DELETE - ลบ user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    const userIndex = users.findIndex((u) => u.id === id)
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    users.splice(userIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'ลบผู้ใช้สำเร็จ',
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}
