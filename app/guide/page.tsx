import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Users, 
  Star, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Info,
  Zap,
  Clock,
  Shield
} from "lucide-react"

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Info className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            คู่มือการใช้งาน
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            เรียนรู้วิธีการใช้งานแพลตฟอร์มเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่น
            เพื่อให้คุณได้ประโยชน์สูงสุด
          </p>
        </div>

        {/* Quick Start */}
        <Card className="mb-8 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Zap className="h-5 w-5" />
              เริ่มต้นใช้งานใน 3 ขั้นตอน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  1
                </div>
                <h3 className="font-semibold mb-2">ค้นหาตั๋ว</h3>
                <p className="text-sm text-gray-600">
                  ใช้ช่องค้นหาหรือตัวกรองเพื่อหาตั๋วที่ต้องการ
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  2
                </div>
                <h3 className="font-semibold mb-2">เปรียบเทียบราคา</h3>
                <p className="text-sm text-gray-600">
                  ดูราคาจากผู้จำหน่ายต่างๆ และเลือกที่ดีที่สุด
                </p>
              </div>
              <div className="text-center">
                <div className="bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3 text-sm font-bold">
                  3
                </div>
                <h3 className="font-semibold mb-2">ซื้อตั๋ว</h3>
                <p className="text-sm text-gray-600">
                  คลิกปุ่มซื้อเพื่อไปยังเว็บไซต์ผู้จำหน่าย
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Guide */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">ฟีเจอร์ต่างๆ</h2>
          
          <div className="space-y-6">
            {/* Search Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  การค้นหา
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">ค้นหาด้วยชื่อ</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      พิมพ์ชื่อตั๋วที่ต้องการ เช่น "JR Pass", "Kansai Pass" 
                      ระบบจะค้นหาตั๋วที่ตรงกับคำที่คุณพิมพ์
                    </p>
                    <Badge variant="outline" className="text-xs">ตัวอย่าง: JR Pass 7 วัน</Badge>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">ค้นหาด้วยภาษาอังกฤษ</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      สามารถค้นหาด้วยชื่อภาษาอังกฤษได้เช่นกัน
                    </p>
                    <Badge variant="outline" className="text-xs">ตัวอย่าง: JR Pass 7 Days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filter Feature */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-purple-600" />
                  ตัวกรอง
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      จำนวนวัน
                    </h3>
                    <p className="text-gray-600 text-sm">
                      กรองตามระยะเวลาการใช้งาน: 3, 5, 7, 14 วัน
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      ภูมิภาค
                    </h3>
                    <p className="text-gray-600 text-sm">
                      เลือกภูมิภาค: ทั่วประเทศ, JR East, Kansai, Hokuriku
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      ประเภทราคา
                    </h3>
                    <p className="text-gray-600 text-sm">
                      เลือกราคาผู้ใหญ่หรือเด็ก
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      เฉพาะลดราคา
                    </h3>
                    <p className="text-gray-600 text-sm">
                      แสดงเฉพาะตั๋วที่มีการลดราคา
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  การเปรียบเทียบราคา
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">ราคาดีที่สุด</h3>
                    <p className="text-gray-600 text-sm mb-3">
                      ระบบจะแสดงราคาที่ดีที่สุดด้วยสีเขียวและป้าย "ดีที่สุด"
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Klook</span>
                        <Badge className="bg-green-500">ดีที่สุด</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">ผู้จำหน่าย</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                        <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">K</span>
                        </div>
                        <span className="text-sm">Klook</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-red-50 rounded">
                        <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">KK</span>
                        </div>
                        <span className="text-sm">KKday</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                        <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
                          <span className="text-white text-xs font-bold">JP</span>
                        </div>
                        <span className="text-sm">JapanAllPass</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tips & Tricks */}
        <Card className="mb-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Zap className="h-5 w-5" />
              เคล็ดลับการใช้งาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">ตรวจสอบราคาล่าสุด</h3>
                    <p className="text-sm text-gray-600">
                      ราคาอัปเดตทุกชั่วโมง ควรตรวจสอบก่อนซื้อ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">เปรียบเทียบหลายตัวเลือก</h3>
                    <p className="text-sm text-gray-600">
                      ดูราคาจากผู้จำหน่ายทั้งหมดก่อนตัดสินใจ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">ใช้ตัวกรองให้เป็นประโยชน์</h3>
                    <p className="text-sm text-gray-600">
                      กรองตามความต้องการเพื่อหาตั๋วที่เหมาะสม
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">ตรวจสอบเงื่อนไข</h3>
                    <p className="text-sm text-gray-600">
                      อ่านเงื่อนไขการใช้งานตั๋วก่อนซื้อ
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">จองล่วงหน้า</h3>
                    <p className="text-sm text-gray-600">
                      ตั๋วบางประเภทควรจองล่วงหน้าเพื่อความแน่นอน
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">เก็บหลักฐานการซื้อ</h3>
                    <p className="text-sm text-gray-600">
                      เก็บอีเมลยืนยันและเอกสารการซื้อไว้
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              คำถามที่พบบ่อย
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">ราคาที่แสดงเป็นราคาล่าสุดหรือไม่?</h3>
                <p className="text-gray-600 text-sm">
                  ใช่ ราคาอัปเดตทุกชั่วโมงเพื่อให้คุณได้ข้อมูลล่าสุดเสมอ
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ต้องจ่ายค่าบริการเพิ่มเติมหรือไม่?</h3>
                <p className="text-gray-600 text-sm">
                  ไม่ เราให้บริการเปรียบเทียบราคาฟรี 100% ไม่มีค่าใช้จ่ายใดๆ
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ซื้อตั๋วได้ที่ไหน?</h3>
                <p className="text-gray-600 text-sm">
                  คลิกปุ่ม "ซื้อ" เพื่อไปยังเว็บไซต์ผู้จำหน่ายโดยตรง 
                  การซื้อจะทำที่เว็บไซต์ของผู้จำหน่าย
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">ราคาอาจเปลี่ยนแปลงหรือไม่?</h3>
                <p className="text-gray-600 text-sm">
                  ราคาอาจเปลี่ยนแปลงได้ตามผู้จำหน่าย 
                  ควรตรวจสอบราคาล่าสุดก่อนซื้อเสมอ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-4">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
              <p className="text-blue-100 mb-6">
                เริ่มเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่นได้เลย
              </p>
              <Button asChild size="lg" variant="secondary">
                <a href="/home">
                  <Search className="h-4 w-4 mr-2" />
                  เริ่มเปรียบเทียบราคา
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
