import { NextRequest, NextResponse } from 'next/server'
import { apiUrl } from '@/lib/env'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // ส่งข้อมูลไปยัง backend ที่ระบบหลัก
    const backendResponse = await fetch(apiUrl('api/users/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok || !backendData.success) {
      return NextResponse.json(
        { success: false, error: backendData.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' },
        { status: backendResponse.status }
      )
    }

    // ส่งข้อมูลจาก backend กลับไปยัง frontend
    const userData = backendData.data?.user || backendData.user || backendData
    const token = backendData.data?.token || backendData.token || 'mock-token'
    
    return NextResponse.json({
      success: true,
      token: token,
      user: userData,
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ' },
      { status: 500 }
    )
  }
}
