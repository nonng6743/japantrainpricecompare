"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, ExternalLink, Calendar, MapPin, Users, Star, Clock, RefreshCw, Edit, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

export default function HomePage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("");  // เพิ่ม useState สำหรับ searchTerm
  const [selectedDays, setSelectedDays] = useState("all")
  const [selectedRegion, setSelectedRegion] = useState("all")
  const [showOnSaleOnly, setShowOnSaleOnly] = useState(false)
  const [priceType, setPriceType] = useState("adult")
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    name_product: "",
    price_product: "",
    price_disc_pct_limit: 0,
    price_disc_pct: 0,
    url_kkday: "",
    url_klook: "",
    detail: "",
  })

  // Dynamic inputs state for KKDay
  const [dynamicInputsKKDay, setDynamicInputsKKDay] = useState([
    { id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }
  ])

  // Dynamic inputs state for KLook
  const [dynamicInputsKLook, setDynamicInputsKLook] = useState([
    { id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }
  ])

  // Products plans state
  const [productsPlans, setProductsPlans] = useState<any[]>([])

  // Backend KKDay state
  const [backendKkdayData, setBackendKkdayData] = useState<any[]>([])
  const [backendKkdayLoading, setBackendKkdayLoading] = useState(false)
  const [backendKkdayError, setBackendKkdayError] = useState<string | null>(null)
  const [backendKkdayRequestBody, setBackendKkdayRequestBody] = useState<string>('{"prodMid":"151309"}')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Backend Klook state
  const [backendKlookPackages, setBackendKlookPackages] = useState<any[]>([])
  const [backendKlookLoading, setBackendKlookLoading] = useState(false)
  const [backendKlookError, setBackendKlookError] = useState<string | null>(null)
  const [backendKlookRequestBody, setBackendKlookRequestBody] = useState<string>(JSON.stringify({
    page_from: 2,
    arrangement_id: 1762819200564715,
    sku_list: [
      { sku_id: 828952039775, quantity: 1 },
      { sku_id: 828952039776, quantity: 1 }
    ]
  }, null, 2))

  const transformPlansFromResponse = (responseData: any) => {
    if (!responseData) return []

    const rawItems = Array.isArray(responseData)
      ? responseData
      : Array.isArray(responseData?.data)
        ? responseData.data
        : []

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return []
    }

    const groupedByParams = rawItems.reduce<Record<string, any[]>>((acc, item) => {
      const key = item?.product_params || ""
      if (!acc[key]) acc[key] = []
      acc[key].push(item)
      return acc
    }, {})

    const comboItems = rawItems.filter((item) => item?.source === "comboJTR")

    if (comboItems.length > 0) {
      const comboPlans = comboItems
        .map((comboItem) => {
          const relatedItems = (groupedByParams[comboItem.product_params] || []).filter(
            (item) => item !== comboItem && Array.isArray(item?.products_plans) && item.products_plans.length > 0
          )

          const firstRelatedPlan = relatedItems.length > 0 ? relatedItems[0].products_plans[0] : null

          return {
            products_plans_id: comboItem.products_id ?? firstRelatedPlan?.products_plans_id ?? null,
            name: comboItem.product_name || comboItem.product_params || "",
            day: comboItem.detail || comboItem.product_params || firstRelatedPlan?.day || comboItem.product_name || "",
            initial_price: firstRelatedPlan?.initial_price || comboItem.initial_price || comboItem.product_price || null,
            source: comboItem.source || null,
            product_params: comboItem.product_params || null,
            combo: true,
            related_plan_id: firstRelatedPlan?.products_plans_id ?? null,
          }
        })
        .filter((plan) => plan.initial_price !== null)

      if (comboPlans.length > 0) {
        return comboPlans
      }
    }

    const itemWithPlans = rawItems.find(
      (item) => Array.isArray(item?.products_plans) && item.products_plans.length > 0
    )

    return itemWithPlans?.products_plans ?? []
  }

  const normalizeText = (value?: string) => (value ?? "").toString().trim().toLowerCase()

  // ฟังก์ชันดึงข้อมูล products_plans
  const fetchProductsPlans = async (productId: string) => {
    try {
      const encodedId = encodeURIComponent((productId ?? "").trim())
      const response = await fetch(`https://api.japanallpass.com/api/products/product_read_paramiter?product_params=${encodedId}`)
      const data = await response.json()

      const plans = transformPlansFromResponse(data)
      setProductsPlans(plans)
      console.log("📦 Products Plans (transformed):", plans)
    } catch (error) {
      console.error("❌ Error fetching products plans:", error)
      setProductsPlans([])
    }
  }

  const findMatchingPlan = (plans: any[], name: string, day: string) => {
    const targetName = normalizeText(name)
    const targetDay = normalizeText(day)

    return plans.find((plan) => {
      const planName = normalizeText(plan.name)
      const planDay = normalizeText(plan.day)

      if (targetName && targetDay) {
        return planName === targetName && planDay === targetDay
      }

      if (targetName) {
        return planName === targetName
      }

      if (targetDay) {
        return planDay === targetDay
      }

      return false
    }) || null
  }

  // ฟังก์ชัน map ข้อมูลจาก products_plans
  const mapProductsPlans = (name: string, day: string) => {
    const matchingPlan = findMatchingPlan(productsPlans, name, day)

    if (matchingPlan) {
      return {
        priceJP: matchingPlan.initial_price,
        name: matchingPlan.name,
        day: matchingPlan.day,
      }
    }

    return null
  }

  // ฟังก์ชัน auto-fill ราคา JP จาก products_plans
  const autoFillPricesFromPlans = (plans: any[]) => {
    const updatedKKDay = dynamicInputsKKDay.map((input) => {
      if (input.name || input.day) {
        const matchingPlan = findMatchingPlan(plans, input.name, input.day)

        if (matchingPlan && matchingPlan.initial_price) {
          return {
            ...input,
            priceJP: matchingPlan.initial_price,
          }
        }
      }

      return input
    })

    const updatedKLook = dynamicInputsKLook.map((input) => {
      if (input.name || input.day) {
        const matchingPlan = findMatchingPlan(plans, input.name, input.day)

        if (matchingPlan && matchingPlan.initial_price) {
          return {
            ...input,
            priceJP: matchingPlan.initial_price,
          }
        }
      }

      return input
    })

    setDynamicInputsKKDay(updatedKKDay)
    setDynamicInputsKLook(updatedKLook)
  }

  const handleFetchBackendKkday = async () => {
    setBackendKkdayError(null)
    setBackendKkdayData([])

    try {
      setBackendKkdayLoading(true)

      // Parse JSON body
      let requestBody
      try {
        requestBody = backendKkdayRequestBody.trim() ? JSON.parse(backendKkdayRequestBody) : {}
      } catch (parseError) {
        throw new Error("JSON ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบ JSON")
      }

      const response = await fetch("http://localhost:4000/api/scrape/getKkday", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "ไม่สามารถดึงข้อมูล KKDay ได้")
      }

      const kkdayData = Array.isArray(data.data) ? data.data : []
      setBackendKkdayData(kkdayData)
    } catch (error) {
      console.error("❌ Error fetching KKDay from backend:", error)
      setBackendKkdayError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อกับ backend")
    } finally {
      setBackendKkdayLoading(false)
    }
  }

  const handleFetchBackendKlook = async () => {
    setBackendKlookError(null)
    setBackendKlookPackages([])

    try {
      setBackendKlookLoading(true)

      // Parse JSON body
      let requestBody
      try {
        requestBody = JSON.parse(backendKlookRequestBody)
      } catch (parseError) {
        throw new Error("JSON ไม่ถูกต้อง กรุณาตรวจสอบรูปแบบ JSON")
      }

      const response = await fetch("http://localhost:4000/api/scrape/getKlook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok || !data.success || !data.data?.success) {
        throw new Error(data.error || data.data?.error?.message || "ไม่สามารถดึงข้อมูล Klook ได้")
      }

      const packages = data.data?.result?.price_summary?.package_list || []
      setBackendKlookPackages(packages)
    } catch (error) {
      console.error("❌ Error fetching Klook from backend:", error)
      setBackendKlookError(error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อกับ backend")
    } finally {
      setBackendKlookLoading(false)
    }
  }

  const handleCopyJson = async (index: number, skuId: string) => {
    try {
      const prodMid = (() => {
        try {
          const parsed = JSON.parse(backendKkdayRequestBody)
          return parsed.prodMid || ""
        } catch {
          return ""
        }
      })()

      const jsonData = JSON.stringify({
        prodMid: prodMid,
        sku_id: skuId
      }, null, 2)

      await navigator.clipboard.writeText(jsonData)
      setCopiedIndex(index)
      setTimeout(() => {
        setCopiedIndex(null)
      }, 2000)
    } catch (error) {
      console.error("❌ Error copying to clipboard:", error)
    }
  }

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError("")

      console.log("🔍 กำลังเรียก API: http://localhost:4000/api/scrape")
      const response = await fetch("http://localhost:4000/api/scrape")

      console.log("📡 Response status:", response.status)
      if (!response.ok) throw new Error(`API Error: ${response.status}`)

      const result = await response.json()
      console.log("📦 API raw result:", result)

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

      console.log("🔄 Raw data:", dataArray)
      setProducts(dataArray)
      console.log("✅ Products set:", dataArray.length, "items")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      setError(`Network Error: ${errorMessage}`)
      console.error("❌ Error fetching products:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 3600000)

    return () => clearInterval(interval)
  }, [])

  const formatLastUpdate = (date: Date) => {
    return new Intl.DateTimeFormat("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("th-TH").format(price)
  }

  // ฟังก์ชันแปลงราคาเป็นตัวเลข
  const parsePrice = (priceStr: string | number) => {
    if (priceStr === null || priceStr === undefined) return null
    if (typeof priceStr === "number") return priceStr

    const cleanPrice = priceStr.toString().replace(/[^ -9.,]/g, "")
    const normalized = cleanPrice.replace(/,/g, "")
    const price = parseFloat(normalized)
    return isNaN(price) ? null : price
  }

  const isValidPrice = (price: any): boolean => {
    if (price === null || price === undefined) return false
    const numPrice = typeof price === "number" ? price : parseFloat(price)
    return !isNaN(numPrice) && numPrice > 0
  }

  const createPriceComparison = (product: any) => {
    const packages: any[] = []

    if (product.packages_kkday) {
      product.packages_kkday.forEach((kkdayPkg: any) => {
        const matchingKlookPkg = product.packages_klook?.find((klookPkg: any) =>
          klookPkg.name === kkdayPkg.name
        )

        const japanAllPassPrice = kkdayPkg.priceJP || matchingKlookPkg?.priceJP || product.price_product

        packages.push({
          id: `${product._id}-${kkdayPkg.name}`,
          name: kkdayPkg.name,
          nameEn: kkdayPkg.name,
          days: null,
          region: "ทั่วประเทศ",
          regionEn: "Nationwide",
          adultPrice: true,
          childPrice: true,
          flexible: false,
          onSale: false,
          lastUpdated: null,
          prices: {
            klook: {
              adult: matchingKlookPkg ? parsePrice(matchingKlookPkg.price) : null,
              child: null,
              url: product.url_klook,
            },
            kkday: {
              adult: parsePrice(kkdayPkg.price),
              child: null,
              url: product.url_kkday,
            },
            japanAllPass: {
              adult: parsePrice(japanAllPassPrice),
              child: null,
              url: `https://japanallpass.com/products/${product.no_product}`,
            },
          },
        })
      })
    }

    if (product.packages_klook) {
      product.packages_klook.forEach((klookPkg: any) => {
        const hasMatchingKkday = product.packages_kkday?.some((kkdayPkg: any) =>
          kkdayPkg.name === klookPkg.name
        )

        if (!hasMatchingKkday) {
          const japanAllPassPrice = klookPkg.priceJP || product.price_product

          packages.push({
            id: `${product._id}-${klookPkg.name}`,
            name: klookPkg.name,
            nameEn: klookPkg.name,
            days: null,
            region: "ทั่วประเทศ",
            regionEn: "Nationwide",
            adultPrice: true,
            childPrice: true,
            flexible: false,
            onSale: false,
            lastUpdated: null,
            prices: {
              klook: {
                adult: parsePrice(klookPkg.price),
                child: null,
                url: product.url_klook,
              },
              kkday: {
                adult: null,
                child: null,
                url: product.url_kkday,
              },
              japanAllPass: {
                adult: parsePrice(japanAllPassPrice),
                child: null,
                url: `https://japanallpass.com/products/${product.no_product}`,
              },
            },
          })
        }
      })
    }

    return packages
  }

  const getBestPrice = (prices: any) => {
    const priceValues = Object.values(prices).map((provider: any) => provider[priceType])
    const validPrices = priceValues.filter((price) => isValidPrice(price)) as number[]
    return validPrices.length > 0 ? Math.min(...validPrices) : 0
  }

  const getBestProvider = (prices: any) => {
    const priceValues = Object.entries(prices).map(([provider, data]: [string, any]) => ({
      provider,
      price: data[priceType],
    }))

    const validPrices = priceValues.filter((entry) => isValidPrice(entry.price))
    if (validPrices.length === 0) return null

    const bestProvider = validPrices.reduce((best, current) =>
      current.price < best.price ? current : best
    )

    return bestProvider.provider
  }

  // ฟังก์ชันเพิ่ม input ใหม่สำหรับ KKDay
  const addNewInputKKDay = () => {
    const newId = Math.max(...dynamicInputsKKDay.map(input => input.id), 0) + 1;
    setDynamicInputsKKDay([...dynamicInputsKKDay, { id: newId, screenshotPath: "", priceJP: "", name: "", day: "" }]);
  };

  // ฟังก์ชันลบ input สำหรับ KKDay
  const removeInputKKDay = (id: number) => {
    if (dynamicInputsKKDay.length > 1) {
      setDynamicInputsKKDay(dynamicInputsKKDay.filter(input => input.id !== id));
    }
  };

  // ฟังก์ชันอัปเดต input สำหรับ KKDay
  const updateInputKKDay = (id: number, field: string, value: string) => {
    setDynamicInputsKKDay(dynamicInputsKKDay.map(input => {
      if (input.id === id) {
        const updatedInput = { ...input, [field]: value };

        if (field === 'name' || field === 'day') {
          const mappedData = mapProductsPlans(updatedInput.name, updatedInput.day);
          if (mappedData) {
            updatedInput.priceJP = mappedData.priceJP;
            updatedInput.name = mappedData.name;
          }
        }

        return updatedInput;
      }
      return input;
    }));
  };

  // ฟังก์ชันเพิ่ม input ใหม่สำหรับ KLook
  const addNewInputKLook = () => {
    const newId = Math.max(...dynamicInputsKLook.map(input => input.id), 0) + 1;
    setDynamicInputsKLook([...dynamicInputsKLook, { id: newId, screenshotPath: "", priceJP: "", name: "", day: "" }]);
  };

  // ฟังก์ชันลบ input สำหรับ KLook
  const removeInputKLook = (id: number) => {
    if (dynamicInputsKLook.length > 1) {
      setDynamicInputsKLook(dynamicInputsKLook.filter(input => input.id !== id));
    }
  };

  // ฟังก์ชันอัปเดต input สำหรับ KLook
  const updateInputKLook = (id: number, field: string, value: string) => {
    setDynamicInputsKLook(dynamicInputsKLook.map(input => {
      if (input.id === id) {
        const updatedInput = { ...input, [field]: value };

        if (field === 'name' || field === 'day') {
          const mappedData = mapProductsPlans(updatedInput.name, updatedInput.day);
          if (mappedData) {
            updatedInput.priceJP = mappedData.priceJP;
            updatedInput.name = mappedData.name;
          }
        }

        return updatedInput;
      }
      return input;
    }));
  };

  // ฟังก์ชันเปิด Dialog แก้ไข
  const openEditDialog = async (product: any) => {
    setSelectedProduct(product)
    setEditFormData({
      name_product: product.name_product || "",
      price_product: product.price_product?.toString() || "",
      price_disc_pct_limit: product.price_disc_pct_limit || 0,
      price_disc_pct: product.price_disc_pct || 0,
      url_kkday: product.url_kkday || "",
      url_klook: product.url_klook || "",
      detail: product.detail || "",
    })

    // โหลด packages_kkday และ packages_klook
    if (product.packages_kkday && Array.isArray(product.packages_kkday) && product.packages_kkday.length > 0) {
      const kkdayInputs = product.packages_kkday.map((pkg: any, index: number) => ({
        id: index + 1,
        screenshotPath: pkg.screenshotPath || "",
        priceJP: pkg.priceJP?.toString() || "",
        name: pkg.name || "",
        day: pkg.day || "",
      }))
      setDynamicInputsKKDay(kkdayInputs)
    } else {
      setDynamicInputsKKDay([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
    }

    if (product.packages_klook && Array.isArray(product.packages_klook) && product.packages_klook.length > 0) {
      const klookInputs = product.packages_klook.map((pkg: any, index: number) => ({
        id: index + 1,
        screenshotPath: pkg.screenshotPath || "",
        priceJP: pkg.priceJP?.toString() || "",
        name: pkg.name || "",
        day: pkg.day || "",
      }))
      setDynamicInputsKLook(klookInputs)
    } else {
      setDynamicInputsKLook([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
    }

    // ดึงข้อมูล products_plans
    if (product.no_product) {
      await fetchProductsPlans(product.no_product)
    }

    setIsEditDialogOpen(true)
  }

  // ฟังก์ชันบันทึกการแก้ไข
  const handleSaveEdit = async () => {
    if (!selectedProduct) return

    if (!editFormData.name_product || !editFormData.price_product) {
      alert("กรุณากรอกชื่อสินค้าและราคา")
      return
    }

    try {
      // Create the request payload ตามรูปแบบที่ backend ต้องการ
      const packages_kkday = dynamicInputsKKDay.map(input => ({
        priceJP: input.priceJP || "",
        name: input.name || "",
        day: input.day || "",
        detail: editFormData.detail || "",
        price: "0", // ต้องเป็น string ตามตัวอย่าง
        screenshotPath: input.screenshotPath || "",
        status: null,
        error: null
      }));

      const packages_klook = dynamicInputsKLook.map(input => ({
        priceJP: input.priceJP || "",
        name: input.name || "",
        day: input.day || "",
        detail: editFormData.detail || "",
        price: "0", // ต้องเป็น string ตามตัวอย่าง
        screenshotPath: input.screenshotPath || "",
        status: null,
        error: null
      }));

      const payload = {
        no_product: selectedProduct.no_product,
        name_product: editFormData.name_product,
        price_product: editFormData.price_product.toString(), // ต้องเป็น string
        price_disc_pct_limit: editFormData.price_disc_pct_limit,
        price_disc_pct: editFormData.price_disc_pct,
        detail: editFormData.detail || "",
        category: selectedProduct.category || null,
        tags: selectedProduct.tags || [],
        url_kkday: editFormData.url_kkday || "",
        url_klook: editFormData.url_klook || "",
        packages_kkday: packages_kkday,
        packages_klook: packages_klook,
        // เพิ่มฟิลด์เพิ่มเติมถ้ามี
        kkday_status: selectedProduct.kkday_status || "not_scraped",
        kkday_last_scraped: selectedProduct.kkday_last_scraped || null,
      };

      const token = localStorage.getItem("token")

      // ใช้ PUT สำหรับการอัปเดตที่ endpoint /api/scrape/{id}
      const apiUrl = `http://localhost:4000/api/scrape/${selectedProduct._id || selectedProduct.no_product}`

      console.log("📤 Sending PUT request to:", apiUrl)
      console.log("📦 Payload:", payload)

      // ใช้ PUT สำหรับการอัปเดต
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })

      console.log("📡 PUT Response status:", response.status)
      console.log("📡 PUT Response headers:", response.headers.get("content-type"))

      // ตรวจสอบ content-type ก่อน parse JSON
      const contentType = response.headers.get("content-type")
      let data: any

      try {
        if (!contentType || !contentType.includes("application/json")) {
          // ถ้าไม่ใช่ JSON ให้อ่าน text ก่อน
          const text = await response.text()
          console.error("❌ Response is not JSON:", text.substring(0, 200))
          alert(`❌ เกิดข้อผิดพลาด: Server ส่ง HTML กลับมาแทน JSON\nStatus: ${response.status}\nลองตรวจสอบ API endpoint หรือ backend server`)
          return
        }

        // ถ้าเป็น JSON ให้ parse
        data = await response.json()
        console.log("📦 Response data:", data)
      } catch (parseError) {
        console.error("❌ Error parsing response:", parseError)
        if (parseError instanceof SyntaxError) {
          alert("❌ เกิดข้อผิดพลาด: Server ส่งข้อมูลที่ไม่ใช่ JSON กลับมา\nกรุณาตรวจสอบ API endpoint หรือ backend server")
        } else {
          alert(`❌ เกิดข้อผิดพลาดในการอ่านข้อมูล: ${parseError instanceof Error ? parseError.message : "Unknown error"}`)
        }
        return
      }

      if (response.ok && (data.success || data.message)) {
        setIsEditDialogOpen(false)
        setSelectedProduct(null)
        // Reset form
        setDynamicInputsKKDay([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
        setDynamicInputsKLook([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
        setProductsPlans([])
        // Refresh ข้อมูล products
        await fetchProducts()
        alert("✅ บันทึกการแก้ไขสำเร็จ")
      } else {
        alert(data.error || data.message || "ไม่สามารถบันทึกการแก้ไขได้")
      }
    } catch (error) {
      console.error("Error updating product:", error)
      if (error instanceof SyntaxError && error.message.includes("JSON")) {
        alert("❌ เกิดข้อผิดพลาด: Server ส่งข้อมูลที่ไม่ใช่ JSON กลับมา\nกรุณาตรวจสอบ API endpoint หรือ backend server")
      } else {
        alert(`❌ เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }
  }


  const FilterContent = () => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="ค้นหาชื่อพาส เช่น JR Pass, Kansai Pass..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-12 text-base"
        />
      </div>

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
          <Checkbox id="onSale" checked={showOnSaleOnly} onCheckedChange={(checked) => setShowOnSaleOnly(checked === true)} />
          <Label htmlFor="onSale" className="text-sm">
            เฉพาะที่ลดราคา
          </Label>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Update Info */}
      <div className="bg-blue-50 border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between text-sm text-blue-700">
            <div className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              <span>อัปเดตทุกชั่วโมง</span>
            </div>
            <span>ล่าสุด: {formatLastUpdate(lastUpdate)}</span>
          </div>
        </div>
      </div>

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
              <Checkbox id="onSale" checked={showOnSaleOnly} onCheckedChange={(checked) => setShowOnSaleOnly(checked === true)} />
              <Label htmlFor="onSale" className="text-sm">
                เฉพาะที่ลดราคา
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Filter Button */}
        <div className="mb-4 sm:hidden">
          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                ค้นหาและกรองผลลัพธ์
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

        {/* Results Summary */}
        <div className="mb-4 sm:mb-6">
          <p className="text-sm sm:text-base text-gray-600">
            พบ <span className="font-semibold text-blue-600">{products.length}</span> สินค้า
            {searchTerm && (
              <span>
                {" "}
                สำหรับ "<span className="font-medium">{searchTerm}</span>"
              </span>
            )}
          </p>
        </div>

        {/* Debug Info */}
        {(() => { console.log("🔍 Products in render:", products.length, products); return null; })()}

        {/* Comparison Results */}
        <div className="space-y-3 sm:space-y-4">
          {products.map((product) => {
            const packages = createPriceComparison(product)

            return (
              <Card key={product._id} className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Product Header */}
                  <div className="p-4 bg-gray-50 border-b">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{product.name_product}</h3>
                        <p className="text-sm text-gray-600 mb-2">Product ID: {product.no_product}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="ml-2">
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditDialog(product)}
                          className="h-8"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          แก้ไข
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Price: ฿{product.price_product}
                      </Badge>
                      {product.detail && (
                        <Badge variant="secondary">
                          {product.detail}
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      <div className="flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" />
                        <span>Packages Available: {packages.length}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Updated: {new Date(product.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Packages Comparison */}
                  <div className="p-6">
                    <div className="space-y-4">
                      {packages.map((pkg: any, index: number) => {
                        const bestProvider = getBestProvider(pkg.prices)
                        const bestPrice = getBestPrice(pkg.prices)

                        return (
                          <div key={`${product._id}-${index}`} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-semibold text-lg text-gray-900">{pkg.name}</h4>
                              {bestProvider && bestPrice > 0 && (
                                <div className="text-right">
                                  <div className="text-lg font-bold text-green-600">฿{formatPrice(bestPrice)}</div>
                                  <div className="text-xs text-gray-500">ราคาดีที่สุด</div>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Klook */}
                              <div
                                className={`border rounded-lg p-4 ${bestProvider === "klook" && isValidPrice(pkg.prices.klook[priceType]) ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">K</span>
                                    </div>
                                    <span className="font-medium">Klook</span>
                                  </div>
                                  {bestProvider === "klook" && isValidPrice(pkg.prices.klook[priceType]) && (
                                    <Badge variant="default" className="bg-green-500">
                                      ดีที่สุด
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xl font-bold text-gray-900 mb-3">
                                  {pkg.prices.klook[priceType] ? `฿${formatPrice(pkg.prices.klook[priceType])}` : "N/A"}
                                </div>
                                <Button asChild className="w-full" variant={bestProvider === "klook" && isValidPrice(pkg.prices.klook[priceType]) ? "default" : "outline"}>
                                  <a href={pkg.prices.klook.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    ซื้อที่ Klook
                                  </a>
                                </Button>
                              </div>

                              {/* KKday */}
                              <div
                                className={`border rounded-lg p-4 ${bestProvider === "kkday" && isValidPrice(pkg.prices.kkday[priceType]) ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-red-500 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">KK</span>
                                    </div>
                                    <span className="font-medium">KKday</span>
                                  </div>
                                  {bestProvider === "kkday" && isValidPrice(pkg.prices.kkday[priceType]) && (
                                    <Badge variant="default" className="bg-green-500">
                                      ดีที่สุด
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xl font-bold text-gray-900 mb-3">
                                  {pkg.prices.kkday[priceType] ? `฿${formatPrice(pkg.prices.kkday[priceType])}` : "N/A"}
                                </div>
                                <Button asChild className="w-full" variant={bestProvider === "kkday" && isValidPrice(pkg.prices.kkday[priceType]) ? "default" : "outline"}>
                                  <a href={pkg.prices.kkday.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    ซื้อที่ KKday
                                  </a>
                                </Button>
                              </div>

                              {/* JapanAllPass */}
                              <div
                                className={`border rounded-lg p-4 ${bestProvider === "japanAllPass" && isValidPrice(pkg.prices.japanAllPass[priceType]) ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                      <span className="text-white text-xs font-bold">JP</span>
                                    </div>
                                    <span className="font-medium">JapanAllPass</span>
                                  </div>
                                  {bestProvider === "japanAllPass" && isValidPrice(pkg.prices.japanAllPass[priceType]) && (
                                    <Badge variant="default" className="bg-green-500">
                                      ดีที่สุด
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xl font-bold text-gray-900 mb-3">
                                  {pkg.prices.japanAllPass[priceType] ? `฿${formatPrice(pkg.prices.japanAllPass[priceType])}` : "N/A"}
                                </div>
                                <Button
                                  asChild
                                  className="w-full"
                                  variant={bestProvider === "japanAllPass" && isValidPrice(pkg.prices.japanAllPass[priceType]) ? "default" : "outline"}
                                >
                                  <a href={pkg.prices.japanAllPass.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    ซื้อที่ JapanAllPass
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {products.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 sm:py-12">
              <div className="text-gray-500 mb-4">
                <Search className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-base sm:text-lg font-medium">ไม่พบข้อมูลสินค้า</p>
                <p className="text-sm">
                  {loading ? "กำลังโหลดข้อมูล..." : "ไม่มีข้อมูลสินค้าในระบบ"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขสินค้า</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลสินค้า {selectedProduct?.name_product || ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="edit-name">ชื่อสินค้า *</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name_product}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, name_product: e.target.value })
                  }
                  placeholder="ชื่อสินค้า"
                />
              </div>
              <div>
                <Label htmlFor="edit-price">ราคา (บาท) *</Label>
                <Input
                  id="edit-price"
                  type="number"
                  value={editFormData.price_product}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, price_product: e.target.value })
                  }
                  placeholder="ราคา"
                />
              </div>
              <div>
                <Label htmlFor="edit-price-disc-pct-limit">ราคาต่ำสุดได้กี่ %</Label>
                <Input
                  id="edit-price-disc-pct-limit"
                  type="number"
                  value={editFormData.price_disc_pct_limit}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, price_disc_pct_limit: Number(e.target.value) })
                  }
                  placeholder="%"
                />
              </div>
              <div>
                <Label htmlFor="edit-price-disc-pct">ราคาที่ลดจริงกี่ %</Label>
                <Input
                  id="edit-price-disc-pct"
                  type="number"
                  value={editFormData.price_disc_pct}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, price_disc_pct: Number(e.target.value) })
                  }
                  placeholder="%"
                />
              </div>
            </div>

            {/* Products Plans Info */}
            {productsPlans.length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-lg font-semibold text-purple-600">ข้อมูล Products Plans ที่สามารถเลือกได้</Label>
                  <Button
                    type="button"
                    onClick={() => autoFillPricesFromPlans(productsPlans)}
                    variant="outline"
                    size="sm"
                    className="bg-purple-100 hover:bg-purple-200 text-purple-700"
                  >
                    🔄 Auto-fill ราคา JP
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-40 overflow-y-auto">
                  {productsPlans.map((plan, index) => (
                    <div key={index} className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                      <div className="text-sm">
                        <div className="font-medium text-purple-700">ID: {plan.products_plans_id}</div>
                        <div className="text-purple-600">วัน: {plan.day}</div>
                        <div className="text-purple-600">ชื่อ: {plan.name}</div>
                        <div className="text-purple-600">ราคา: {plan.initial_price}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <hr></hr>
            <h1 className="text-xl font-semibold text-blue-600">ข้อมูล KKDay</h1>
            {/* Dynamic Inputs for KKDay */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-url-kkday">URL KKDAY</Label>
                <Input
                  id="edit-url-kkday"
                  type="url"
                  value={editFormData.url_kkday}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, url_kkday: e.target.value })
                  }
                  placeholder="URL"
                />
              </div>

              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50/60 space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-blue-700 font-semibold text-base">ข้อมูล KKDay จาก backend</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleFetchBackendKkday} disabled={backendKkdayLoading}>
                    {backendKkdayLoading ? "กำลังดึงข้อมูล..." : "ดึงราคาจาก backend"}
                  </Button>
                  {backendKkdayError && <span className="text-xs text-red-500">{backendKkdayError}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-backend-kkday-json" className="text-blue-700">JSON Body (request body) - Optional</Label>
                  <Textarea
                    id="edit-backend-kkday-json"
                    placeholder='{}'
                    value={backendKkdayRequestBody}
                    onChange={(e) => setBackendKkdayRequestBody(e.target.value)}
                    className="font-mono text-sm min-h-[100px]"
                    rows={4}
                  />
                  <p className="text-xs text-blue-600">กรุณาใส่ JSON ที่ถูกต้องสำหรับ request body (ถ้าไม่ใส่จะส่ง { })</p>
                </div>
                {backendKkdayData.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-blue-700">ข้อมูลที่ได้รับ ({backendKkdayData.length} รายการ)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                      {backendKkdayData.map((item: any, idx: number) => (
                        <div key={idx} className="border border-blue-300 rounded-md bg-white p-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="font-semibold text-blue-700">Package:</span>
                              <p className="text-xs text-gray-600">{item.package_name || "-"}</p>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">ราคา:</span>
                              <span className="font-semibold">฿ {item.price?.toLocaleString() || "-"}</span>
                            </div>
                            <div>
                              <span className="text-blue-600">SKU ID:</span>
                              <p className="text-xs font-mono text-gray-600">{item.sku_id || "-"}</p>
                            </div>
                            {item.selections && item.selections.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs font-semibold text-blue-600 mb-1">Selections:</p>
                                <div className="space-y-1">
                                  {item.selections.map((sel: any, selIdx: number) => (
                                    <div key={selIdx} className="text-xs">
                                      <span className="text-gray-500">{sel.spec_title}:</span>{" "}
                                      <span className="text-gray-700">{sel.option_name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-semibold text-blue-600">JSON Data:</p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={() => handleCopyJson(idx, item.sku_id || "")}
                                >
                                  {copiedIndex === idx ? (
                                    <>
                                      <Check className="h-3 w-3 mr-1 text-green-600" />
                                      <span className="text-green-600">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3 w-3 mr-1" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                              <div className="bg-gray-50 p-2 rounded border border-gray-200">
                                <code className="text-xs font-mono text-gray-700 break-all">
                                  {JSON.stringify({
                                    prodMid: (() => {
                                      try {
                                        const parsed = JSON.parse(backendKkdayRequestBody)
                                        return parsed.prodMid || ""
                                      } catch {
                                        return ""
                                      }
                                    })(),
                                    sku_id: item.sku_id || ""
                                  }, null, 2)}
                                </code>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  onClick={addNewInputKKDay}
                  variant="outline"
                  size="sm"
                >
                  + เพิ่มข้อมูล KKDay
                </Button>
              </div>
              {dynamicInputsKKDay.map((input, index) => (
                <div key={input.id} className="border border-blue-200 rounded-lg p-4 space-y-4 bg-blue-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-blue-700">KKDay ชุดที่ {index + 1}</h4>
                    {dynamicInputsKKDay.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeInputKKDay(input.id)}
                        variant="destructive"
                        size="sm"
                      >
                        ลบ
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor={`edit-kkday-screenshotPath-${input.id}`}>Screenshot Path</Label>
                      <Input
                        id={`edit-kkday-screenshotPath-${input.id}`}
                        placeholder="Path ของ Screenshot"
                        value={input.screenshotPath}
                        onChange={(e) => updateInputKKDay(input.id, 'screenshotPath', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-kkday-priceJP-${input.id}`}>ราคา JP</Label>
                      <Input
                        id={`edit-kkday-priceJP-${input.id}`}
                        placeholder="ราคา"
                        value={input.priceJP}
                        onChange={(e) => updateInputKKDay(input.id, 'priceJP', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-kkday-name-${input.id}`}>ชื่อ</Label>
                      <Input
                        id={`edit-kkday-name-${input.id}`}
                        placeholder="ชื่อ"
                        value={input.name}
                        onChange={(e) => updateInputKKDay(input.id, 'name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`edit-kkday-day-${input.id}`}>วัน</Label>
                      <Input
                        id={`edit-kkday-day-${input.id}`}
                        placeholder="วัน (เช่น 7DAYS, 10DAYS)"
                        value={input.day}
                        onChange={(e) => updateInputKKDay(input.id, 'day', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic Inputs for KLook */}
            <div className="space-y-4">
              <hr></hr>
              <h2 className="text-xl font-semibold text-green-600">ข้อมูล KLook</h2>

              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50/60 space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-purple-700 font-semibold text-base">ข้อมูล Klook จาก backend</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleFetchBackendKlook} disabled={backendKlookLoading}>
                    {backendKlookLoading ? "กำลังดึงข้อมูล..." : "ดึงราคาจาก backend"}
                  </Button>
                  {backendKlookError && <span className="text-xs text-red-500">{backendKlookError}</span>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-backend-klook-json" className="text-purple-700">JSON Body (request body)</Label>
                  <Textarea
                    id="edit-backend-klook-json"
                    placeholder='{"page_from": 2, "arrangement_id": 1762819200564715, "sku_list": [...]}'
                    value={backendKlookRequestBody}
                    onChange={(e) => setBackendKlookRequestBody(e.target.value)}
                    className="font-mono text-sm min-h-[150px]"
                    rows={8}
                  />
                  <p className="text-xs text-purple-600">กรุณาใส่ JSON ที่ถูกต้องสำหรับ request body</p>
                </div>
                {backendKlookPackages.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {backendKlookPackages.map((pkg: any, idx: number) => (
                      <div key={idx} className="border border-purple-300 rounded-md bg-white p-4 text-sm text-purple-700">
                        <p className="font-semibold">แพ็กเกจ: {pkg.package_name || "-"}</p>
                        <div className="mt-2 space-y-1">
                          {Array.isArray(pkg.sku_list) && pkg.sku_list.length > 0 ? (
                            pkg.sku_list.map((sku: any, skuIdx: number) => (
                              <div key={skuIdx} className="flex justify-between">
                                <span>{sku.text}</span>
                                <span>
                                  {sku.value}
                                  {sku.count ? ` (${sku.count})` : ""}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-purple-400">ไม่มีข้อมูล SKU</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="edit-url-klook">URL KLOOK</Label>
                <Input
                  id="edit-url-klook"
                  placeholder="URL"
                  value={editFormData.url_klook}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, url_klook: e.target.value })
                  }
                />
              </div>
              <div className="flex justify-between items-center">
                <Button
                  type="button"
                  onClick={addNewInputKLook}
                  variant="outline"
                  size="sm"
                >
                  + เพิ่มข้อมูล KLook
                </Button>
              </div>
              {dynamicInputsKLook.map((input, index) => (
                <div key={input.id} className="border border-green-200 rounded-lg p-4 space-y-4 bg-green-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-green-700">KLook ชุดที่ {index + 1}</h4>
                    {dynamicInputsKLook.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeInputKLook(input.id)}
                        variant="destructive"
                        size="sm"
                      >
                        ลบ
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edit-klook-screenshotPath-${input.id}`}>Screenshot Path</Label>
                      <textarea
                        className="w-full font-mono text-sm min-h-[150px] p-2 border border-gray-300 rounded-md resize-none"
                        id={`edit-klook-screenshotPath-${input.id}`}
                        placeholder="Path ของ Screenshot"
                        value={input.screenshotPath}
                        onChange={(e) => updateInputKLook(input.id, 'screenshotPath', e.target.value)}
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor={`edit-klook-priceJP-${input.id}`}>ราคา JP</Label>
                        <Input
                          id={`edit-klook-priceJP-${input.id}`}
                          placeholder="ราคา"
                          value={input.priceJP}
                          onChange={(e) => updateInputKLook(input.id, 'priceJP', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-klook-name-${input.id}`}>ชื่อ</Label>
                        <Input
                          id={`edit-klook-name-${input.id}`}
                          placeholder="ชื่อ"
                          value={input.name}
                          onChange={(e) => updateInputKLook(input.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`edit-klook-day-${input.id}`}>วัน</Label>
                        <Input
                          id={`edit-klook-day-${input.id}`}
                          placeholder="วัน (เช่น 7DAYS, 10DAYS)"
                          value={input.day}
                          onChange={(e) => updateInputKLook(input.id, 'day', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detail */}
            <div>
              <Label htmlFor="edit-detail">รายละเอียด</Label>
              <Textarea
                id="edit-detail"
                value={editFormData.detail}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, detail: e.target.value })
                }
                placeholder="รายละเอียดสินค้า"
                rows={4}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false)
                  setSelectedProduct(null)
                  setDynamicInputsKKDay([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
                  setDynamicInputsKLook([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }])
                  setProductsPlans([])
                  setBackendKkdayData([])
                  setBackendKlookPackages([])
                  setBackendKkdayError(null)
                  setBackendKlookError(null)
                  setCopiedIndex(null)
                }}
              >
                ยกเลิก
              </Button>
              <Button onClick={handleSaveEdit}>
                บันทึก
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
