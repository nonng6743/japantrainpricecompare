import { NextRequest, NextResponse } from 'next/server'
import { users } from '@/lib/database'

// PUT - อัปเดตข้อมูล user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const { firstName, lastName, email } = await request.json()

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'รูปแบบอีเมลไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // Find user
    const userIndex = users.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Check if email is already used by another user
    const existingUser = users.find(u => u.email === email && u.id !== userId)
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Update user
    users[userIndex] = {
      ...users[userIndex],
      firstName,
      lastName,
      email,
    }

    // Return updated user without password
    const { password: _, ...userWithoutPassword } = users[userIndex]

    return NextResponse.json({
      success: true,
      message: 'อัปเดตข้อมูลสำเร็จ',
      user: userWithoutPassword,
    })

  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' },
      { status: 500 }
    )
  }
}

// GET - ดึงข้อมูล user ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id)
    const user = users.find(u => u.id === userId)

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบผู้ใช้' },
        { status: 404 }
      )
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })

  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}