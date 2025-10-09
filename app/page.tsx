"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, ExternalLink, Zap, Calendar, MapPin, Users, Star, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

// Mock data for train passes
const trainPasses = [
  {
    id: 1,
    name: "JR Pass 7 - 9 วัน",
    nameEn: "JR Pass 7 Days",
    days: 7,
    region: "ทั่วประเทศ",
    regionEn: "Nationwide",
    adultPrice: true,
    childPrice: true,
    flexible: false,
    onSale: false,
    lastUpdated: "2024-01-26 14:00",
    prices: {
      klook: { adult: 88000, child: 44000, url: "https://klook.com/jr-pass-7" },
      kkday: { adult: 87950, child: 43975, url: "https://kkday.com/jr-pass-7" },
      japanAllPass: { adult: 87980, child: 43990, url: "https://japanallpass.com/jr-pass-7" },
    },
  },
  {
    id: 2,
    name: "JR Pass 14 วัน",
    nameEn: "JR Pass 14 Days",
    days: 14,
    region: "ทั่วประเทศ",
    regionEn: "Nationwide",
    adultPrice: true,
    childPrice: true,
    flexible: false,
    onSale: true,
    lastUpdated: "2024-01-26 14:00",
    prices: {
      klook: { adult: 142000, child: 71000, url: "https://klook.com/jr-pass-14" },
      kkday: { adult: 141500, child: 70750, url: "https://kkday.com/jr-pass-14" },
      japanAllPass: { adult: 141800, child: 70900, url: "https://japanallpass.com/jr-pass-14" },
    },
  },
  {
    id: 3,
    name: "JR East Pass (Tohoku Area) 5 วัน",
    nameEn: "JR East Pass (Tohoku Area) 5 Days",
    days: 5,
    region: "JR East",
    regionEn: "JR East",
    adultPrice: true,
    childPrice: true,
    flexible: true,
    onSale: false,
    lastUpdated: "2024-01-26 14:00",
    prices: {
      klook: { adult: 19350, child: 9675, url: "https://klook.com/jr-east-tohoku-5" },
      kkday: { adult: 19200, child: 9600, url: "https://kkday.com/jr-east-tohoku-5" },
      japanAllPass: { adult: 19400, child: 9700, url: "https://japanallpass.com/jr-east-tohoku-5" },
    },
  },
  {
    id: 4,
    name: "Kansai Area Pass 3 วัน",
    nameEn: "Kansai Area Pass 3 Days",
    days: 3,
    region: "Kansai",
    regionEn: "Kansai",
    adultPrice: true,
    childPrice: true,
    flexible: false,
    onSale: true,
    lastUpdated: "2024-01-26 14:00",
    prices: {
      klook: { adult: 5500, child: 2750, url: "https://klook.com/kansai-3" },
      kkday: { adult: 5400, child: 2700, url: "https://kkday.com/kansai-3" },
      japanAllPass: { adult: 5450, child: 2725, url: "https://japanallpass.com/kansai-3" },
    },
  },
  {
    id: 5,
    name: "Hokuriku Arch Pass 7 วัน",
    nameEn: "Hokuriku Arch Pass 7 Days",
    days: 7,
    region: "Hokuriku",
    regionEn: "Hokuriku",
    adultPrice: true,
    childPrice: true,
    flexible: true,
    onSale: false,
    lastUpdated: "2024-01-26 14:00",
    prices: {
      klook: { adult: 25000, child: 12500, url: "https://klook.com/hokuriku-arch-7" },
      kkday: { adult: 24800, child: 12400, url: "https://kkday.com/hokuriku-arch-7" },
      japanAllPass: { adult: 24900, child: 12450, url: "https://japanallpass.com/hokuriku-arch-7" },
    },
  },
]

export default function JapanTrainPassComparison() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDays, setSelectedDays] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false)
  const [priceType, setPriceType] = useState("adult")
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Auto-update every hour
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 3600000) // 1 hour = 3600000ms

    return () => clearInterval(interval)
  }, [])

  const filteredPasses = useMemo(() => {
    return trainPasses.filter((pass) => {
      const matchesSearch =
        pass.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pass.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesDays = selectedDays === "all" || pass.days.toString() === selectedDays
      const matchesRegion = selectedRegion === "all" || pass.regionEn === selectedRegion
      const matchesOnSale = !showOnSaleOnly || pass.onSale

      return matchesSearch && matchesDays && matchesRegion && matchesOnSale
    })
  }, [searchTerm, selectedDays, selectedRegion, showOnSaleOnly])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price)
  }

  const getBestPrice = (prices: any) => {
    const priceValues = [prices.klook[priceType], prices.kkday[priceType], prices.japanAllPass[priceType]]
    return Math.min(...priceValues)
  }

  const getBestProvider = (prices: any) => {
    const bestPrice = getBestPrice(prices)
    if (prices.klook[priceType] === bestPrice) return "klook"
    if (prices.kkday[priceType] === bestPrice) return "kkday"
    return "japanAllPass"
  }

  const formatLastUpdate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const FilterContent = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="ค้นหาชื่อพาส เช่น JR Pass, Kansai Pass..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label className="text-sm font-medium mb-2 block">จำนวนวัน</Label>
          <Select value={selectedDays} onValueChange={setSelectedDays}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกระยะเวลา</SelectItem>
              <SelectItem value="3">3 วัน</SelectItem>
              <SelectItem value="5">5 วัน</SelectItem>
              <SelectItem value="7">7 วัน</SelectItem>
              <SelectItem value="14">14 วัน</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">ภูมิภาค</Label>
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกภูมิภาค</SelectItem>
              <SelectItem value="Nationwide">ทั่วประเทศ</SelectItem>
              <SelectItem value="JR East">JR East</SelectItem>
              <SelectItem value="Kansai">Kansai</SelectItem>
              <SelectItem value="Hokuriku">Hokuriku</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium mb-2 block">ประเภทราคา</Label>
          <Select value={priceType} onValueChange={setPriceType}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="adult">ผู้ใหญ่</SelectItem>
              <SelectItem value="child">เด็ก</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox id="onSale" checked={showOnSaleOnly} onCheckedChange={setShowOnSaleOnly} />
          <Label htmlFor="onSale" className="text-sm">
            เฉพาะที่ลดราคา
          </Label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">เปรียบเทียบราคาตั๋วรถไฟญี่ปุ่น</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  เปรียบเทียบราคาจาก Klook, KKday และ JapanAllPass
                </p>
              </div>
            </div>

            {/* Mobile Filter Button */}
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="hidden sm:flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" />
                อัปเดตทุกชั่วโมง
              </Badge>
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="sm:hidden bg-transparent">
                    <Filter className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>ค้นหาและกรองผลลัพธ์</SheetTitle>
                    <SheetDescription>เลือกเงื่อนไขเพื่อค้นหาพาสที่เหมาะสม</SheetDescription>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Mobile Update Info */}
          <div className="mt-2 sm:hidden">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <RefreshCw className="h-3 w-3" />
                <span>อัปเดตทุกชั่วโมง</span>
              </div>
              <span>ล่าสุด: {formatLastUpdate(lastUpdate)}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Desktop Search and Filters */}
        <Card className="mb-6 sm:mb-8 hidden sm:block">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              ค้นหาและกรองผลลัพธ์
              <Badge variant="outline" className="ml-auto flex items-center gap-1">
                <Clock className="h-3 w-3" />
                อัปเดตล่าสุด: {formatLastUpdate(lastUpdate)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2 lg:col-span-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาชื่อพาส เช่น JR Pass, Kansai Pass..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Select value={selectedDays} onValueChange={setSelectedDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="จำนวนวัน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกระยะเวลา</SelectItem>
                    <SelectItem value="3">3 วัน</SelectItem>
                    <SelectItem value="5">5 วัน</SelectItem>
                    <SelectItem value="7">7 วัน</SelectItem>
                    <SelectItem value="14">14 วัน</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger>
                    <SelectValue placeholder="ภูมิภาค" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกภูมิภาค</SelectItem>
                    <SelectItem value="Nationwide">ทั่วประเทศ</SelectItem>
                    <SelectItem value="JR East">JR East</SelectItem>
                    <SelectItem value="Kansai">Kansai</SelectItem>
                    <SelectItem value="Hokuriku">Hokuriku</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Select value={priceType} onValueChange={setPriceType}>
                  <SelectTrigger>
                    <SelectValue placeholder="ประเภทราคา" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">ผู้ใหญ่</SelectItem>
                    <SelectItem value="child">เด็ก</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="onSale" checked={showOnSaleOnly} onCheckedChange={setShowOnSaleOnly} />
              <Label htmlFor="onSale" className="text-sm">
                เฉพาะที่ลดราคา
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            พบ <span className="font-semibold text-blue-600">{filteredPasses.length}</span> รายการ
            {searchTerm && (
              <span>
                {" "}
                สำหรับ "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </p>
        </div>

        {/* Comparison Results */}
        <div className="space-y-3 sm:space-y-4">
          {filteredPasses.map((pass) => {
            const bestProvider = getBestProvider(pass.prices)
            const bestPrice = getBestPrice(pass.prices)

            return (
              <Card key={pass.id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    {/* Pass Header */}
                    <div className="p-4 bg-gray-50 border-b">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 mb-1 leading-tight">{pass.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{pass.nameEn}</p>
                        </div>
                        {pass.onSale && (
                          <Badge variant="destructive" className="ml-2 flex-shrink-0">
                            <Star className="h-3 w-3 mr-1" />
                            ลดราคา
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Calendar className="h-3 w-3" />
                          {pass.days} วัน
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <MapPin className="h-3 w-3" />
                          {pass.region}
                        </Badge>
                        {pass.flexible && (
                          <Badge variant="secondary" className="text-xs">
                            ยืดหยุ่น
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>ราคา{priceType === "adult" ? "ผู้ใหญ่" : "เด็ก"}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">฿{formatPrice(bestPrice)}</div>
                          <div className="text-xs text-gray-500">ราคาดีที่สุด</div>
                        </div>
                      </div>
                    </div>

                    {/* Mobile Price Cards */}
                    <div className="p-4 space-y-3">
                      {/* Klook */}
                      <div
                        className={`border rounded-lg p-3 ${bestProvider === "klook" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">K</span>
                            </div>
                            <span className="font-medium text-sm">Klook</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ฿{formatPrice(pass.prices.klook[priceType])}
                            </div>
                            {bestProvider === "klook" && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          asChild
                          className="w-full h-10"
                          variant={bestProvider === "klook" ? "default" : "outline"}
                        >
                          <a href={pass.prices.klook.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            ซื้อที่ Klook
                          </a>
                        </Button>
                      </div>

                      {/* KKday */}
                      <div
                        className={`border rounded-lg p-3 ${bestProvider === "kkday" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-red-500 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">KK</span>
                            </div>
                            <span className="font-medium text-sm">KKday</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ฿{formatPrice(pass.prices.kkday[priceType])}
                            </div>
                            {bestProvider === "kkday" && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          asChild
                          className="w-full h-10"
                          variant={bestProvider === "kkday" ? "default" : "outline"}
                        >
                          <a href={pass.prices.kkday.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            ซื้อที่ KKday
                          </a>
                        </Button>
                      </div>

                      {/* JapanAllPass */}
                      <div
                        className={`border rounded-lg p-3 ${bestProvider === "japanAllPass" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-xs font-bold">JP</span>
                            </div>
                            <span className="font-medium text-sm">JapanAllPass</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ฿{formatPrice(pass.prices.japanAllPass[priceType])}
                            </div>
                            {bestProvider === "japanAllPass" && (
                              <Badge variant="default" className="bg-green-500 text-xs">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          asChild
                          className="w-full h-10"
                          variant={bestProvider === "japanAllPass" ? "default" : "outline"}
                        >
                          <a href={pass.prices.japanAllPass.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            ซื้อที่ JapanAllPass
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:grid sm:grid-cols-12 gap-0">
                    {/* Pass Info */}
                    <div className="lg:col-span-4 p-6 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 mb-1">{pass.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{pass.nameEn}</p>
                        </div>
                        {pass.onSale && (
                          <Badge variant="destructive" className="ml-2">
                            <Star className="h-3 w-3 mr-1" />
                            ลดราคา
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {pass.days} วัน
                        </Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {pass.region}
                        </Badge>
                        {pass.flexible && <Badge variant="secondary">ยืดหยุ่น</Badge>}
                      </div>

                      <div className="text-sm text-gray-600">
                        <div className="flex items-center gap-1 mb-1">
                          <Users className="h-3 w-3" />
                          <span>ราคา{priceType === "adult" ? "ผู้ใหญ่" : "เด็ก"}</span>
                        </div>
                        <div className="font-semibold text-green-600">ราคาดีที่สุด: ฿{formatPrice(bestPrice)}</div>
                        <div className="text-xs text-gray-500 mt-1">อัปเดต: {pass.lastUpdated}</div>
                      </div>
                    </div>

                    {/* Price Comparison */}
                    <div className="lg:col-span-8 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Klook */}
                        <div
                          className={`border rounded-lg p-4 ${bestProvider === "klook" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">K</span>
                              </div>
                              <span className="font-medium">Klook</span>
                            </div>
                            {bestProvider === "klook" && (
                              <Badge variant="default" className="bg-green-500">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold text-gray-900 mb-3">
                            ฿{formatPrice(pass.prices.klook[priceType])}
                          </div>
                          <Button asChild className="w-full" variant={bestProvider === "klook" ? "default" : "outline"}>
                            <a href={pass.prices.klook.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              ซื้อที่ Klook
                            </a>
                          </Button>
                        </div>

                        {/* KKday */}
                        <div
                          className={`border rounded-lg p-4 ${bestProvider === "kkday" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">KK</span>
                              </div>
                              <span className="font-medium">KKday</span>
                            </div>
                            {bestProvider === "kkday" && (
                              <Badge variant="default" className="bg-green-500">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold text-gray-900 mb-3">
                            ฿{formatPrice(pass.prices.kkday[priceType])}
                          </div>
                          <Button asChild className="w-full" variant={bestProvider === "kkday" ? "default" : "outline"}>
                            <a href={pass.prices.kkday.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              ซื้อที่ KKday
                            </a>
                          </Button>
                        </div>

                        {/* JapanAllPass */}
                        <div
                          className={`border rounded-lg p-4 ${bestProvider === "japanAllPass" ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                <span className="text-white text-xs font-bold">JP</span>
                              </div>
                              <span className="font-medium">JapanAllPass</span>
                            </div>
                            {bestProvider === "japanAllPass" && (
                              <Badge variant="default" className="bg-green-500">
                                ดีที่สุด
                              </Badge>
                            )}
                          </div>
                          <div className="text-xl font-bold text-gray-900 mb-3">
                            ฿{formatPrice(pass.prices.japanAllPass[priceType])}
                          </div>
                          <Button
                            asChild
                            className="w-full"
                            variant={bestProvider === "japanAllPass" ? "default" : "outline"}
                          >
                            <a href={pass.prices.japanAllPass.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              ซื้อที่ JapanAllPass
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {filteredPasses.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 sm:py-12">
              <div className="text-gray-500 mb-4">
                <Search className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">ไม่พบผลลัพธ์</p>
                <p className="text-sm">ลองเปลี่ยนเงื่อนไขการค้นหาหรือกรองผลลัพธ์</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-8 sm:mt-16">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2 text-sm sm:text-base">© 2024 เปรียบเทียบราคาตั๋วรถไฟญี่ปุ่น</p>
            <p className="text-xs sm:text-sm">ราคาอาจมีการเปลี่ยนแปลง กรุณาตรวจสอบราคาล่าสุดที่เว็บไซต์ผู้จำหน่าย</p>
            <div className="mt-3 flex items-center justify-center gap-1 text-xs text-blue-600">
              <RefreshCw className="h-3 w-3" />
              <span>ระบบอัปเดตราคาอัตโนมัติทุกชั่วโมง</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
