import axios from 'axios';

/**
 * Calculate discount price based on JP price and limit
 * @param {number} jpPrice - Japan Pass price
 * @param {number} competitorPrice - Competitor price (KKDay or Klook)
 * @param {number} discountLimitPercent - Maximum discount percentage allowed
 * @returns {Object} { shouldDiscount: boolean, newPrice: number, discountPercent: number }
 */
function calculateDiscount(jpPrice, competitorPrice, discountLimitPercent) {
  if (!jpPrice || !competitorPrice || jpPrice <= competitorPrice) {
    return {
      shouldDiscount: false,
      newPrice: jpPrice,
      discountPercent: 0,
      reason: jpPrice <= competitorPrice ? 'JP price is not higher than competitor' : 'Missing price data'
    };
  }

  // Calculate required discount percentage to match competitor price
  const requiredDiscountPercent = ((jpPrice - competitorPrice) / jpPrice) * 100;
  
  // Check if required discount exceeds limit
  if (requiredDiscountPercent > discountLimitPercent) {
    return {
      shouldDiscount: false,
      newPrice: jpPrice,
      discountPercent: requiredDiscountPercent,
      reason: `Required discount ${requiredDiscountPercent.toFixed(2)}% exceeds limit ${discountLimitPercent}%`
    };
  }

  // Calculate new price (use competitor price)
  const newPrice = competitorPrice;
  
  return {
    shouldDiscount: true,
    newPrice: newPrice,
    discountPercent: requiredDiscountPercent,
    reason: 'Discount applied within limit'
  };
}

/**
 * Loop through scrape_data and apply discount when JP price is higher than KKDay/Klook
 */
(async () => {
  try {
    console.log('🚀 Starting price discount update loop...');
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
    let totalDiscounted = 0;
    let totalSkipped = 0;

    // Loop through each scrape data record
    for (const record of scrapeDataList) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📋 Processing record: ${record._id} - ${record.name_product || record.no_product}`);
      
      const recordId = typeof record._id === 'object' && record._id.$oid 
        ? record._id.$oid 
        : record._id;

      const discountLimitPercent = record.price_disc_pct_limit || 0;
      console.log(`   Discount limit: ${discountLimitPercent}%`);

      if (discountLimitPercent <= 0) {
        console.log('   ⚠️ No discount limit set, skipping...');
        totalProcessed++;
        continue;
      }

      let hasUpdates = false;
      let updatedKkdayPackages = JSON.parse(JSON.stringify(record.packages_kkday || []));
      let updatedKlookPackages = JSON.parse(JSON.stringify(record.packages_klook || []));

      // Match packages between KKDay and Klook by name and day
      const kkdayPackages = record.packages_kkday || [];
      const klookPackages = record.packages_klook || [];
      
      console.log(`   📦 Found ${kkdayPackages.length} KKDay packages and ${klookPackages.length} Klook packages`);
      
      // Create a map to match packages by name and day
      const packageMatches = [];
      
      for (let kkdayIdx = 0; kkdayIdx < kkdayPackages.length; kkdayIdx++) {
        const kkdayPkg = kkdayPackages[kkdayIdx];
        const kkdayName = (kkdayPkg.name || '').trim();
        const kkdayDay = (kkdayPkg.day || '').trim();
        
        // Find matching Klook package
        for (let klookIdx = 0; klookIdx < klookPackages.length; klookIdx++) {
          const klookPkg = klookPackages[klookIdx];
          const klookName = (klookPkg.name || '').trim();
          const klookDay = (klookPkg.day || '').trim();
          
          // Match by name and day
          if (kkdayName === klookName && kkdayDay === klookDay) {
            packageMatches.push({
              kkdayIdx,
              klookIdx,
              name: kkdayName,
              day: kkdayDay,
              kkdayPkg,
              klookPkg
            });
            break; // Found match, move to next KKDay package
          }
        }
      }
      
      console.log(`   🔗 Matched ${packageMatches.length} packages between KKDay and Klook`);
      
      // Process each matched package pair
      for (const match of packageMatches) {
        const { kkdayIdx, klookIdx, name, day, kkdayPkg, klookPkg } = match;
        
        // Parse prices
        const kkdayPriceRaw = kkdayPkg.price ? String(kkdayPkg.price).replace(/[฿$,\s]/g, '') : '0';
        const klookPriceRaw = klookPkg.price ? String(klookPkg.price).replace(/[฿$,\s]/g, '') : '0';
        const priceJPRaw = kkdayPkg.priceJP ? String(kkdayPkg.priceJP).replace(/[฿$,\s]/g, '') : null;
        
        const kkdayPrice = parseFloat(kkdayPriceRaw) || null;
        const klookPrice = parseFloat(klookPriceRaw) || null;
        const priceJP = priceJPRaw ? parseFloat(priceJPRaw) : null;
        
        // Validate: Need at least one competitor price (not 0 or null) and JP price
        const validCompetitorPrices = [];
        if (kkdayPrice && kkdayPrice > 0 && !isNaN(kkdayPrice)) {
          validCompetitorPrices.push({ price: kkdayPrice, source: 'kkday' });
        }
        if (klookPrice && klookPrice > 0 && !isNaN(klookPrice)) {
          validCompetitorPrices.push({ price: klookPrice, source: 'klook' });
        }
        
        if (validCompetitorPrices.length === 0 || !priceJP || isNaN(priceJP)) {
          console.log(`   ⚠️ Package "${name}" (${day}): Missing valid price data`);
          console.log(`      KKDay Price: ${kkdayPrice}, Klook Price: ${klookPrice}, JP Price: ${priceJP}`);
          console.log(`      Valid competitor prices: ${validCompetitorPrices.length}`);
          continue;
        }
        
        // Find the lowest price from valid competitors
        const lowestCompetitor = validCompetitorPrices.reduce((min, current) => 
          current.price < min.price ? current : min
        );
        const lowestCompetitorPrice = lowestCompetitor.price;
        const lowestSource = lowestCompetitor.source;
        
        console.log(`\n   📦 Processing package: "${name}" (${day})`);
        console.log(`      KKDay Price: ${kkdayPrice}`);
        console.log(`      Klook Price: ${klookPrice}`);
        console.log(`      Lowest Competitor: ${lowestCompetitorPrice} (${lowestSource})`);
        console.log(`      JP Price: ${priceJP}`);
        
        // Check if JP price is higher than lowest competitor price
        if (priceJP > lowestCompetitorPrice) {
          const discountResult = calculateDiscount(priceJP, lowestCompetitorPrice, discountLimitPercent);
          
          if (discountResult.shouldDiscount) {
            const newJPPrice = String(discountResult.newPrice);
            const oldJPPrice = String(priceJP);
            
            // Update priceJP in both KKDay and Klook packages
            updatedKkdayPackages[kkdayIdx] = {
              ...updatedKkdayPackages[kkdayIdx],
              priceJP: newJPPrice
            };
            
            updatedKlookPackages[klookIdx] = {
              ...updatedKlookPackages[klookIdx],
              priceJP: newJPPrice
            };
            
            hasUpdates = true;
            totalDiscounted++;
            
            console.log(`   ✅ Discount applied!`);
            console.log(`      Old JP Price: ${oldJPPrice}`);
            console.log(`      New JP Price: ${newJPPrice}`);
            console.log(`      Discount: ${discountResult.discountPercent.toFixed(2)}% (within limit ${discountLimitPercent}%)`);
            console.log(`      Updated priceJP in both KKDay and Klook packages`);
            
            // Log discount for KKDay
            try {
              await axios.post(
                `${API_URL.replace('/api/scrape', '/api/discount-log')}`,
                {
                  scrape_data_id: recordId,
                  source: 'kkday',
                  package_index: kkdayIdx,
                  package_name: name || null,
                  package_day: day || null,
                  name_product: record.name_product || null,
                  jp_price: parseFloat(oldJPPrice),
                  old_price: kkdayPrice,
                  new_price: kkdayPrice, // Competitor price doesn't change
                  discount_percent: discountResult.discountPercent,
                  discount_limit_percent: discountLimitPercent,
                  discount_amount: parseFloat(oldJPPrice) - parseFloat(newJPPrice),
                  is_applied: true,
                  reason: discountResult.reason,
                  metadata: {
                    source: 'discount',
                    competitor_price: kkdayPrice,
                    lowest_competitor_price: lowestCompetitorPrice,
                    lowest_source: lowestSource
                  }
                },
                {
                  timeout: 5000,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            } catch (logError) {
              console.error(`   ⚠️ Failed to create KKDay discount log:`, logError.message);
            }
            
            // Log discount for Klook
            try {
              await axios.post(
                `${API_URL.replace('/api/scrape', '/api/discount-log')}`,
                {
                  scrape_data_id: recordId,
                  source: 'klook',
                  package_index: klookIdx,
                  package_name: name || null,
                  package_day: day || null,
                  name_product: record.name_product || null,
                  jp_price: parseFloat(oldJPPrice),
                  old_price: klookPrice,
                  new_price: klookPrice, // Competitor price doesn't change
                  discount_percent: discountResult.discountPercent,
                  discount_limit_percent: discountLimitPercent,
                  discount_amount: parseFloat(oldJPPrice) - parseFloat(newJPPrice),
                  is_applied: true,
                  reason: discountResult.reason,
                  metadata: {
                    source: 'discount',
                    competitor_price: klookPrice,
                    lowest_competitor_price: lowestCompetitorPrice,
                    lowest_source: lowestSource
                  }
                },
                {
                  timeout: 5000,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
              console.log(`   📝 Discount logs created for both sources`);
            } catch (logError) {
              console.error(`   ⚠️ Failed to create Klook discount log:`, logError.message);
            }
          } else {
            totalSkipped++;
            console.log(`   ⏭️ Discount skipped`);
            console.log(`      Reason: ${discountResult.reason}`);
            if (discountResult.discountPercent > 0) {
              console.log(`      Required discount: ${discountResult.discountPercent.toFixed(2)}% (exceeds limit ${discountLimitPercent}%)`);
            }
            
            // Log skipped discount for KKDay
            try {
              await axios.post(
                `${API_URL.replace('/api/scrape', '/api/discount-log')}`,
                {
                  scrape_data_id: recordId,
                  source: 'kkday',
                  package_index: kkdayIdx,
                  package_name: name || null,
                  package_day: day || null,
                  name_product: record.name_product || null,
                  jp_price: priceJP,
                  old_price: kkdayPrice,
                  new_price: kkdayPrice, // No change
                  discount_percent: discountResult.discountPercent,
                  discount_limit_percent: discountLimitPercent,
                  discount_amount: 0,
                  is_applied: false,
                  reason: discountResult.reason,
                  metadata: {
                    source: 'discount',
                    competitor_price: kkdayPrice,
                    lowest_competitor_price: lowestCompetitorPrice,
                    lowest_source: lowestSource
                  }
                },
                {
                  timeout: 5000,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            } catch (logError) {
              console.error(`   ⚠️ Failed to create skipped discount log:`, logError.message);
            }
            
            // Log skipped discount for Klook
            try {
              await axios.post(
                `${API_URL.replace('/api/scrape', '/api/discount-log')}`,
                {
                  scrape_data_id: recordId,
                  source: 'klook',
                  package_index: klookIdx,
                  package_name: name || null,
                  package_day: day || null,
                  name_product: record.name_product || null,
                  jp_price: priceJP,
                  old_price: klookPrice,
                  new_price: klookPrice, // No change
                  discount_percent: discountResult.discountPercent,
                  discount_limit_percent: discountLimitPercent,
                  discount_amount: 0,
                  is_applied: false,
                  reason: discountResult.reason,
                  metadata: {
                    source: 'discount',
                    competitor_price: klookPrice,
                    lowest_competitor_price: lowestCompetitorPrice,
                    lowest_source: lowestSource
                  }
                },
                {
                  timeout: 5000,
                  headers: { 'Content-Type': 'application/json' }
                }
              );
            } catch (logError) {
              console.error(`   ⚠️ Failed to create skipped discount log:`, logError.message);
            }
          }
        } else {
          console.log(`   ℹ️ No discount needed (JP: ${priceJP} <= Lowest Competitor: ${lowestCompetitorPrice})`);
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
          console.log(`   ✅ Successfully updated discounted prices in database!`);
          totalSuccess++;
        } catch (patchError) {
          console.error(`   ❌ Failed to update database:`, patchError.message);
          totalFailed++;
        }
      } else {
        console.log(`   ℹ️ No price updates for this record`);
        totalSuccess++;
      }

      totalProcessed++;
      
      // Add delay between records
      if (scrapeDataList.indexOf(record) < scrapeDataList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary:');
    console.log(`   Total processed: ${totalProcessed}`);
    console.log(`   ✅ Success: ${totalSuccess}`);
    console.log(`   ❌ Failed: ${totalFailed}`);
    console.log(`   💰 Total discounted: ${totalDiscounted}`);
    console.log(`   ⏭️ Total skipped (exceeded limit): ${totalSkipped}`);
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
    console.error('  2. Verify API endpoint is accessible');
    console.error('  3. Check network connection');
    console.error('  4. Review API response format');
    
    process.exit(1);
  }
})();

