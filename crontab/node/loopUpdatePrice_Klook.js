import axios from 'axios';

/**
 * Get Klook price data
 * @param {Object} params - Request parameters
 * @param {number} params.page_from - Page from (default: 2)
 * @param {number} params.arrangement_id - Arrangement ID (default: 1762819200564715)
 * @param {Array} params.sku_list - SKU list (default: [{ sku_id: 828952039775, quantity: 1 }, { sku_id: 828952039776, quantity: 1 }])
 * @returns {Promise<Object>} Response data
 */
async function getKlook(params = {}) {
  const URL = 'https://www.klook.com/v1/experiencesrv/order/settlement_service/pre_settlement';
  const HEADERS = {
    _pt: '9c9bb075-45c9-4a79-b7dc-cca8a11fa87f',
    accept: 'application/json, text/plain, */*',
    'accept-language': 'en_BS',
    baggage:
      'sentry-environment=production,sentry-release=ttdnode_20251112_35e7f8a8,sentry-public_key=97e83362921d08236f56e23cb4d960c9,sentry-trace_id=d15d52a981094fd3b20cc496ab62b12d',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    currency: 'THB',
    priority: 'u=1, i',
    'sec-ch-device-memory': '8',
    'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-full-version-list':
      '"Chromium";v="142.0.7444.135", "Google Chrome";v="142.0.7444.135", "Not_A Brand";v="99.0.0.0"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sentry-trace': 'd15d52a981094fd3b20cc496ab62b12d-97d698b2b88472c9',
    token: '',
    'x-klook-affiliate-aid': '',
    'x-klook-affiliate-pid': '',
    'x-klook-host': 'www.klook.com',
    'x-klook-kepler-id': '9bbf75c2-df0a-43d0-b654-923bfb54bf51',
    'x-klook-market': 'global',
    'x-klook-page-open-id': '',
    'x-klook-tint':
      '{"kepler":["253:861","669:3215","684:3546","694:3667","695:3674","706:3783","732:4304","741:4469","761:4623","768:4732","778:4888","779:4897","780:4903","787:4996","788:5005","818:5278","822:5363","851:5735","853:5740","854:5751","855:5752","871:5974","877:6067","885:6186","901:6288","910:6455","931:6736","933:6751","936:9309","948:7023","969:7423","970:7425","978:7536","980:7551","994:7879","1006:8210","1016:8314","1017:8338","1020:8414","1038:8663","1058:9017","1084:9630","1091:9724","1128:10287","1147:10834","1171:11684","1172:11691","1180:11872","1191:12047","1193:12101","1205:12359","1206:12362","1209:12385","1219:12858","1226:13132","1229:13466","1233:13338","1243:13401","1245:13481","1264:13863","1295:15296","1298:15429","1304:15491","1309:15662","1315:15687","1334:16177","1339:16217","1340:16222","1350:16662","1351:16664","1357:16745","1358:16742","1364:16919","1369:17000","1371:17009","1372:17053","1375:17137","1378:17204","1379:17209","1382:17314","1386:17615","1397:18048","1452:19742","1487:20706","1522:21328","1533:21689","1537:21796","1572:22732","1573:22735","1574:22738","1599:23643","1600:23646","1602:23675","1604:23680","1605:23682","1606:24267","1623:23861","1663:24742","1664:24744","1665:24750","1666:24760","1667:24772","1690:25402","1691:26210","1692:26200","1693:26203","1694:26859","1695:26856","1696:26853","1697:26193","1711:25664","1715:25836","1718:25877","1719:25878","1727:26084","1734:26276","1736:26379","1741:26402","1769:27015","1783:27640","1792:27883","1793:27885","1794:27887","1801:28078"]}',
    'x-klook-user-residence': '4_TH',
    'x-platform': 'desktop',
    'x-requested-with': 'XMLHttpRequest',
    referer:
      'https://www.klook.com/activity/49927-jr-east-tokyo-tokyowidepass/?spm=SearchResult.SearchResult_LIST&clickId=7a5065c05d'
  };

  const {
    page_from = 2,
    arrangement_id = 1762819200564715,
    sku_list = [
      { sku_id: 828952039775, quantity: 1 },
      { sku_id: 828952039776, quantity: 1 }
    ]
  } = params;

  const payload = {
    page_from,
    arrangement_id,
    sku_list
  };

  try {
    console.log('🔄 Fetching Klook price data...');
    const response = await axios.post(URL, payload, { headers: HEADERS, timeout: 20000 });
    console.log('✅ Klook data fetched successfully');
    
    // Extract value from response
    const responseData = response.data;
    let priceValue = null;
    
    // Priority 1: Use Market Price from SKU with quantity = 1
    // Find SKU with quantity = 1 from request payload
    const skuWithQuantity1 = payload.sku_list?.find(sku => sku.quantity === 1);
    
    if (skuWithQuantity1 && responseData?.result?.sku_list) {
      // Find matching SKU in response by sku_id
      const matchingSku = responseData.result.sku_list.find(
        sku => sku.sku_id === skuWithQuantity1.sku_id
      );
      
      if (matchingSku) {
        // Use market_price_text if available, otherwise use original_price_text
        if (matchingSku.market_price_text && matchingSku.market_price_text.trim() !== '') {
          priceValue = matchingSku.market_price_text;
          console.log(`💰 Market Price from SKU ${skuWithQuantity1.sku_id}: ${priceValue}`);
        } else if (matchingSku.original_price_text && matchingSku.original_price_text.trim() !== '') {
          priceValue = matchingSku.original_price_text;
          console.log(`💰 Original Price from SKU ${skuWithQuantity1.sku_id} (market_price not available): ${priceValue}`);
        }
      }
    }
    
    // Priority 2: If no Market Price found, try to find any SKU with quantity = 1 from price_summary
    if (!priceValue && responseData?.result?.price_summary?.package_list) {
      // Get all SKU IDs with quantity = 1 from payload
      const skuIdsWithQty1 = payload.sku_list
        ?.filter(sku => sku.quantity === 1)
        .map(sku => sku.sku_id) || [];
      
      for (const packageItem of responseData.result.price_summary.package_list) {
        if (packageItem.sku_list && Array.isArray(packageItem.sku_list)) {
          for (const skuItem of packageItem.sku_list) {
            // Check if this SKU has quantity = 1 and has market price info
            // Note: price_summary.sku_list doesn't have sku_id, so we check by count
            if (skuItem.count && skuItem.count.includes('x 1')) {
              // Try to find in sku_list by matching text or use value
              if (skuItem.value) {
                // Try to find corresponding SKU in result.sku_list
                const matchingSku = responseData.result.sku_list?.find(
                  sku => sku.original_price_text === skuItem.value || 
                         sku.market_price_text === skuItem.value
                );
                
                if (matchingSku?.market_price_text && matchingSku.market_price_text.trim() !== '') {
                  priceValue = matchingSku.market_price_text;
                  console.log(`💰 Market Price from package (qty=1): ${priceValue}`);
                  break;
                } else if (skuItem.value) {
                  // Fallback to value if market_price not found
                  priceValue = skuItem.value;
                  console.log(`💰 Price from package (qty=1, market_price not available): ${priceValue}`);
                  break;
                }
              }
            }
          }
          if (priceValue) break;
        }
      }
    }
    
    // Priority 3: Fallback to total_price (ราคารวมทั้งหมด)
    if (!priceValue && responseData?.result?.total_price) {
      priceValue = responseData.result.total_price;
      console.log(`💰 Total price (fallback): ${priceValue}`);
    }
    
    // Priority 4: Fallback to sum all SKU prices from price_summary
    if (!priceValue && responseData?.result?.price_summary?.package_list) {
      let totalSum = 0;
      let foundPrices = [];
      
      for (const packageItem of responseData.result.price_summary.package_list) {
        if (packageItem.sku_list && Array.isArray(packageItem.sku_list)) {
          for (const skuItem of packageItem.sku_list) {
            if (skuItem.value) {
              // Extract numeric value
              const numericValue = parseFloat(skuItem.value.replace(/฿\s*|,/g, '').trim());
              if (!isNaN(numericValue)) {
                totalSum += numericValue;
                foundPrices.push(skuItem.value);
              }
            }
          }
        }
      }
      
      if (totalSum > 0) {
        priceValue = `฿ ${totalSum.toLocaleString()}`;
        console.log(`💰 Sum of all SKU prices (fallback): ${priceValue} (from ${foundPrices.length} items)`);
      }
    }
    
    // Priority 5: Final fallback to first SKU price
    if (!priceValue && responseData?.result?.price_summary?.package_list) {
      for (const packageItem of responseData.result.price_summary.package_list) {
        if (packageItem.sku_list && Array.isArray(packageItem.sku_list)) {
          for (const skuItem of packageItem.sku_list) {
            if (skuItem.value) {
              priceValue = skuItem.value;
              console.log(`💰 First SKU price (final fallback): ${priceValue}`);
              break;
            }
          }
          if (priceValue) break;
        }
      }
    }
    
    return {
      success: true,
      data: response.data,
      priceValue: priceValue
    };
  } catch (error) {
    console.error('❌ Error fetching Klook data:', error.message);
    
    if (error.response) {
      console.error('Error response data:', error.response.data);
      return {
        success: false,
        error: error.response.data,
        status: error.response.status
      };
    }

    if (error.request) {
      console.error('Error request data:', error.request);
      return {
        success: false,
        error: 'No response received from Klook'
      };
    }

    return {
      success: false,
      error: error.message || 'Request failed'
    };
  }
}

// Export function for use in other modules
export { getKlook };

// Run automatically when executed directly
(async () => {
  try {
    console.log('🚀 Starting Klook price update loop...');
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
      
      // Check if packages_klook exists and is an array
      if (!record.packages_klook || !Array.isArray(record.packages_klook)) {
        console.log('⚠️ No packages_klook found, skipping...');
        continue;
      }

      console.log(`   Found ${record.packages_klook.length} Klook packages`);

      // Create a copy of packages_klook to update
      let updatedPackages = JSON.parse(JSON.stringify(record.packages_klook || []));
      let hasUpdates = false;

      // Loop through each package in packages_klook
      for (let i = 0; i < record.packages_klook.length; i++) {
        const packageItem = record.packages_klook[i];
        
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

          console.log(`   🔄 Processing package ${i + 1}/${record.packages_klook.length}: ${packageItem.name || 'unnamed'}`);
          console.log(`   📋 Params:`, JSON.stringify(params, null, 2));

          // Call getKlook with parsed params
          const result = await getKlook(params);
          totalProcessed++;

          if (result.success) {
            totalSuccess++;
            console.log(`   ✅ Success! Package: ${packageItem.name || 'unnamed'}`);
            
            // Extract price value
            let priceValue = result.priceValue;
            if (!priceValue) {
              // Try to extract from full response data
              const responseData = result.data;
              if (responseData?.result?.price_summary?.package_list) {
                for (const pkg of responseData.result.price_summary.package_list) {
                  if (pkg.sku_list && Array.isArray(pkg.sku_list)) {
                    for (const sku of pkg.sku_list) {
                      if (sku.value) {
                        priceValue = sku.value;
                        break;
                      }
                    }
                  }
                  if (priceValue) break;
                }
              }
            }
            
            if (priceValue) {
              console.log(`   💰 Price value: ${priceValue}`);
              
              // Extract numeric price (remove "฿ " and commas)
              const numericPrice = priceValue.replace(/฿\s*|,/g, '').trim();
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
                    source: 'klook',
                    package_index: i,
                    package_name: packageItem.name || null,
                    package_day: packageItem.day || null,
                    name_product: record.name_product || null,
                    old_price: oldPrice,
                    new_price: numericPrice,
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
            if (i < record.packages_klook.length - 1) {
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
            packages_klook: updatedPackages
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

