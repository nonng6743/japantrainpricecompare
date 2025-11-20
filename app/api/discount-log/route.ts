import { NextRequest, NextResponse } from 'next/server'
import { apiUrl } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    // ดึง query parameters จาก request
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '50'

    // สร้าง query string สำหรับ backend
    const queryParams = new URLSearchParams({
      page,
      limit,
    })

    // เรียก backend API
    const backendUrl = `${apiUrl('api/discount-log')}?${queryParams.toString()}`
    console.log('🔍 Calling backend API:', backendUrl)

    const backendResponse = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const backendData = await backendResponse.json()

    if (!backendResponse.ok) {
      return NextResponse.json(
        { 
          success: false, 
          error: backendData.error || `Backend API Error: ${backendResponse.status}` 
        },
        { status: backendResponse.status }
      )
    }

    // ส่งข้อมูลจาก backend กลับไปยัง frontend
    return NextResponse.json(backendData)

  } catch (error) {
    console.error('Discount log API error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ backend' },
      { status: 500 }
    )
  }
}

