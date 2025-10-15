"use client"

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContactPage() {
  const [nameParamiter, setNameParamiter] = useState("");
  const [nameProduct, setNameProduct] = useState("");
  const [nameProductMin, setPriceProductMin] = useState("");
  const [priceProduct, setPriceProduct] = useState("");
  const [urlKKDay, setUrlKKDay] = useState("");
  const [urlKLook, setUrlKLook] = useState("");
  const [detail, setDetail] = useState("");
  const apiUrl = process.env.API_URL;
  const apiKey = process.env.API_KEY;

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();  // ป้องกันไม่ให้ฟอร์ม submit

    try {
      const response = await fetch(`https://api.japanallpass.com/api/products/${nameParamiter}`, {
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
        const productPlans = data.data.products_plans;
        const childPlan = productPlans.find((plan: { name: string; }) => plan.name === "Adult (Age 12 & up)");

        // เช็คว่าเจอข้อมูลแล้วหรือไม่
        if (childPlan) {
          alert(`ราคาของสินค้า: ${childPlan.product_price}`);  // แสดงราคาใน alert
          setPriceProduct(childPlan.product_price);
          setNameProduct(data.data.products[0].product_name);
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
    const payload = {
      no_product: nameParamiter,
      name_product: nameProduct,
      price_product: priceProduct,
      url_kkday: urlKKDay,
      url_klook: urlKLook,
      detail: detail,
    };

    try {
      // Make the API call
      const response = await fetch(`${apiUrl}api/scrape`, {
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
        alert("ข้อมูลถูกบันทึกแล้ว!" + data.klook.fullText);
        // Reset form
        setNameParamiter("");
        setNameProduct("");
        setPriceProductMin("");
        setPriceProduct("");
        setUrlKKDay("");
        setUrlKLook("");
        setDetail("");
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    <Label htmlFor="price_product_min">ราคาสินค้าต่ำสุด</Label>
                    <Input
                      id="price_product_min"
                      placeholder="ราคาสินค้าต่ำสุด"
                      onChange={(e) => setPriceProductMin(e.target.value)}
                    />
                  </div>
                </div>
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
                <div>
                  <Label htmlFor="url_klook">URL KLOOK</Label>
                  <Input
                    id="url_klook"
                    placeholder="URL"
                    value={urlKLook}
                    onChange={(e) => setUrlKLook(e.target.value)}
                  />
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
