import axios from 'axios';

const JAPANALLPASS_API = 'https://api.japanallpass.com/api/products/product_read_paramiter';

/**
 * Transform plans from JapanAllPass API response (รองรับ comboJTR และ jtr)
 * @param {any} responseData - Response data from API
 * @returns {Array} Transformed plans array
 */
function transformPlansFromResponse(responseData) {
  if (!responseData) return [];

  const rawItems = Array.isArray(responseData)
    ? responseData
    : Array.isArray(responseData?.data)
      ? responseData.data
      : [];

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return [];
  }

  const groupedByParams = rawItems.reduce((acc, item) => {
    const key = item?.product_params || "";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  // แยก comboJTR และ jtr items
  const comboJTRItems = rawItems.filter((item) => item?.source === "comboJTR");
  const jtrItems = rawItems.filter((item) => item?.source === "jtr" && Array.isArray(item?.products_plans) && item.products_plans.length > 0);

  const allPlans = [];

  // จัดการ jtr items
  if (jtrItems.length > 0) {
    jtrItems.forEach((jtrItem) => {
      if (Array.isArray(jtrItem.products_plans) && jtrItem.products_plans.length > 0) {
        const relatedItems = (groupedByParams[jtrItem.product_params] || []).filter(
          (item) => item !== jtrItem && Array.isArray(item?.products_plans) && item.products_plans.length > 0
        );

        const firstRelatedPlan = relatedItems.length > 0 ? relatedItems[0].products_plans[0] : null;
        const firstPlan = jtrItem.products_plans[0];
        
        if (firstPlan) {
          allPlans.push({
            products_plans_id: firstPlan.products_plans_id ?? jtrItem.products_id ?? firstRelatedPlan?.products_plans_id ?? null,
            name: jtrItem.product_name || firstPlan.name || "",
            day: firstPlan.day || jtrItem.detail || firstRelatedPlan?.day || "",
            initial_price: firstPlan.initial_price || null,
            source: jtrItem.source || "jtr",
            product_params: jtrItem.product_params || null,
            combo: false,
            product_name: jtrItem.product_name || "",
          });
        }
      }
    });
  }

  // จัดการ comboJTR items
  if (comboJTRItems.length > 0) {
    const comboPlans = comboJTRItems
      .map((comboItem) => {
        const relatedItems = (groupedByParams[comboItem.product_params] || []).filter(
          (item) => item !== comboItem && Array.isArray(item?.products_plans) && item.products_plans.length > 0
        );

        const firstRelatedPlan = relatedItems.length > 0 ? relatedItems[0].products_plans[0] : null;

        return {
          products_plans_id: comboItem.products_id ?? firstRelatedPlan?.products_plans_id ?? null,
          name: comboItem.product_name || comboItem.product_params || "",
          day: comboItem.detail || comboItem.product_params || firstRelatedPlan?.day || comboItem.product_name || "",
          initial_price: comboItem.initial_price || comboItem.product_price || firstRelatedPlan?.initial_price || null,
          source: comboItem.source || null,
          product_params: comboItem.product_params || null,
          combo: true,
          related_plan_id: firstRelatedPlan?.products_plans_id ?? null,
          product_name: comboItem.product_name || "",
        };
      })
      .filter((plan) => plan.initial_price !== null);

    allPlans.push(...comboPlans);
  }

  // ถ้ามี plans แล้ว return
  if (allPlans.length > 0) {
    return allPlans;
  }

  // Fallback: หา item ที่มี products_plans
  const itemWithPlans = rawItems.find(
    (item) => Array.isArray(item?.products_plans) && item.products_plans.length > 0
  );

  return itemWithPlans?.products_plans ?? [];
}

/**
 * Fetch products plans from JapanAllPass API
 * @param {string} productParams - Product parameters (no_product)
 * @returns {Promise<Array>} Array of transformed plans
 */
async function fetchProductsPlans(productParams) {
  try {
    if (!productParams) {
      console.log('   ⚠️ No product_params provided');
      return [];
    }

    const url = `${JAPANALLPASS_API}?product_params=${encodeURIComponent(productParams)}`;
    console.log(`   🔄 Fetching from JapanAllPass API: ${productParams}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.data) {
      console.log('   ⚠️ No data in response');
      return [];
    }

    const transformedPlans = transformPlansFromResponse(response.data.data || response.data);
    console.log(`   ✅ Found ${transformedPlans.length} plans from JapanAllPass`);
    
    return transformedPlans;
  } catch (error) {
    console.error(`   ❌ Error fetching from JapanAllPass API:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}, Data:`, JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

/**
 * Match package with plan by name and day
 * @param {Object} packageItem - Package item from scrape_data
 * @param {Array} plans - Plans from JapanAllPass API
 * @returns {Object|null} Matching plan or null
 */
function matchPackageWithPlan(packageItem, plans) {
  if (!packageItem.name || !packageItem.day || !plans || plans.length === 0) {
    return null;
  }

  // Try exact match first
  const exactMatch = plans.find(plan =>
    plan.name && plan.day &&
    plan.name.toLowerCase().trim() === packageItem.name.toLowerCase().trim() &&
    plan.day.toLowerCase().trim() === packageItem.day.toLowerCase().trim()
  );

  if (exactMatch) {
    return exactMatch;
  }

  // Try partial match (name contains or day contains)
  const partialMatch = plans.find(plan =>
    plan.name && plan.day &&
    (plan.name.toLowerCase().includes(packageItem.name.toLowerCase()) ||
     packageItem.name.toLowerCase().includes(plan.name.toLowerCase())) &&
    (plan.day.toLowerCase().includes(packageItem.day.toLowerCase()) ||
     packageItem.day.toLowerCase().includes(plan.day.toLowerCase()))
  );

  return partialMatch || null;
}

/**
 * Loop through scrape_data and update JP prices from JapanAllPass API
 */
(async () => {
  try {
    console.log('🚀 Starting JP price update loop...');
    console.log('📅 Time:', new Date().toISOString());
    
    // Get API URL from environment or use default
    const API_URL = process.env.API_URL || 'http://localhost:4000/api/scrape';
    console.log('🌐 Fetching data from:', API_URL);
    
    // GET all scrape data from API
    const apiResponse = await axios.get(API_URL, {
      timeout: 30000,
      params: {
        limit: 1000,
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
    let totalUpdated = 0;

    // Loop through each scrape data record
    for (const record of scrapeDataList) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing record: ${record._id} - ${record.name_product || record.no_product}`);
      
      const recordId = typeof record._id === 'object' && record._id.$oid 
        ? record._id.$oid 
        : record._id;

      if (!record.no_product) {
        console.log('   ⚠️ No no_product found, skipping...');
        continue;
      }

      try {
        // Fetch plans from JapanAllPass API
        const plans = await fetchProductsPlans(record.no_product);
        
        if (plans.length === 0) {
          console.log('   ⚠️ No plans found from JapanAllPass API');
          totalProcessed++;
          continue;
        }

        let hasUpdates = false;
        let updatedKkdayPackages = JSON.parse(JSON.stringify(record.packages_kkday || []));
        let updatedKlookPackages = JSON.parse(JSON.stringify(record.packages_klook || []));

        // Update KKDay packages
        if (record.packages_kkday && Array.isArray(record.packages_kkday) && record.packages_kkday.length > 0) {
          console.log(`   📦 Processing ${record.packages_kkday.length} KKDay packages...`);
          
          for (let i = 0; i < record.packages_kkday.length; i++) {
            const packageItem = record.packages_kkday[i];
            const matchedPlan = matchPackageWithPlan(packageItem, plans);
            
            if (matchedPlan && matchedPlan.initial_price) {
              const oldPriceJP = packageItem.priceJP || null;
              const newPriceJP = String(matchedPlan.initial_price);
              
              // Only update if price has changed
              if (oldPriceJP !== newPriceJP) {
                updatedKkdayPackages[i] = {
                  ...updatedKkdayPackages[i],
                  priceJP: newPriceJP
                };
                
                hasUpdates = true;
                totalUpdated++;
                
                console.log(`   ✅ KKDay Package ${i + 1} (${packageItem.name || 'N/A'}): ${oldPriceJP || 'N/A'} → ${newPriceJP}`);
                
                // Log price update
                try {
                  await axios.post(
                    `${API_URL.replace('/api/scrape', '/api/price-log')}`,
                    {
                      scrape_data_id: recordId,
                      source: 'kkday',
                      package_index: i,
                      package_name: packageItem.name || null,
                      package_day: packageItem.day || null,
                      name_product: record.name_product || null,
                      old_price: oldPriceJP,
                      new_price: newPriceJP,
                      sku_id: null,
                      update_method: 'cron',
                      status: 'success',
                      metadata: {
                        source: 'japanallpass',
                        plan_id: matchedPlan.products_plans_id,
                        product_params: record.no_product
                      }
                    },
                    {
                      timeout: 5000,
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                  console.log(`   📝 PriceJP log created: ${oldPriceJP || 'N/A'} → ${newPriceJP}`);
                } catch (logError) {
                  console.error(`   ⚠️ Failed to create priceJP log:`, logError.message);
                }
              } else {
                console.log(`   ℹ️ KKDay Package ${i + 1} (${packageItem.name || 'N/A'}): No change (${newPriceJP})`);
              }
            } else {
              console.log(`   ⚠️ KKDay Package ${i + 1} (${packageItem.name || 'N/A'}): No matching plan found`);
            }
          }
        }

        // Update Klook packages
        if (record.packages_klook && Array.isArray(record.packages_klook) && record.packages_klook.length > 0) {
          console.log(`   📦 Processing ${record.packages_klook.length} Klook packages...`);
          
          for (let i = 0; i < record.packages_klook.length; i++) {
            const packageItem = record.packages_klook[i];
            const matchedPlan = matchPackageWithPlan(packageItem, plans);
            
            if (matchedPlan && matchedPlan.initial_price) {
              const oldPriceJP = packageItem.priceJP || null;
              const newPriceJP = String(matchedPlan.initial_price);
              
              // Only update if price has changed
              if (oldPriceJP !== newPriceJP) {
                updatedKlookPackages[i] = {
                  ...updatedKlookPackages[i],
                  priceJP: newPriceJP
                };
                
                hasUpdates = true;
                totalUpdated++;
                
                console.log(`   ✅ Klook Package ${i + 1} (${packageItem.name || 'N/A'}): ${oldPriceJP || 'N/A'} → ${newPriceJP}`);
                
                // Log price update
                try {
                  await axios.post(
                    `${API_URL.replace('/api/scrape', '/api/price-log')}`,
                    {
                      scrape_data_id: recordId,
                      source: 'klook',
                      package_index: i,
                      package_name: packageItem.name || null,
                      package_day: packageItem.day || null,
                      name_product: record.name_product || null,
                      old_price: oldPriceJP,
                      new_price: newPriceJP,
                      update_method: 'cron',
                      status: 'success',
                      metadata: {
                        source: 'japanallpass',
                        plan_id: matchedPlan.products_plans_id,
                        product_params: record.no_product
                      }
                    },
                    {
                      timeout: 5000,
                      headers: { 'Content-Type': 'application/json' }
                    }
                  );
                  console.log(`   📝 PriceJP log created: ${oldPriceJP || 'N/A'} → ${newPriceJP}`);
                } catch (logError) {
                  console.error(`   ⚠️ Failed to create priceJP log:`, logError.message);
                }
              } else {
                console.log(`   ℹ️ Klook Package ${i + 1} (${packageItem.name || 'N/A'}): No change (${newPriceJP})`);
              }
            } else {
              console.log(`   ⚠️ Klook Package ${i + 1} (${packageItem.name || 'N/A'}): No matching plan found`);
            }
          }
        }

        // Update database if there are updates
        if (hasUpdates) {
          try {
            const patchData = {};
            if (updatedKkdayPackages.length > 0) {
              patchData.packages_kkday = updatedKkdayPackages;
            }
            if (updatedKlookPackages.length > 0) {
              patchData.packages_klook = updatedKlookPackages;
            }
            
            await axios.patch(
              `${API_URL}/${recordId}`,
              patchData,
              {
                timeout: 15000,
                headers: { 'Content-Type': 'application/json' }
              }
            );
            console.log(`   ✅ Successfully updated priceJP in database!`);
            totalSuccess++;
          } catch (patchError) {
            console.error(`   ❌ Failed to update database:`, patchError.message);
            totalFailed++;
          }
        } else {
          console.log(`   ℹ️ No priceJP updates for this record`);
          totalSuccess++;
        }

        totalProcessed++;
        
        // Add delay between records to avoid rate limiting
        if (scrapeDataList.indexOf(record) < scrapeDataList.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
      } catch (error) {
        totalFailed++;
        console.error(`   ❌ Error processing record:`, error.message);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   ✅ Success: ${totalSuccess}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   🔄 Total priceJP updated: ${totalUpdated}`);
    console.log('='.repeat(60));

    process.exit(totalFailed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Unexpected error occurred!');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('API Response Error:');
      console.error('  Status:', error.response.status);
      console.error('  Status Text:', error.response.statusText);
      console.error('  Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('Request Error:');
      console.error('  No response received from server');
      console.error('  Request config:', JSON.stringify({
        url: error.config?.url,
        method: error.config?.method,
        timeout: error.config?.timeout
      }, null, 2));
    } else {
      console.error('Error details:', error);
    }
    
    console.error('\n💡 Troubleshooting tips:');
    console.error('  1. Check if API server is running at:', process.env.API_URL || 'http://localhost:4000');
    console.error('  2. Verify JapanAllPass API is accessible');
    console.error('  3. Check network connection');
    console.error('  4. Review API response format');
    
    process.exit(1);
  }
})();
