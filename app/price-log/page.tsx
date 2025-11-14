"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, DollarSign, Calendar, Package, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiUrl } from "@/lib/env"

export default function PriceLogPage() {
  const router = useRouter()
  const [priceLogs, setPriceLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState("")
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 1
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageLimit, setPageLimit] = useState(50)

  const priceLogEndpoint = apiUrl("api/price-log")

  const fetchPriceLogs = async (page: number = 1, limit: number = 50) => {
    try {
      setLoading(true)
      setError("")

      const url = `${priceLogEndpoint}?page=${page}&limit=${limit}`
      console.log("🔍 กำลังเรียก API:", url)
      const response = await fetch(url)

      console.log("📡 Response status:", response.status)
      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const result = await response.json()
      console.log("📦 API raw result:", result)

      // ✅ ตรวจสอบว่าข้อมูลอยู่ในรูปแบบไหน
      let dataArray: any[] = []
      let paginationData = pagination

      if (result.success && Array.isArray(result.data)) {
        dataArray = result.data
        if (result.pagination) {
          paginationData = result.pagination
        }
      } else if (Array.isArray(result)) {
        dataArray = result
      } else if (Array.isArray(result.data)) {
        dataArray = result.data
        if (result.pagination) {
          paginationData = result.pagination
        }
      } else {
        console.warn("⚠️ ไม่พบ array ใน result:", result)
      }

      console.log("📊 Parsed array:", dataArray)
      setPriceLogs(dataArray)
      setPagination(paginationData)
      setLastRefresh(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Network Error: ${errorMessage}`)
      console.error("❌ Error fetching price logs:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPriceLogs(currentPage, pageLimit)
  }, [currentPage, pageLimit])

  // Filter (client-side filtering after data is loaded)
  const filteredLogs = priceLogs.filter(
    (log) => {
      const searchLower = searchTerm.toLowerCase()
      const nameProduct = log.name_product || log.scrape_data_id?.name_product || ""
      const noProduct = log.scrape_data_id?.no_product || log.no_product || ""
      const packageName = log.package_name || ""
      const source = log.source || ""
      const _id = log._id || ""
      
      return (
        nameProduct.toLowerCase().includes(searchLower) ||
        noProduct.toLowerCase().includes(searchLower) ||
        packageName.toLowerCase().includes(searchLower) ||
        source.toLowerCase().includes(searchLower) ||
        _id.toLowerCase().includes(searchLower)
      )
    }
  )

  // Format price
  const formatPrice = (price: string | number | null | undefined) => {
    if (price === null || price === undefined || price === "") return "N/A"
    const numPrice = typeof price === "string" ? parseFloat(price) : price
    return new Intl.NumberFormat("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numPrice || 0)
  }

  // Format date
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date)
    } catch {
      return dateString
    }
  }

  // Get product name
  const getProductName = (log: any) => {
    return log.name_product || log.scrape_data_id?.name_product || "N/A"
  }

  // Get product code
  const getProductCode = (log: any) => {
    return log.scrape_data_id?.no_product || log.no_product || "N/A"
  }

  // Get price change indicator
  const getPriceChangeIcon = (priceChange: number) => {
    if (priceChange > 0) {
      return <TrendingUp className="h-4 w-4 text-red-500" />
    } else if (priceChange < 0) {
      return <TrendingDown className="h-4 w-4 text-green-500" />
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Handle limit change
  const handleLimitChange = (newLimit: string) => {
    setPageLimit(Number(newLimit))
    setCurrentPage(1) // Reset to first page when changing limit
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-4 rounded-2xl">
              <Clock className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            ประวัติราคา (Price Log)
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ข้อมูลประวัติราคาที่ดึงมาจาก {priceLogEndpoint}
          </p>
        </div>

        {/* Search and Refresh */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="ค้นหาประวัติราคา..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => fetchPriceLogs(currentPage, pageLimit)} disabled={loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                รีเฟรชข้อมูล
              </Button>
              <Select value={pageLimit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 รายการ</SelectItem>
                  <SelectItem value="25">25 รายการ</SelectItem>
                  <SelectItem value="50">50 รายการ</SelectItem>
                  <SelectItem value="100">100 รายการ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-2">
              {lastRefresh && (
                <p className="text-xs text-gray-500">
                  อัปเดตล่าสุด: {formatDate(lastRefresh.toISOString())}
                </p>
              )}
              {pagination.total > 0 && (
                <p className="text-xs text-gray-600">
                  หน้า {pagination.page} จาก {pagination.pages} | ทั้งหมด {pagination.total} รายการ
                </p>
              )}
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
                <Button onClick={fetchPriceLogs} className="mt-4" variant="outline">
                  ลองใหม่
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Price Logs List */}
        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                พบ{" "}
                <span className="font-semibold text-blue-600">{filteredLogs.length}</span> รายการ
                {searchTerm && (
                  <span>
                    {" "}สำหรับ "<span className="font-medium">{searchTerm}</span>"
                  </span>
                )}
              </p>
            </div>

            {/* Table View for Desktop */}
            <div className="hidden md:block">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[60px]">#</TableHead>
                          <TableHead>ชื่อสินค้า</TableHead>
                          <TableHead className="w-[120px]">แพ็กเกจ</TableHead>
                          <TableHead className="w-[100px]">รหัสสินค้า</TableHead>
                          <TableHead className="w-[110px] text-right">ราคาเดิม</TableHead>
                          <TableHead className="w-[110px] text-right">ราคาใหม่</TableHead>
                          <TableHead className="w-[100px] text-center">เปลี่ยนแปลง</TableHead>
                          <TableHead className="w-[100px]">แหล่งที่มา</TableHead>
                          <TableHead className="w-[120px]">สถานะ</TableHead>
                          <TableHead className="w-[150px]">วันที่บันทึก</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center py-12">
                              <div className="text-gray-500">
                                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                                <p className="text-sm">ลองเปลี่ยนคำค้นหาหรือตรวจสอบ API</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredLogs.map((log, index) => (
                            <TableRow key={`log-${log._id || index}`}>
                              <TableCell>
                                <span className="text-xs text-gray-500">
                                  {(currentPage - 1) * pageLimit + index + 1}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium max-w-[200px]">
                                <div className="truncate" title={getProductName(log)}>
                                  {getProductName(log)}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-xs">
                                  {log.package_name || "N/A"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-gray-600 font-mono">
                                  {getProductCode(log)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="text-sm text-gray-600">
                                  ฿{formatPrice(log.old_price)}
                                </span>
                              </TableCell>
                              <TableCell className="text-right font-semibold text-green-600">
                                ฿{formatPrice(log.new_price)}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {getPriceChangeIcon(log.price_difference || 0)}
                                  <span className={`text-xs font-medium ${
                                    (log.price_difference || 0) > 0 
                                      ? "text-red-500" 
                                      : (log.price_difference || 0) < 0 
                                      ? "text-green-500" 
                                      : "text-gray-500"
                                  }`}>
                                    {log.price_difference !== undefined && log.price_difference !== null
                                      ? log.price_difference > 0 
                                        ? `+${formatPrice(log.price_difference)}` 
                                        : formatPrice(log.price_difference)
                                      : "0"}
                                  </span>
                                </div>
                                {log.price_change_percent !== undefined && log.price_change_percent !== null && (
                                  <div className={`text-xs ${
                                    log.price_change_percent > 0 
                                      ? "text-red-500" 
                                      : log.price_change_percent < 0 
                                      ? "text-green-500" 
                                      : "text-gray-500"
                                  }`}>
                                    {log.price_change_percent > 0 ? "+" : ""}{log.price_change_percent.toFixed(2)}%
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    log.source === "klook" || log.source?.toLowerCase() === "klook"
                                      ? "default"
                                      : log.source === "kkday" || log.source?.toLowerCase() === "kkday"
                                      ? "secondary"
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {log.source || "Unknown"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    log.status === "success" 
                                      ? "default" 
                                      : log.status === "error" 
                                      ? "destructive" 
                                      : "outline"
                                  }
                                  className="text-xs"
                                >
                                  {log.status || "N/A"}
                                </Badge>
                                {log.update_method && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {log.update_method}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-gray-600">
                                {formatDate(log.createdAt || log.updatedAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Card View for Mobile */}
            <div className="md:hidden space-y-4">
              {filteredLogs.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <div className="text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">ไม่พบข้อมูล</p>
                      <p className="text-sm">ลองเปลี่ยนคำค้นหาหรือตรวจสอบ API</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredLogs.map((log, index) => (
                  <Card key={`log-${log._id || index}`} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            {getProductName(log)}
                          </CardTitle>
                          <div className="flex gap-2 flex-wrap mb-2">
                            <Badge variant="outline" className="text-xs">
                              {log.package_name || "N/A"}
                            </Badge>
                            <Badge
                              variant={
                                log.source === "klook" || log.source?.toLowerCase() === "klook"
                                  ? "default"
                                  : log.source === "kkday" || log.source?.toLowerCase() === "kkday"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {log.source || "Unknown"}
                            </Badge>
                            <Badge
                              variant={
                                log.status === "success" 
                                  ? "default" 
                                  : log.status === "error" 
                                  ? "destructive" 
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {log.status || "N/A"}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-500">
                            รหัส: {getProductCode(log)}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Price Comparison */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 mb-1">ราคาเดิม</div>
                            <div className="text-lg font-semibold text-gray-700">
                              ฿{formatPrice(log.old_price)}
                            </div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-xs text-green-600 mb-1">ราคาใหม่</div>
                            <div className="text-lg font-bold text-green-600">
                              ฿{formatPrice(log.new_price)}
                            </div>
                          </div>
                        </div>

                        {/* Price Change */}
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">เปลี่ยนแปลง</span>
                            <div className="flex items-center gap-2">
                              {getPriceChangeIcon(log.price_difference || 0)}
                              <span className={`font-semibold ${
                                (log.price_difference || 0) > 0 
                                  ? "text-red-500" 
                                  : (log.price_difference || 0) < 0 
                                  ? "text-green-500" 
                                  : "text-gray-500"
                              }`}>
                                {log.price_difference !== undefined && log.price_difference !== null
                                  ? log.price_difference > 0 
                                    ? `+${formatPrice(log.price_difference)}` 
                                    : formatPrice(log.price_difference)
                                  : "0"}
                              </span>
                            </div>
                          </div>
                          {log.price_change_percent !== undefined && log.price_change_percent !== null && (
                            <div className={`text-sm mt-1 text-right ${
                              log.price_change_percent > 0 
                                ? "text-red-500" 
                                : log.price_change_percent < 0 
                                ? "text-green-500" 
                                : "text-gray-500"
                            }`}>
                              {log.price_change_percent > 0 ? "+" : ""}{log.price_change_percent.toFixed(2)}%
                            </div>
                          )}
                        </div>

                        {/* Additional Info */}
                        <div className="flex flex-col gap-2 text-sm text-gray-600">
                          {log.update_method && (
                            <div className="flex items-center gap-2">
                              <Package className="h-4 w-4" />
                              <span>วิธีอัปเดต: {log.update_method}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(log.createdAt || log.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Card className="mt-6">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-600">
                      หน้า {pagination.page} จาก {pagination.pages} | ทั้งหมด {pagination.total} รายการ
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1 || loading}
                      >
                        หน้าแรก
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                      >
                        ก่อนหน้า
                      </Button>
                      <div className="flex items-center gap-1 px-3 py-2 text-sm font-medium">
                        {currentPage}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= pagination.pages || loading}
                      >
                        ถัดไป
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.pages)}
                        disabled={currentPage >= pagination.pages || loading}
                      >
                        สุดท้าย
                      </Button>
                    </div>
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
              <CardTitle className="text-sm">ข้อมูลการทำงาน</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-600 space-y-1">
                <p>API URL: {priceLogEndpoint}</p>
                <p>จำนวนรายการในหน้า: {priceLogs.length}</p>
                <p>จำนวนรายการที่กรองแล้ว: {filteredLogs.length}</p>
                <p>จำนวนรายการทั้งหมด: {pagination.total}</p>
                <p>หน้าที่: {pagination.page} / {pagination.pages}</p>
                <p>รายการต่อหน้า: {pagination.limit}</p>
                <p>คำค้นหา: "{searchTerm}"</p>
                <p>ข้อผิดพลาด: {error || "ไม่มี"}</p>
                {lastRefresh && (
                  <p>อัปเดตล่าสุด: {formatDate(lastRefresh.toISOString())}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

