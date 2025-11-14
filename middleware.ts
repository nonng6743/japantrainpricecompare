import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // อนุญาตให้เข้าถึงทุกหน้าได้โดยไม่ต้อง login
  // ยกเว้นเฉพาะหน้า admin ที่ต้อง login
  const protectedPaths = ['/admin']
  
  // ตรวจสอบว่าเป็นหน้า protected หรือไม่
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  
  // ดึง token จาก cookie
  const token = request.cookies.get('token')?.value
  
  // ถ้าไม่มี token และเป็นหน้า protected ให้ redirect ไป login
  if (!token && isProtectedPath && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // ถ้ามี token แล้วพยายามเข้าหน้า login ให้ redirect ไปหน้าหลัก
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
