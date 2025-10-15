import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, Target, Users, Shield, Clock, Globe, TrendingUp, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Zap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            เกี่ยวกับเรา
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            เราเป็นแพลตฟอร์มเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่นที่ช่วยให้คุณหาตั๋วที่เหมาะสมที่สุด
            ในราคาที่ดีที่สุดจากผู้จำหน่ายที่น่าเชื่อถือ
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                ภารกิจของเรา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                เรามุ่งมั่นที่จะช่วยให้นักท่องเที่ยวชาวไทยสามารถเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่น
                จากผู้จำหน่ายต่างๆ ได้อย่างง่ายดาย และเลือกซื้อตั๋วที่เหมาะสมกับงบประมาณและแผนการเดินทาง
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-green-600" />
                วิสัยทัศน์
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 leading-relaxed">
                เป็นแพลตฟอร์มเปรียบเทียบราคาตั๋วรถไฟญี่ปุ่นอันดับ 1 ของประเทศไทย
                ที่ให้บริการข้อมูลราคาที่แม่นยำและอัปเดตแบบเรียลไทม์
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">จุดเด่นของเรา</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-blue-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">อัปเดตราคาแบบเรียลไทม์</h3>
                <p className="text-gray-600 text-sm">
                  ราคาอัปเดตทุกชั่วโมงเพื่อให้คุณได้ข้อมูลล่าสุดเสมอ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-green-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">เปรียบเทียบราคาอัตโนมัติ</h3>
                <p className="text-gray-600 text-sm">
                  ระบบจะหาผู้จำหน่ายที่ให้ราคาดีที่สุดให้คุณอัตโนมัติ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-purple-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">ผู้จำหน่ายที่น่าเชื่อถือ</h3>
                <p className="text-gray-600 text-sm">
                  เปรียบเทียบจากผู้จำหน่ายที่มีชื่อเสียงและน่าเชื่อถือ
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-orange-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">ใช้งานง่าย</h3>
                <p className="text-gray-600 text-sm">
                  อินเทอร์เฟซที่ใช้งานง่าย เหมาะสำหรับทุกวัย
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-red-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">ฟรี 100%</h3>
                <p className="text-gray-600 text-sm">
                  ไม่มีค่าใช้จ่ายใดๆ ในการใช้งานแพลตฟอร์มของเรา
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-indigo-100 p-3 rounded-full w-fit mx-auto mb-4">
                  <Zap className="h-6 w-6 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">รวดเร็ว</h3>
                <p className="text-gray-600 text-sm">
                  ระบบทำงานเร็วและเสถียร ให้ประสบการณ์ที่ดีที่สุด
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Partners */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">ผู้จำหน่ายที่เราเปรียบเทียบ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">K</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">Klook</h3>
                <p className="text-gray-600 text-sm">
                  แพลตฟอร์มท่องเที่ยวออนไลน์ชั้นนำของเอเชีย
                </p>
                <Badge variant="outline" className="mt-3">ผู้จำหน่ายหลัก</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">KK</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">KKday</h3>
                <p className="text-gray-600 text-sm">
                  ผู้ให้บริการทัวร์และกิจกรรมท่องเที่ยว
                </p>
                <Badge variant="outline" className="mt-3">ผู้จำหน่ายหลัก</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-xl font-bold">JP</span>
                </div>
                <h3 className="font-semibold text-lg mb-2">JapanAllPass</h3>
                <p className="text-gray-600 text-sm">
                  ผู้เชี่ยวชาญตั๋วรถไฟญี่ปุ่นโดยเฉพาะ
                </p>
                <Badge variant="outline" className="mt-3">ผู้จำหน่ายหลัก</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">ทำไมต้องเลือกเรา?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-blue-900">ประหยัดเวลา</h3>
                <p className="text-gray-700">
                  ไม่ต้องเปิดเว็บไซต์หลายๆ ที่เพื่อเปรียบเทียบราคา 
                  เราเปรียบเทียบให้คุณในที่เดียว
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-blue-900">ประหยัดเงิน</h3>
                <p className="text-gray-700">
                  หาผู้จำหน่ายที่ให้ราคาดีที่สุด ช่วยให้คุณประหยัดเงินได้มาก
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-blue-900">ข้อมูลแม่นยำ</h3>
                <p className="text-gray-700">
                  ราคาอัปเดตแบบเรียลไทม์ ให้คุณมั่นใจในข้อมูลที่ได้รับ
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-blue-900">ใช้งานง่าย</h3>
                <p className="text-gray-700">
                  อินเทอร์เฟซที่เข้าใจง่าย เหมาะสำหรับทุกคน
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
