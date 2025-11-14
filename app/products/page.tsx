"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ExternalLink, Package, DollarSign } from "lucide-react"
import { apiUrl } from "@/lib/env"

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const scrapeEndpoint = apiUrl("api/scrape")

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError("")

        console.log(`🔍 กำลังเรียก API: ${scrapeEndpoint}`)
        const response = await fetch(scrapeEndpoint)

        console.log("📡 Response status:", response.status)
        if (!response.ok) throw new Error(`API Error: ${response.status}`)

        const result = await response.json()
        console.log("📦 API raw result:", result)

        // ✅ ตรวจสอบว่าข้อมูลอยู่ในรูปแบบไหน
        let dataArray: any[] = []

        if (Array.isArray(result)) {
          dataArray = result
        } else if (Array.isArray(result.data)) {
          dataArray = result.data
        } else if (Array.isArray(result.products)) {
          dataArray = result.products
        } else {
          console.warn("⚠️ ไม่พบ array ใน result:", result)
        }

        console.log("📊 Parsed array:", dataArray)
        setProducts(dataArray)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error"
        setError(`Network Error: ${errorMessage}`)
        console.error("❌ Error fetching products:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  // Filter
  const filteredProducts = products.filter(
    (p) =>
      p.name_product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.no_product?.toString().includes(searchTerm)
  )

  // Format price
  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price
    return new Intl.NumberFormat("th-TH").format(numPrice || 0)
  }

  console.log("🧩 Rendering products:", products)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Package className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ข้อมูลสินค้าจาก API
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ข้อมูลสินค้าที่ดึงมาจาก {scrapeEndpoint}
          </p>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="ค้นหาสินค้า..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {loading && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-lg">กำลังโหลดข้อมูล...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="text-red-600 text-center">
                <p className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</p>
                <p>{error}</p>
                <Button onClick={() => window.location.reload()} className="mt-4" variant="outline">
                  ลองใหม่
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products List */}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                พบ{" "}
                <span className="font-semibold text-blue-600">{filteredProducts.length}</span> รายการ
                {searchTerm && (
                  <span>
                    {" "}สำหรับ "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product, index) => (
                <Card key={`product-${product.no_product || index}-${index}`} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {product.name_product || `สินค้า ${index + 1}`}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          ID: {product.no_product || "N/A"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Price */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">ราคา</span>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          ฿{formatPrice(product.price_product || 0)}
                        </div>
                      </div>

                      {/* Price Comparison */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Klook:</span>
                          <span className="font-medium">
                            ฿{formatPrice(product.maxPrice_klook || product.price_product || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">KKday:</span>
                          <span className="font-medium">
                            ฿{formatPrice(product.maxPrice_kkday || product.price_product || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => window.open("https://klook.com", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Klook
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => window.open("https://kkday.com", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          KKday
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results */}
            {filteredProducts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="text-gray-500">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">ไม่พบสินค้า</p>
                    <p className="text-sm">ลองเปลี่ยนคำค้นหาหรือตรวจสอบ API</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Debug Info */}
        {!loading && (
          <Card className="mt-8 bg-gray-50">
            <CardHeader>
              <CardTitle className="text-sm">Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-1">
                <p>API URL: {scrapeEndpoint}</p>
                <p>Total Products: {products.length}</p>
                <p>Filtered Products: {filteredProducts.length}</p>
                <p>Search Term: "{searchTerm}"</p>
                <p>Error: {error || "None"}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
