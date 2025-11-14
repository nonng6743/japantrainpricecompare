import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { no_product, name_product, price_product, url_kkday, url_klook, detail } = body
    
    if (!no_product || !name_product || !price_product) {
      const missingFields = []
      if (!no_product) missingFields.push('หมายเลขสินค้า')
      if (!name_product) missingFields.push('ชื่อสินค้า')
      if (!price_product) missingFields.push('ราคาสินค้า')
      
      return NextResponse.json(
        { 
          success: false, 
          error: `กรุณากรอกข้อมูลที่จำเป็น: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Here you would typically save to database
    // For now, we'll just log the data and return success
    console.log('Received data:', {
      no_product,
      name_product,
      price_product,
      url_kkday,
      url_klook,
      detail
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว',
      data: {
        id: Date.now(), // Simulate ID
        ...body
      }
    })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}
