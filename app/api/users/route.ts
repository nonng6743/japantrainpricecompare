import { NextRequest, NextResponse } from 'next/server'
import { users } from '@/lib/database'

// GET - ดึงรายการ users
export async function GET(request: NextRequest) {
  try {
    // ตรวจสอบ Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // ลบ "Bearer " ออก
    console.log('Received token:', token)

    // ตรวจสอบ token (ใน production ควร verify JWT token)
    if (!token || token === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // ไม่ส่ง password กลับไป
    const usersWithoutPassword = users.map(({ password, ...user }) => user)
    
    return NextResponse.json({
      success: true,
      users: usersWithoutPassword,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}

// POST - เพิ่ม user ใหม่ (ใช้สำหรับการจัดการ user โดย admin)
export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing or invalid token' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    // ตรวจสอบ token
    if (!token || token === 'undefined') {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

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

    const newUser = {
      id: users.length + 1,
      username,
      email,
      password,
      firstName,
      lastName,
      role: role || 'user',
      lastLogin: lastLogin || null,
      createdAt: new Date().toISOString()
    }

    users.push(newUser)

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    )
  }
}