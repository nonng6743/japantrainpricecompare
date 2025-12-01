import axios from 'axios';
import https from 'https';

/**
 * Get KKDay price data
 * @param {Object} params - Request parameters
 * @param {string} params.prodMid - Product MID (default: '25777')
 * @param {string} params.beginDate - Begin date (default: '2025-11-13')
 * @param {string} params.endDate - End date (default: '2026-02-09')
 * @param {string} params.previewToken - Preview token (default: '')
 * @param {string} params.sku_id - SKU ID to find specific price (optional)
 * @param {boolean} params.useBrowser - Use browser automation (default: false)
 * @returns {Promise<Object>} Response data
 */
async function getKkday(params = {}) {
  const {
    prodMid = '25777',
    beginDate = '2025-11-13',
    endDate = '2026-02-09',
    previewToken = '',
    sku_id = null,
    useBrowser = false
  } = params;

  const URL = `https://www.kkday.com/api/_nuxt/product/fetch-packages-data?prodMid=${prodMid}&previewToken=${previewToken}&beginDate=${beginDate}&endDate=${endDate}`;

  // More realistic browser headers to avoid CAPTCHA
  const HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Referer": `https://www.kkday.com/th/product/${prodMid}`,
    "Origin": "https://www.kkday.com",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    country_lang: "th-th",
    lang_ui: "th",
    UD1: "Thai_TH",
    UD4: "Thai_TH",
    currency: "THB",
    market: "th",
  };

  try {
    console.log('🔄 Fetching KKDay price data...');
    const response = await axios.get(URL, {
      headers: HEADERS,
      timeout: 20000,
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      maxRedirects: 5,
      validateStatus: function (status) {
        return status >= 200 && status < 400; // Accept 2xx and 3xx
      }
    });

    // Check if response is CAPTCHA redirect
    
    if (response.data && typeof response.data === 'object' && response.data.url && response.data.url.includes('captcha-delivery.com')) {
      console.error("❌ CAPTCHA detected in response");
      return {
        success: false,
        error: 'CAPTCHA detected',
        captcha: true
      };
    }

    const payload = response.data;

    if (payload.status !== 200) {
      console.error("❌ Unexpected status in payload:", payload.status);
      return {
        success: false,
        error: `Unexpected status: ${payload.status}`,
        data: payload
      };
    }

    const packageMap = payload?.data?.PACKAGE || {};
    if (!packageMap || Object.keys(packageMap).length === 0) {
      console.log("⚠️ No packages found in response.");
      return {
        success: true,
        data: [],
        priceValue: null
      };
    }

    const itemMap = payload?.data?.ITEM || {};
    const allSkuSummaries = [];
    let matchedPrice = null;
    let firstPrice = null;

    for (const [pkgId, pkg] of Object.entries(packageMap)) {
      const itemIds = pkg.items || [];

      if (itemIds.length === 0) {
        continue;
      }

      for (const itemId of itemIds) {
        const item = itemMap[String(itemId)];

        if (!item) {
          continue;
        }

        const specsMeta = item.specs || [];
        const skus = item.skus || [];

        if (!skus.length) {
          continue;
        }

        if (specsMeta.length) {
          for (const sku of skus) {
            const skuId = sku.sku_oid;
            const specMap = sku.spec || {};
            const selections = [];

            for (const [spec_oid, option_id] of Object.entries(specMap)) {
              const specDef = specsMeta.find((s) => s.spec_oid === spec_oid);
              if (!specDef) continue;

              const optionDef = specDef.spec_items?.find(
                (s) => s.spec_item_oid === option_id
              );

              const optionName = optionDef ? optionDef.name : option_id;

              selections.push({
                spec_oid,
                spec_title: specDef.spec_title || spec_oid,
                option_id,
                option_name: optionName,
              });
            }

            // Get price from item.sale_price (min_price or max_price)
            // If single_price.fullday exists, use it; otherwise use item.sale_price
            const price = sku.single_price?.fullday 
              || item.sale_price?.min_price 
              || item.sale_price?.max_price 
              || pkg.sale_price?.min_price 
              || pkg.sale_price?.max_price 
              || null;

            // If sku_id is provided, match it with current sku_oid
            if (sku_id && skuId === sku_id) {
              matchedPrice = price;
              console.log(`✅ Found matching SKU: ${sku_id}, price: ${price}`);
            }

            // Store first price found (fallback)
            if (price && !firstPrice) {
              firstPrice = price;
            }

            allSkuSummaries.push({
              package_id: pkgId,
              package_name: pkg.name || "(no name)",
              item_id: item.item_oid,
              sku_id: skuId,
              price,
              selections,
            });
          }
        }
      }
    }

    console.log(`✅ KKDay data fetched successfully`);
    
    // Use matched price if sku_id was provided and found, otherwise use first price
    const finalPrice = matchedPrice !== null ? matchedPrice : firstPrice;
    
    if (finalPrice) {
      console.log(`💰 Price value: ${finalPrice}${sku_id ? ` (matched SKU: ${sku_id})` : ' (first price found)'}`);
    } else if (sku_id) {
      console.log(`⚠️ SKU ID ${sku_id} not found in response`);
    }

    return {
      success: true,
      data: allSkuSummaries,
      priceValue: finalPrice
    };
  } catch (error) {
    console.error('❌ Error fetching KKDay data:', error.message);
    
    if (error.response) {
      const errorData = error.response.data;
      if (errorData && typeof errorData === 'object' && errorData.url && errorData.url.includes('captcha-delivery.com')) {
        console.error("❌ CAPTCHA detected in error response");
        return {
          success: false,
          error: 'CAPTCHA detected',
          captcha: true
        };
      }
      
      console.error('Error response data:', errorData);
      return {
        success: false,
        error: errorData,
        status: error.response.status
      };
    }

    if (error.request) {
      console.error('Error request data:', error.request);
      return {
        success: false,
        error: 'No response received from KKDay'
      };
    }

    return {
      success: false,
      error: error.message || 'Request failed'
    };
  }
}

// Export function for use in other modules
export { getKkday };

// Run automatically when executed directly
(async () => {
  try {
    console.log('🚀 Starting KKDay price update loop...');
    console.log('📅 Time:', new Date().toISOString());
    
    // Get API URL from environment or use default
    const API_URL = process.env.API_URL || 'http://localhost:4000/api/scrape';
    console.log('🌐 Fetching data from:', API_URL);
    
    // GET all scrape data from API
    const apiResponse = await axios.get(API_URL, {
      timeout: 30000,
      params: {
        limit: 1000, // Get more records if needed
        page: 1
      }
    });

    if (!apiResponse.data || !apiResponse.data.success) {
      throw new Error('Failed to fetch data from API');
    }

    const scrapeDataList = apiResponse.data.data || [];
    console.log(`📦 Found ${scrapeDataList.length} records to process`);

    if (scrapeDataList.length === 0) {
      console.log('⚠️ No records found');
      process.exit(0);
    }

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;

    // Loop through each scrape data record
    for (const record of scrapeDataList) {
      console.log(`\n📋 Processing record: ${record._id} - ${record.name_product || record.no_product}`);
      
      // Check if packages_kkday exists and is an array
      if (!record.packages_kkday || !Array.isArray(record.packages_kkday)) {
        console.log('⚠️ No packages_kkday found, skipping...');
        continue;
      }

      console.log(`   Found ${record.packages_kkday.length} KKDay packages`);

      // Create a copy of packages_kkday to update
      let updatedPackages = JSON.parse(JSON.stringify(record.packages_kkday || []));
      let hasUpdates = false;

      // Loop through each package in packages_kkday
      for (let i = 0; i < record.packages_kkday.length; i++) {
        const packageItem = record.packages_kkday[i];
        
        if (!packageItem.screenshotPath) {
          console.log(`   ⚠️ Package ${i + 1} (${packageItem.name || 'unnamed'}) has no screenshotPath, skipping...`);
          continue;
        }

        try {
          // Parse screenshotPath JSON string to get params
          let params;
          try {
            params = JSON.parse(packageItem.screenshotPath);
          } catch (parseError) {
            console.error(`   ❌ Failed to parse screenshotPath for package ${i + 1}:`, parseError.message);
            totalFailed++;
            continue;
          }

          console.log(`   🔄 Processing package ${i + 1}/${record.packages_kkday.length}: ${packageItem.name || 'unnamed'}`);
          console.log(`   📋 Params:`, JSON.stringify(params, null, 2));

          // Call getKkday with parsed params
          const result = await getKkday(params);
          totalProcessed++;

          if (result.success) {
            totalSuccess++;
            console.log(`   ✅ Success! Package: ${packageItem.name || 'unnamed'}`);
            
            // Extract price value
            let priceValue = result.priceValue;
            
            // If no priceValue in result, try to find first price in data array
            if (!priceValue && result.data && Array.isArray(result.data) && result.data.length > 0) {
              for (const skuSummary of result.data) {
                if (skuSummary.price) {
                  priceValue = skuSummary.price;
                  break;
                }
              }
            }
            
            if (priceValue) {
              console.log(`   💰 Price value: ${priceValue}`);
              
              // Extract numeric price (remove any currency symbols and commas)
              const numericPrice = String(priceValue).replace(/[฿$,\s]/g, '').trim();
              console.log(`   💵 Numeric price: ${numericPrice}`);
              
              // Get old price for logging
              const oldPrice = packageItem.price || null;
              
              // Always log price update (even if price hasn't changed)
              try {
                const recordId = typeof record._id === 'object' && record._id.$oid 
                  ? record._id.$oid 
                  : record._id;
                
                await axios.post(
                  `${API_URL.replace('/api/scrape', '/api/price-log')}`,
                  {
                    scrape_data_id: recordId,
                    source: 'kkday',
                    package_index: i,
                    package_name: packageItem.name || null,
                    package_day: packageItem.day || null,
                    name_product: record.name_product || null,
                    old_price: oldPrice,
                    new_price: numericPrice,
                    sku_id: params.sku_id || null,
                    update_method: 'cron',
                    status: 'success',
                    metadata: {
                      params: params,
                      package_name: packageItem.name
                    }
                  },
                  {
                    timeout: 5000,
                    headers: {
                      'Content-Type': 'application/json'
                    }
                  }
                );
                console.log(`   📝 Price log created: ${oldPrice} → ${numericPrice}${oldPrice === numericPrice ? ' (no change)' : ''}`);
              } catch (logError) {
                console.error(`   ⚠️ Failed to create price log:`, logError.message);
                // Don't fail the whole process if logging fails
              }
              
              // Update screenshotPath with price
              const updatedScreenshotPath = {
                ...params,
                price: numericPrice
              };
              
              // Update the specific package in updatedPackages array
              updatedPackages[i] = {
                ...updatedPackages[i],
                price: numericPrice,
                screenshotPath: JSON.stringify(updatedScreenshotPath)
              };
              
              hasUpdates = true;
              console.log(`   ✅ Package ${i + 1} marked for update: price=${numericPrice}`);
            } else {
              console.log(`   ⚠️ No price value found in response`);
            }
            
            // Optional: Add delay between requests to avoid rate limiting
            if (i < record.packages_kkday.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
            }
          } else {
            totalFailed++;
            console.error(`   ❌ Failed! Package: ${packageItem.name || 'unnamed'}`);
            console.error(`   Error:`, JSON.stringify(result.error, null, 2));
          }
        } catch (error) {
          totalFailed++;
          console.error(`   ❌ Error processing package ${i + 1}:`, error.message);
        }
      }

      // Update database once after processing all packages for this record
      if (hasUpdates) {
        // Handle _id format (could be string or object with $oid)
        const recordId = typeof record._id === 'object' && record._id.$oid 
          ? record._id.$oid 
          : record._id;
        
        console.log(`\n   🔄 Updating record ${recordId} with all package prices...`);
        console.log(`   📦 Updated packages:`, JSON.stringify(updatedPackages.map(p => ({ name: p.name, price: p.price })), null, 2));
        
        try {
          const patchData = {
            packages_kkday: updatedPackages
          };
          
          const patchResponse = await axios.patch(
            `${API_URL}/${recordId}`,
            patchData,
            {
              timeout: 15000,
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (patchResponse.data && patchResponse.data.success) {
            console.log(`   ✅ Successfully updated all package prices in database!`);
          } else {
            console.error(`   ⚠️ Update response:`, JSON.stringify(patchResponse.data, null, 2));
          }
        } catch (patchError) {
          console.error(`   ❌ Failed to update database:`, patchError.message);
          if (patchError.response) {
            console.error(`   Error details:`, JSON.stringify(patchError.response.data, null, 2));
          }
        }
      } else {
        console.log(`   ℹ️ No price updates to save for this record`);
      }

      // Add delay between records
      if (scrapeDataList.indexOf(record) < scrapeDataList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between records
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   ✅ Success: ${totalSuccess}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log('='.repeat(50));

    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    if (error.response) {
      console.error('API Error:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
})();

