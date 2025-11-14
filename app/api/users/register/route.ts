import { NextRequest, NextResponse } from 'next/server'
import { users, nextId } from '@/lib/database'

// POST - Register new user
export async function POST(request: NextRequest) {
  try {
    const { 
      username, 
      email, 
      password, 
      firstName, 
      lastName, 
      role, 
      lastLogin 
    } = await request.json()

    // Validate required fields
    if (!username || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      )
    }

    // Check if username already exists
    if (users.find((u) => u.username === username)) {
      return NextResponse.json(
        { success: false, error: 'ชื่อผู้ใช้นี้มีอยู่แล้ว' },
        { status: 400 }
      )
    }

    // Check if email already exists
    if (users.find((u) => u.email === email)) {
      return NextResponse.json(
        { success: false, error: 'อีเมลนี้มีอยู่แล้ว' },
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

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['admin', 'user', 'moderator']
    const userRole = role && validRoles.includes(role) ? role : 'user'

    const newUser = {
      id: nextId++,
      username,
      email,
      password, // ใน production ควร hash password
      firstName,
      lastName,
      role: userRole,
      lastLogin: lastLogin || null,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      message: 'สมัครสมาชิกสำเร็จ',
      user: userWithoutPassword,
    }, { status: 201 })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    )
  }
}
