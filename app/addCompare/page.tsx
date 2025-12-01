"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { count } from "console";
import { apiUrl } from "@/lib/env";

export default function ContactPage() {
  const [nameParamiter, setNameParamiter] = useState("");
  const [nameProduct, setNameProduct] = useState("");
  const [PriceProductMin, setPriceProductMin] = useState(0);
  const [PriceDiscPct, setPriceDiscPct] = useState(0);
  const [priceProduct, setPriceProduct] = useState("");
  const [urlKKDay, setUrlKKDay] = useState("");
  const [urlKLook, setUrlKLook] = useState("");
  const [detail, setDetail] = useState("");
  // ข้อมูลเพิ่มเติม
  // Dynamic inputs state for KKDay
  const [dynamicInputsKKDay, setDynamicInputsKKDay] = useState([
    { id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }
  ]);

  // Dynamic inputs state for KLook
  const [dynamicInputsKLook, setDynamicInputsKLook] = useState([
    { id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }
  ]);

  // Products plans state
  const [productsPlans, setProductsPlans] = useState<any[]>([])

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

  const [backendKkdayData, setBackendKkdayData] = useState<any[]>([])
  const [backendKkdayLoading, setBackendKkdayLoading] = useState(false)
  const [backendKkdayError, setBackendKkdayError] = useState<string | null>(null)
  const [backendKkdayRequestBody, setBackendKkdayRequestBody] = useState<string>('{"prodMid":"151309"}')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // ฟังก์ชัน transform plans จาก response (รองรับ comboJTR)
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

    // แยก comboJTR และ jtr items
    const comboJTRItems = rawItems.filter((item) => item?.source === "comboJTR")
    const jtrItems = rawItems.filter((item) => item?.source === "jtr" && Array.isArray(item?.products_plans) && item.products_plans.length > 0)

    const allPlans: any[] = []

    // จัดการ jtr items - ใช้ logic เหมือน comboJTR (ดึงจาก relatedItems) แต่ราคาใช้แค่ตัวแรก
    if (jtrItems.length > 0) {
      jtrItems.forEach((jtrItem) => {
        if (Array.isArray(jtrItem.products_plans) && jtrItem.products_plans.length > 0) {
          // หา relatedItems (ถ้ามี)
          const relatedItems = (groupedByParams[jtrItem.product_params] || []).filter(
            (item) => item !== jtrItem && Array.isArray(item?.products_plans) && item.products_plans.length > 0
          )

          const firstRelatedPlan = relatedItems.length > 0 ? relatedItems[0].products_plans[0] : null

          // ใช้แค่ products_plans[0] ตัวแรกเท่านั้น (ราคาเดียว)
          const firstPlan = jtrItem.products_plans[0]
          
          if (firstPlan) {
            allPlans.push({
              products_plans_id: firstPlan.products_plans_id ?? jtrItem.products_id ?? firstRelatedPlan?.products_plans_id ?? null,
              name: jtrItem.product_name || firstPlan.name || "", // ใช้ product_name ก่อน (เช่น "บัตร JR Sapporo-Furano Area Pass 4 Days (เด็ก 6-11 ปี)")
              day: firstPlan.day || jtrItem.detail || firstRelatedPlan?.day || "",
              initial_price: firstPlan.initial_price || null, // ใช้ราคาจากตัวแรกเท่านั้น
              source: jtrItem.source || "jtr",
              product_params: jtrItem.product_params || null,
              combo: false,
              product_name: jtrItem.product_name || "",
            })
          }
        }
      })
    }

    // จัดการ comboJTR items - ใช้ราคาของตัวเองเป็นหลัก
    if (comboJTRItems.length > 0) {
      const comboPlans = comboJTRItems
        .map((comboItem) => {
          const relatedItems = (groupedByParams[comboItem.product_params] || []).filter(
            (item) => item !== comboItem && Array.isArray(item?.products_plans) && item.products_plans.length > 0
          )

          const firstRelatedPlan = relatedItems.length > 0 ? relatedItems[0].products_plans[0] : null

          // ใช้ราคาของ comboJTR item เองก่อน (ไม่ดึงจาก relatedItems)
          return {
            products_plans_id: comboItem.products_id ?? firstRelatedPlan?.products_plans_id ?? null,
            name: comboItem.product_name || comboItem.product_params || "",
            day: comboItem.detail || comboItem.product_params || firstRelatedPlan?.day || comboItem.product_name || "",
            // ใช้ราคาของตัวเองก่อน (initial_price หรือ product_price) แล้วค่อย fallback ไปหา relatedItems
            initial_price: comboItem.initial_price || comboItem.product_price || firstRelatedPlan?.initial_price || null,
            source: comboItem.source || null,
            product_params: comboItem.product_params || null,
            combo: true,
            related_plan_id: firstRelatedPlan?.products_plans_id ?? null,
            product_name: comboItem.product_name || "",
          }
        })
        .filter((plan) => plan.initial_price !== null)

      allPlans.push(...comboPlans)
    }

    // ถ้ามี plans แล้ว return
    if (allPlans.length > 0) {
      return allPlans
    }

    // Fallback: หา item ที่มี products_plans
    const itemWithPlans = rawItems.find(
      (item) => Array.isArray(item?.products_plans) && item.products_plans.length > 0
    )

    return itemWithPlans?.products_plans ?? []
  }

  // ฟังก์ชันดึงข้อมูล products_plans
  const fetchProductsPlans = async (productId: string) => {
    try {
      const response = await fetch(`https://api.japanallpass.com/api/products/product_read_paramiter?product_params=${productId}`);
      const data = await response.json();

      // แสดง JSON response ทั้งหมด
      console.log("📥 API Response JSON:", JSON.stringify(data, null, 2));
      console.log("📦 Raw Data:", data.data);

      if (data.success && data.data) {
        // ใช้ transformPlansFromResponse เพื่อรองรับ comboJTR
        const transformedPlans = transformPlansFromResponse(data.data);
        setProductsPlans(transformedPlans);
        console.log("📦 Transformed Products Plans:", transformedPlans);
      } else if (data.success && data.data?.products_plans) {
        // Fallback: ถ้ามี products_plans โดยตรง
        const transformedPlans = transformPlansFromResponse(data.data.products_plans);
        setProductsPlans(transformedPlans);
        console.log("📦 Products Plans (fallback):", transformedPlans);
      }
    } catch (error) {
      console.error("❌ Error fetching products plans:", error);
    }
  };

  // ฟังก์ชัน auto-fill ราคา JP จาก products_plans
  const normalizeText = (value?: string) =>
    (value ?? "")
      .toString()
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()

  const looselyMatch = (source: string, target: string) => {
    if (!source || !target) return false
    return source === target || source.includes(target) || target.includes(source)
  }

  const findPlanByNameDay = (plans: any[], name: string, day: string) => {
    const targetName = normalizeText(name)
    const targetDay = normalizeText(day)

    if (!targetName || !targetDay) {
      console.warn("⚠️ findPlanByNameDay requires both name & day", { name, day })
      return null
    }

    return (
      plans.find((plan) => {
        const planName = normalizeText(plan.name)
        const planDay = normalizeText(plan.day)

        // เช็ค day ก่อน (ต้องตรงกันหรือคล้ายกัน)
        const dayMatch = planDay === targetDay || looselyMatch(planDay, targetDay)
        if (!dayMatch) return false

        // เช็ค name แบบยืดหยุ่น - รองรับกรณีที่มีคำเพิ่มเติมข้างหน้า/หลัง
        // เช่น "Railway Museum Pupil" กับ "Kyoto Railway Museum Pupil"
        const nameMatch = 
          planName === targetName || 
          planName.includes(targetName) || 
          targetName.includes(planName) ||
          // เช็คว่าคำสำคัญตรงกัน (แยกเป็นคำแล้วเช็คว่าคำสำคัญทั้งหมดมีใน plan)
          (() => {
            // แยกเป็นคำและกรองคำสั้นๆ (< 3 ตัวอักษร)
            const planWords = planName.split(/\s+/).filter(w => w.length >= 3)
            const targetWords = targetName.split(/\s+/).filter(w => w.length >= 3)
            
            // ถ้ามีคำสำคัญน้อยกว่า 2 คำ ให้ใช้วิธีเดิม
            if (targetWords.length < 2) {
              return looselyMatch(planName, targetName)
            }
            
            // เช็คว่าคำสำคัญทั้งหมดใน target อยู่ใน plan หรือไม่ (อนุโลมการเรียงลำดับ)
            const allWordsMatch = targetWords.every(targetWord => 
              planWords.some(planWord => 
                planWord.includes(targetWord) || targetWord.includes(planWord)
              )
            )
            
            return allWordsMatch
          })()

        if (nameMatch && dayMatch) {
          console.log("✅ Plan matched", {
            inputName: name,
            inputDay: day,
            planName: plan.name,
            planDay: plan.day,
            planPrice: plan.initial_price,
          })
          return true
        }

        return false
      }) || null
    )
  }

  const mapProductsPlans = (name: string, day: string) => {
    if (!productsPlans.length) return null

    const hasName = !!name?.trim()
    const hasDay = !!day?.trim()
    if (!hasName || !hasDay) {
      console.warn("⚠️ mapProductsPlans requires both name & day", { name, day })
      return null
    }

    const matchingPlan = findPlanByNameDay(productsPlans, name, day)

    if (matchingPlan) {
      console.log("✅ mapProductsPlans matched", {
        inputName: name,
        inputDay: day,
        plan: matchingPlan,
      })
      return {
        priceJP: matchingPlan.initial_price,
        name: matchingPlan.name,
        day: matchingPlan.day,
      }
    }

    console.warn("⚠️ mapProductsPlans no match", { name, day })
    return null
  }

  const autoFillPricesFromPlans = (plans: any[]) => {
    const fillInputs = (inputs: any[], source: "kkday" | "klook") =>
      inputs.map((input) => {
        if (!input.name?.trim() || !input.day?.trim()) return input
        if (!input.name?.trim() || !input.day?.trim()) return input

        const matchingPlan = findPlanByNameDay(plans, input.name, input.day)

        if (matchingPlan) {
          console.log("✅ Auto-fill matched plan", {
            source,
            inputId: input.id,
            plan: matchingPlan,
          })
          return {
            ...input,
            priceJP: matchingPlan.initial_price,
            name: matchingPlan.name || input.name,
            day: matchingPlan.day || input.day,
          }
        }

        console.warn("⚠️ ไม่พบ plan ที่ตรงกับ input:", {
          source,
          inputName: input.name,
          inputDay: input.day,
        })

        return input
      })

    const updatedKKDay = fillInputs(dynamicInputsKKDay, "kkday")
    const updatedKLook = fillInputs(dynamicInputsKLook, "klook")

    setDynamicInputsKKDay(updatedKKDay)
    setDynamicInputsKLook(updatedKLook)

    console.log("🔄 Auto-filled KKDay:", updatedKKDay)
    console.log("🔄 Auto-filled KLook:", updatedKLook)
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

      const response = await fetch(apiUrl("api/scrape/getKlook"), {
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

      const response = await fetch(apiUrl("api/scrape/getKkday"), {
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

  const addNewInputKKDay = () => {
    const newId = Math.max(...dynamicInputsKKDay.map(input => input.id)) + 1;
    setDynamicInputsKKDay([...dynamicInputsKKDay, { id: newId, screenshotPath: "", priceJP: "", name: "", day: "" }]);
  };

  const removeInputKKDay = (id: number) => {
    if (dynamicInputsKKDay.length > 1) {
      setDynamicInputsKKDay(dynamicInputsKKDay.filter(input => input.id !== id));
    }
  };

  const updateInputKKDay = (id: number, field: string, value: string) => {
    setDynamicInputsKKDay(dynamicInputsKKDay.map(input => {
      if (input.id === id) {
        const updatedInput = { ...input, [field]: value };

        // ถ้าเป็นการเปลี่ยน name หรือ day ให้ auto-fill priceJP
        if ((field === 'name' || field === 'day') && updatedInput.name.trim() && updatedInput.day.trim()) {
          const mappedData = mapProductsPlans(updatedInput.name, updatedInput.day);
          updatedInput.priceJP = mappedData ? mappedData.priceJP : "";
        }

        return updatedInput;
      }
      return input;
    }));
  };

  const addNewInputKLook = () => {
    const newId = Math.max(...dynamicInputsKLook.map(input => input.id)) + 1;
    setDynamicInputsKLook([...dynamicInputsKLook, { id: newId, screenshotPath: "", priceJP: "", name: "", day: "" }]);
  };

  const removeInputKLook = (id: number) => {
    if (dynamicInputsKLook.length > 1) {
      setDynamicInputsKLook(dynamicInputsKLook.filter(input => input.id !== id));
    }
  };

  const updateInputKLook = (id: number, field: string, value: string) => {
    setDynamicInputsKLook(dynamicInputsKLook.map(input => {
      if (input.id === id) {
        const updatedInput = { ...input, [field]: value };

        // ถ้าเป็นการเปลี่ยน name หรือ day ให้ auto-fill priceJP
        if ((field === 'name' || field === 'day') && updatedInput.name.trim() && updatedInput.day.trim()) {
          const mappedData = mapProductsPlans(updatedInput.name, updatedInput.day);
          updatedInput.priceJP = mappedData ? mappedData.priceJP : "";
        }

        return updatedInput;
      }
      return input;
    }));
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();  // ป้องกันไม่ให้ฟอร์ม submit
    alert(nameParamiter)
    try {
      const response = await fetch(`https://api.japanallpass.com/api/products/product_read_paramiter?product_params=${nameParamiter}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      // แสดง JSON response ทั้งหมด
      console.log("📥 Search API Response JSON:", JSON.stringify(data, null, 2));
      console.log("📦 Search Raw Data:", data.data);

      if (!response.ok) {
        alert(`เกิดข้อผิดพลาด (${response.status}): ${data.error || 'ไม่ทราบสาเหตุ'}`);
        return;
      } else {
        // สมมติว่าคุณต้องการแสดงราคาจาก "Child (Age 6-11)"
        const product = data.data[0];

        // เช็คว่าเจอข้อมูลแล้วหรือไม่
        if (product) {
          alert(`ราคาของสินค้า: ${product.product_price}`);  // แสดงราคาใน alert
          setPriceProduct(product.product_price);
          setNameProduct(product.product_name);

          // ดึงข้อมูล products_plans และรองรับ comboJTR
          if (data.data) {
            const transformedPlans = transformPlansFromResponse(data.data);
            setProductsPlans(transformedPlans);
            console.log("📦 Transformed Products Plans (from search):", transformedPlans);

            // เติมราคา JP ให้ช่องที่มีชื่อและวันตรงกันทันทีหลังค้นหา
            autoFillPricesFromPlans(transformedPlans);
          } else if (product.products_plans) {
            const transformedPlans = transformPlansFromResponse(product.products_plans);
            setProductsPlans(transformedPlans);
            console.log("📦 Products Plans (fallback):", transformedPlans);

            // เติมราคา JP ให้ช่องที่มีชื่อและวันตรงกันทันทีหลังค้นหา
            autoFillPricesFromPlans(transformedPlans);
          }

        } else {
          alert('ไม่พบข้อมูลราคา');
        }
      }
    } catch (error) {
      console.error("Error:", error);
      alert("เกิดข้อผิดพลาดในการเชื่อมต่อ API");
    }
  };

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();

    // Create the request payload
    const packages_kkday = dynamicInputsKKDay.map(input => ({
      priceJP: input.priceJP,
      name: input.name,
      day: input.day,
      detail: detail,
      price: 0,
      screenshotPath: input.screenshotPath,
      status: null
    }));

    const packages_klook = dynamicInputsKLook.map(input => ({
      priceJP: input.priceJP,
      name: input.name,
      day: input.day,
      detail: detail,
      price: 0,
      screenshotPath: input.screenshotPath,
      status: null
    }));

    const payload = {
      no_product: nameParamiter,
      name_product: nameProduct,
      price_product: priceProduct,
      price_disc_pct_limit: PriceProductMin,
      price_disc_pct: PriceDiscPct,
      url_kkday: urlKKDay,
      url_klook: urlKLook,
      detail: detail,
      packages_kkday: packages_kkday,
      packages_klook: packages_klook,
    };

    console.log("Payload ที่ส่งไป:", JSON.stringify(payload, null, 2));

    try {
      // Make the API call
      const response = await fetch(apiUrl("api/scrape"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📦 Response data:", data);

      if (!response.ok) {
        // Handle HTTP errors with detailed message
        const errorMsg = data.error || data.message || 'ไม่ทราบสาเหตุ';
        alert(`❌ เพิ่มข้อมูลไม่สำเร็จ (HTTP ${response.status})\n\nข้อผิดพลาด: ${errorMsg}`);
        return;
      }

      if (data.success) {
        // Handle successful response
        const successMsg = data.message || 'ข้อมูลถูกบันทึกเรียบร้อยแล้ว';
        alert(`✅ เพิ่มข้อมูลสำเร็จ!\n\n${successMsg}\n\nชื่อสินค้า: ${nameProduct || nameParamiter}\nราคา: ${priceProduct}`);
        
        // Reset form
        setNameParamiter("");
        setNameProduct("");
        setPriceProductMin(0);
        setPriceProduct("");
        setUrlKKDay("");
        setUrlKLook("");
        setDetail("");
        setDynamicInputsKKDay([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }]);
        setDynamicInputsKLook([{ id: 1, screenshotPath: "", priceJP: "", name: "", day: "" }]);
        setProductsPlans([]);
      } else {
        // Handle failure response
        const errorMsg = data.error || data.message || 'ไม่ทราบสาเหตุ';
        alert(`❌ เพิ่มข้อมูลไม่สำเร็จ\n\nข้อผิดพลาด: ${errorMsg}`);
      }
    } catch (error) {
      // Handle network or other errors
      console.error("❌ Error:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ API";
      if (error instanceof Error) {
        errorMessage += `\n\nรายละเอียด: ${error.message}`;
      }
      alert(`❌ ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            เพิ่มการเทียบราคา
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            ใส้ข้อมูล URL เพื่อใช้ในการเทียบ
          </p>
        </div>

        <div className="grid grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-600" />
                เพิ่มการเทียบราคา
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name_paramiter">คำค้นหา</Label>
                    <Input
                      id="name_paramiter"
                      placeholder="คำค้นหา"
                      value={nameParamiter}
                      onChange={(e) => setNameParamiter(e.target.value)}
                    />
                  </div>
                  <div>
                    <br></br>
                    <Button className="w-full" onClick={handleSearch}>
                      <Send className="h-4 w-4 mr-2" />
                      ค้นหาข้อมูล
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="name_product">ชื่อสินค้า</Label>
                    <Input
                      id="name_product"
                      placeholder="ชื่อสินค้า"
                      value={nameProduct}
                      onChange={(e) => setNameProduct(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_product">ราคาสินค้า</Label>
                    <Input
                      id="price_product"
                      placeholder="ราคาสินค้า"
                      value={priceProduct}
                      onChange={(e) => setPriceProduct(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_disc_pct_limit">ราคาต่ำสุดได้กี่ %</Label>
                    <Input
                      type="number"
                      id="price_product_min"
                      placeholder="ราคาสินค้าต่ำสุด"
                      onChange={(e) => setPriceProductMin(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_disc_pct_limit">ราคาที่ลดจริงกี่ %</Label>
                    <Input
                      type="number"
                      id="price_disc_pct_limit"
                      placeholder="ราคาสินค้าต่ำสุด"
                      onChange={(e) => setPriceDiscPct(Number(e.target.value))}
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
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {/* Dynamic Inputs for KKDay */}
                <h1 className="text-xl font-semibold text-blue-600">ข้อมูล KKDay</h1>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="url_kkday">URL KKDAY</Label>
                    <Input
                      id="url_kkday"
                      type="url"
                      placeholder="URL"
                      value={urlKKDay}
                      onChange={(e) => setUrlKKDay(e.target.value)}
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
                      <Label htmlFor="backend-kkday-json" className="text-blue-700">JSON Body (request body) - Optional</Label>
                      <Textarea
                        id="backend-kkday-json"
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
                          <Label htmlFor={`kkday-screenshotPath-${input.id}`}>Screenshot Path</Label>
                          <Input
                            id={`kkday-screenshotPath-${input.id}`}
                            placeholder="Path ของ Screenshot"
                            value={input.screenshotPath}
                            onChange={(e) => updateInputKKDay(input.id, 'screenshotPath', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`kkday-priceJP-${input.id}`}>ราคา JP</Label>
                          <Input
                            id={`kkday-priceJP-${input.id}`}
                            placeholder="ราคา"
                            value={input.priceJP}
                            onChange={(e) => updateInputKKDay(input.id, 'priceJP', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`kkday-name-${input.id}`}>ชื่อ</Label>
                          <Input
                            id={`kkday-name-${input.id}`}
                            placeholder="ชื่อ"
                            value={input.name}
                            onChange={(e) => updateInputKKDay(input.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`kkday-day-${input.id}`}>วัน</Label>
                          <Input
                            id={`kkday-day-${input.id}`}
                            placeholder="วัน (เช่น 7DAYS, 10DAYS)"
                            value={input.day}
                            onChange={(e) => updateInputKKDay(input.id, 'day', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                    <Label htmlFor="backend-klook-json" className="text-purple-700">JSON Body (request body)</Label>
                    <Textarea
                      id="backend-klook-json"
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

                {/* Dynamic Inputs for KLook */}
                <div className="space-y-4">

                  <div>
                    <Label htmlFor="url_klook">URL KLOOK</Label>
                    <Input
                      id="url_klook"
                      placeholder="URL"
                      value={urlKLook}
                      onChange={(e) => setUrlKLook(e.target.value)}
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
                      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                        <Label htmlFor={`klook-screenshotPath-${input.id}`}>Screenshot Path</Label>
                        <textarea
                          className="font-mono text-sm min-h-[150px]"
                          id={`klook-screenshotPath-${input.id}`}
                          placeholder="Path ของ Screenshot"
                          value={input.screenshotPath}
                          onChange={(e) => updateInputKLook(input.id, 'screenshotPath', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor={`klook-priceJP-${input.id}`}>ราคา JP</Label>
                          <Input
                            id={`klook-priceJP-${input.id}`}
                            placeholder="ราคา"
                            value={input.priceJP}
                            onChange={(e) => updateInputKLook(input.id, 'priceJP', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`klook-name-${input.id}`}>ชื่อ</Label>
                          <Input
                            id={`klook-name-${input.id}`}
                            placeholder="ชื่อ"
                            value={input.name}
                            onChange={(e) => updateInputKLook(input.id, 'name', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`klook-day-${input.id}`}>วัน</Label>
                          <Input
                            id={`klook-day-${input.id}`}
                            placeholder="วัน (เช่น 7DAYS, 10DAYS)"
                            value={input.day}
                            onChange={(e) => updateInputKLook(input.id, 'day', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <Label htmlFor="detail">รายละเอียด</Label>
                  <Textarea
                    id="detail"
                    placeholder="เขียนข้อความของคุณที่นี่..."
                    className="min-h-[120px]"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Send className="h-4 w-4 mr-2" />
                  บันทึกข้อมูล
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div >
  );
}
