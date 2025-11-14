import { NextRequest, NextResponse } from "next/server"

const KLOOK_URL = "https://www.klook.com/v1/experiencesrv/order/settlement_service/pre_settlement"

type ClientHeaders = {
  _pt?: string
  kepler_id?: string
  cookie?: string
  [key: string]: any
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      arrangement_id,
      sku_list,
      page_from = 2,
      currency = "THB",
      headers: clientHeaders = {},
    }: {
      arrangement_id?: string
      sku_list?: any[]
      page_from?: number
      currency?: string
      headers?: ClientHeaders
    } = body ?? {}

    if (!arrangement_id) {
      return NextResponse.json({ success: false, error: "กรุณาระบุ arrangement_id" }, { status: 400 })
    }

    if (!Array.isArray(sku_list) || sku_list.length === 0) {
      return NextResponse.json({ success: false, error: "sku_list ต้องเป็น array และมีอย่างน้อย 1 รายการ" }, { status: 400 })
    }

    const pt = (clientHeaders._pt ?? process.env.KLOOK_PT ?? "").toString().trim()
    const kepler = (clientHeaders.kepler_id ?? process.env.KLOOK_KEPLER_ID ?? "").toString().trim()
    const cookie = (clientHeaders.cookie ?? process.env.KLOOK_COOKIE ?? "").toString().trim()

    if (!pt || !kepler || !cookie) {
      return NextResponse.json(
        {
          success: false,
          error: "configuration ไม่ครบ กรุณาตั้งค่า _pt, kepler_id, cookie (ผ่าน body.headers หรือ .env)",
        },
        { status: 500 }
      )
    }

    const response = await fetch(KLOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json, text/plain, */*",
        "accept-language": "en_US",
        "cache-control": "no-cache",
        currency,
        "x-platform": "desktop",
        "x-klook-market": "global",
        "x-klook-host": "www.klook.com",
        "x-klook-traffic-channel": clientHeaders["x-klook-traffic-channel"] ?? process.env.KLOOK_TRAFFIC_CHANNEL ?? "aid_103587",
        "x-klook-affiliate-aid": clientHeaders["x-klook-affiliate-aid"] ?? process.env.KLOOK_AFFILIATE_AID ?? "103587",
        "x-klook-user-residence": clientHeaders["x-klook-user-residence"] ?? process.env.KLOOK_USER_RESIDENCE ?? "4_TH",
        _pt: pt,
        "x-klook-kepler-id": kepler,
        cookie,
      },
      body: JSON.stringify({
        page_from,
        arrangement_id,
        sku_list,
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      console.error("Klook API error:", text)
      return NextResponse.json(
        {
          success: false,
          error: `Klook API error (${response.status})`,
          detail: text,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ success: true, result: data.result, raw: data })
  } catch (error) {
    console.error("Klook proxy error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
      },
      { status: 500 }
    )
  }
}
