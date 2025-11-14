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

  // ฟังก์ชันดึงข้อมูล products_plans
  const fetchProductsPlans = async (productId: string) => {
    try {
      const response = await fetch(`https://api.japanallpass.com/api/products/product_read_paramiter?product_params=${productId}`);
      const data = await response.json();

      if (data.success && data.data && data.data.products_plans) {
        setProductsPlans(data.data.products_plans);
        console.log("📦 Products Plans:", data.data.products_plans);
      }
    } catch (error) {
      console.error("❌ Error fetching products plans:", error);
    }
  };

  // ฟังก์ชัน map ข้อมูลจาก products_plans
  const mapProductsPlans = (name: string, day: string) => {
    const matchingPlan = productsPlans.find(plan =>
      plan.name.toLowerCase() === name.toLowerCase() &&
      plan.day.toLowerCase() === day.toLowerCase()
    );

    if (matchingPlan) {
      return {
        priceJP: matchingPlan.initial_price,
        name: matchingPlan.name,
        day: matchingPlan.day
      };
    }

    return null;
  };

  // ฟังก์ชัน auto-fill ราคา JP จาก products_plans
  const autoFillPricesFromPlans = (plans: any[]) => {
    // Auto-fill KKDay - เฉพาะช่องที่มีชื่อและวันแล้ว
    const updatedKKDay = dynamicInputsKKDay.map(input => {
      // ถ้ามีชื่อและวันแล้ว ให้ค้นหาราคาจาก plans
      if (input.name && input.day) {
        const matchingPlan = plans.find(plan =>
          plan.name.toLowerCase() === input.name.toLowerCase() &&
          plan.day.toLowerCase() === input.day.toLowerCase()
        );

        if (matchingPlan) {
          return {
            ...input,
            priceJP: matchingPlan.initial_price
          };
        }
      }

      return input;
    });

    // Auto-fill KLook - เฉพาะช่องที่มีชื่อและวันแล้ว
    const updatedKLook = dynamicInputsKLook.map(input => {
      // ถ้ามีชื่อและวันแล้ว ให้ค้นหาราคาจาก plans
      if (input.name && input.day) {
        const matchingPlan = plans.find(plan =>
          plan.name.toLowerCase() === input.name.toLowerCase() &&
          plan.day.toLowerCase() === input.day.toLowerCase()
        );

        if (matchingPlan) {
          return {
            ...input,
            priceJP: matchingPlan.initial_price
          };
        }
      }

      return input;
    });

    setDynamicInputsKKDay(updatedKKDay);
    setDynamicInputsKLook(updatedKLook);

    console.log("🔄 Auto-filled KKDay:", updatedKKDay);
    console.log("🔄 Auto-filled KLook:", updatedKLook);
  };

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

          // ดึงข้อมูล products_plans
          if (product.products_plans) {
            setProductsPlans(product.products_plans);
            console.log("📦 Products Plans:", product.products_plans);

            // เติมราคา JP ให้ช่องที่มีชื่อและวันตรงกันทันทีหลังค้นหา
            autoFillPricesFromPlans(product.products_plans);
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

      if (!response.ok) {
        // Handle HTTP errors with detailed message
        alert(`เกิดข้อผิดพลาด (${response.status}): ${data.error || 'ไม่ทราบสาเหตุ'}`);
        return;
      }

      if (data.success) {
        // Handle successful response
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
        alert("เกิดข้อผิดพลาด: " + data.error);
      }
    } catch (error) {
      // Handle network or other errors
      console.error("Error:", error);
      let errorMessage = "เกิดข้อผิดพลาดในการเชื่อมต่อ API";
      if (error instanceof Error) {
        errorMessage += ": " + error.message;
      }
      alert(errorMessage);
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
