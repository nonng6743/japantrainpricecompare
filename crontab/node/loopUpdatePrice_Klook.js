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
      'sentry-environment=production,sentry-release=ttdnode_20251104_21d3b166,sentry-public_key=97e83362921d08236f56e23cb4d960c9,sentry-trace_id=bbe09c1e934e4f0daee36f78459acdac',
    'cache-control': 'no-cache',
    'content-type': 'application/json',
    currency: 'THB',
    priority: 'u=1, i',
    'sec-ch-device-memory': '8',
    'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
    'sec-ch-ua-arch': '"x86"',
    'sec-ch-ua-full-version-list':
      '"Google Chrome";v="141.0.7390.125", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.125"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-model': '""',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'sentry-trace': 'bbe09c1e934e4f0daee36f78459acdac-b4b5350a9973ff77',
    token: '',
    'x-klook-affiliate-aid': '103587',
    'x-klook-affiliate-pid': '',
    'x-klook-host': 'www.klook.com',
    'x-klook-kepler-id': '9c9bb075-45c9-4a79-b7dc-cca8a11fa87f',
    'x-klook-market': 'global',
    'x-klook-page-open-id': '',
    'x-klook-tint':
      '{"kepler":["253:861","669:3215","684:3546","694:3667","695:3674","706:3783","732:4304","741:4469","761:4623","768:4732","778:4888","779:4897","780:4904","787:4996","788:5005","818:5278","822:5363","851:5735","853:5740","854:5751","855:5752","871:5974","877:6067","885:6185","901:6288","910:6455","931:6736","933:6751","936:9309","948:7023","969:7423","970:7425","978:7536","980:7551","994:7879","1006:8210","1016:8314","1017:8338","1020:8414","1038:8663","1058:9017","1084:9630","1091:9724","1128:10287","1147:10834","1171:11684","1172:11691","1180:11872","1191:12047","1193:12100","1206:12362","1209:12385","1219:12858","1226:13132","1229:13466","1233:13338","1243:13401","1245:13481","1264:13863","1295:15296","1298:15429","1304:15492","1309:15662","1315:15687","1334:16177","1339:16217","1340:16222","1350:16662","1351:16664","1357:16737","1358:16742","1364:16919","1369:17000","1371:17009","1372:17052","1375:17136","1378:17205","1379:17207","1382:17315","1386:17615","1397:18048","1452:19742","1487:20705","1522:22730","1526:21485","1533:21689","1537:21796","1572:22732","1573:22735","1574:22738","1599:23643","1600:23647","1602:24273","1604:24849","1605:24270","1606:24267","1623:23861","1663:24742","1664:24744","1665:24751","1666:24760","1667:24772","1690:25402","1691:26210","1692:26200","1693:26203","1694:26859","1695:26856","1696:26853","1697:25429","1711:25664","1715:25836","1718:25877","1719:25878","1727:26084","1734:26276","1736:26379","1741:26400","1783:27641","1792:27883","1793:27885","1794:27887","1806:28204"]}',
    'x-klook-traffic-channel': 'aid_103587',
    'x-klook-user-residence': '4_TH',
    'x-platform': 'desktop',
    'x-requested-with': 'XMLHttpRequest',
    cookie:
      'kepler_id=9c9bb075-45c9-4a79-b7dc-cca8a11fa87f; klk_ps=1; _fwb=50u3APXbmZBE4zY8jeKg5x.1759746031334; __lt__cid=9a4cb6ca-784f-46b1-9ef7-a9726ca86668; __lt__cid.c83939be=9a4cb6ca-784f-46b1-9ef7-a9726ca86668; _gcl_au=1.1.207773315.1759746032; _gac_UA-86696233-1=1.1759746032.Cj0KCQjw0Y3HBhCxARIsAN7931UYPE9OXyZJjMphnBBHAGR752G76ExD_vU4B7MtzIeCsxr5XX5H1CYaAj8GEALw_wcB; _yjsu_yjad=1759746031.4ee719d6-40b0-4e06-a71c-e7b2c6987e5d; _tt_enable_cookie=1; _ttp=01K6WGK038K8K32K9AKGCFR439_.tt.1; dable_uid=77446518.1759746032169; clientside-cookie=df8a8284fa145aa6e42600838f0f9588e6b3a3e8370cbf4393df9b6bd66449f6ce87f3f7c532209763be55868d7371ae006ed9ff2a65c888e365558d3914ad22b2698ca3cf270ce9b2829a5e0f21321596482cf1260749309d9e518381ba4245ecb86b7451ec7eedbd6f64d50efa36a9dbc442bb849e2d87b542b311a28d332a690b0e4c20748b8bdae90678ff83d6b4fdfcb2a0d1f59e4753e855; _gcl_aw=GCL.1759746443.Cj0KCQjw0Y3HBhCxARIsAN7931UYPE9OXyZJjMphnBBHAGR752G76ExD_vU4B7MtzIeCsxr5XX5H1CYaAj8GEALw_wcB; locale=en-us; aid=103587; wid=103587; aid_query_string=aid%3D103587%26aff_adid%3D1156000%26aff_pid%3D%26aff_sid%3D%26aff_klick_id%3D113670177681-103587-1156000-5ae955e; affiliate_type=network; aid_extra=%7B%22aff_adid%22%3A1156000%2C%22aff_klick_id%22%3A%22113670177681-103587-1156000-5ae955e%22%2C%22aff_lpath%22%3A%22www.klook.com%2F%22%2C%22affiliate_partner%22%3A%22%22%2C%22content%22%3A%22%22%7D; aid_campaign=aid=103587&utm_medium=affiliate-alwayson&utm_source=network&utm_campaign=103587&aff_adid=1156000; tr_update_tt=1762755973180; persisted_source=www.google.com; campaign_tag=klc_l1=Affiliate; k_tff_ch=aid_103587; _gcl_gs=2.1.k1$i1762755971$u86271810; _gid=GA1.2.631467908.1762755977; traffic_retain=true; JSESSIONID=136686A6E3C13F85564F1CAF9C6EA645; KOUNT_SESSION_ID=136686A6E3C13F85564F1CAF9C6EA645; klk_currency=THB; klk_rdc=TH; klk_ga_sn=8118644347..1762855358377; __lt__sid=30f27392-06903ebf; __lt__sid.c83939be=30f27392-06903ebf; _uetsid=2974fed0bdfe11f084d465b7194de6db; _uetvid=16a12f60a29e11f0a52ef9698922bb21; KSID=MQ.e30cbe0ee642432a5ac8ca7d88b5f63e; wcs_bt=s_2cb388a4aa34:1762855360; _ga_FW3CMDM313=GS2.1.s1762855358$o30$g1$t1762855359$j59$l0$h0; _ga_HSY7KJ18X2=GS2.1.s1762855358$o31$g1$t1762855359$j59$l0$h0; _ga=GA1.2.1037106831.1759746032; ttcsid_C1SIFQUHLSU5AAHCT7H0=1762855360155::skqTbHT0NqKBEIGS5iUR.25.1762855362290.0; ttcsid=1762855360155::gRXv-A2we09vRA2dz7cH.25.1762855362290.0; forterToken=d2c3f2bcd0e94c88884e3bf06300d7db_1762855359981__UDF43-m4_21ck_; datadome=92UT~QbsogWSxHsObWpQVt3U1CH4KRjdsB9tCVGuJuz6mxNI9MBDUk3oFav~ryb0Hw9eYwOUgs2wf3YdjupC_HdVZ1bLb_S50YfCOEJN8P8SvhipMfmOsDtGlCe6hgn4; klk_i_sn=2806482834..1762855983832; _dc_gtm_UA-86696233-1=1; _ga_V8S4KC8ZXR=GS2.1.s1762855358$o29$g1$t1762856422$j60$l0$h691966103',
    Referer:
      'https://www.klook.com/activity/3278-5-day-jr-kansai-hiroshima-area-pass-jr-pass/?spm=SearchResult.SearchResult_LIST&clickId=fa4980becd'
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
    
    if (responseData?.result?.price_summary?.package_list) {
      for (const packageItem of responseData.result.price_summary.package_list) {
        if (packageItem.sku_list && Array.isArray(packageItem.sku_list)) {
          for (const skuItem of packageItem.sku_list) {
            if (skuItem.value) {
              priceValue = skuItem.value;
              console.log(`💰 Price value: ${priceValue}`);
              break;
            }
          }
          if (priceValue) break;
        }
      }
    }
    
    // If not found in price_summary, try total_price
    if (!priceValue && responseData?.result?.total_price) {
      priceValue = responseData.result.total_price;
      console.log(`💰 Total price: ${priceValue}`);
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

