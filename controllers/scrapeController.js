import { scrapeService } from '../services/scrapeService.js';
import { spawn } from 'child_process';
import axios from 'axios';
import https from 'https';
import { chromium } from 'playwright';
export const scrapeController = {
  // POST /api/scrape - Scrape both KKDay and KLook URLs

  async scrapeBothloop(req, res) {
    const python = spawn('python', ['crontab/python/index.py', 'https://www.kkday.com/th/product/158964?qs=JR+TOKYO+Wide+Pass', 'world']);

    let result = '';
    python.stdout.on('data', (data) => {
      result += data.toString();
    });

    python.stderr.on('data', (data) => {
      console.error(`Error: ${data}`);
    });

    python.on('close', (code) => {
      console.log(`Python exited with code ${code}`);
      res.send(`Result from Python: ${result}`);
    });
  },

  async scrapeBoth(req, res) {
    const {
      no_product,
      name_product,
      price_product,
      detail,
      url_kkday,
      packages_kkday,
      url_klook,
      packages_klook
    } = req.body;

    // Check if both URLs are provided
    if (!url_kkday || !url_klook) {
      return res.status(400).json({
        success: false,
        error: 'Both url_kkday and url_klook are required.'
      });
    }

    console.log('📡 API: /api/scrape called with:', req.body);

    try {
      // Scrape both URLs
      const [resultKKDay, resultKLook] = await Promise.all([
        scrapeService.scrapeWithOCRKday(packages_kkday, url_kkday),
        scrapeService.scrapeWithOCRKlook(packages_klook, url_klook)
      ]);

      // Create scrape data using service
      const scrapeData = {
        no_product,
        name_product,
        price_product,
        detail,
        url_kkday,
        packages_kkday: resultKKDay,
        url_klook,
        packages_klook: resultKLook
      };

      const savedData = await scrapeService.createScrapeData(scrapeData);
      console.log('💾 Data saved to MongoDB:', savedData._id);

      // Send the result back to the client
      res.json({
        success: true,
        data: savedData
      });
    } catch (error) {
      console.error('❌ Error during scraping:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // POST /api/scrape-price - Scrape prices after ฿ symbol
  async scrapePrice(req, res) {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required'
      });
    }

    console.log('📡 API: /api/scrape-price called with URL:', url);

    try {
      const result = await scrapeService.scrapePriceWithOCR(url);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('❌ Error during price scraping:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/scrape - Get all scrape data
  async getAllScrapeData(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await scrapeService.getAllScrapeData(parseInt(page), parseInt(limit));
      res.json({ success: true, ...result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/scrape/:id - Get scrape data by ID
  async getScrapeDataById(req, res) {
    try {
      const data = await scrapeService.getScrapeDataById(req.params.id);
      res.json({ success: true, data });
    } catch (error) {
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // PUT /api/scrape/:id - Update scrape data by ID (Full Update)
  async updateScrapeData(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PUT /api/scrape/:id called with ID:', id);
      console.log('📡 Update data:', updateData);

      const updatedData = await scrapeService.updateScrapeData(id, updateData);
      console.log('✅ Data updated successfully:', updatedData._id);

      res.json({
        success: true,
        message: 'Scrape data updated successfully',
        data: updatedData
      });
    } catch (error) {
      console.error('❌ Error updating scrape data:', error);
      if (error.message.includes('Missing required fields') || error.message === 'Scrape data not found') {
        res.status(400).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // PATCH /api/scrape/:id - Partial update scrape data by ID
  async patchScrapeData(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log('📡 API: PATCH /api/scrape/:id called with ID:', id);
      console.log('📡 Partial update data:', updateData);

      const updatedData = await scrapeService.patchScrapeData(id, updateData);
      console.log('✅ Data partially updated successfully:', updatedData._id);

      res.json({
        success: true,
        message: 'Scrape data partially updated successfully',
        data: updatedData
      });
    } catch (error) {
      console.error('❌ Error partially updating scrape data:', error);
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // DELETE /api/scrape/:id - Delete scrape data by ID
  async deleteScrapeData(req, res) {
    try {
      const { id } = req.params;

      console.log('📡 API: DELETE /api/scrape/:id called with ID:', id);

      const deletedData = await scrapeService.deleteScrapeData(id);
      console.log('✅ Data deleted successfully:', deletedData._id);

      res.json({
        success: true,
        message: 'Scrape data deleted successfully',
        data: deletedData
      });
    } catch (error) {
      console.error('❌ Error deleting scrape data:', error);
      if (error.message === 'Scrape data not found') {
        res.status(404).json({ success: false, error: error.message });
      } else {
        res.status(500).json({ success: false, error: error.message });
      }
    }
  },

  // GET /api/scrape/search - Search scrape data
  async searchScrapeData(req, res) {
    try {
      const { page = 1, limit = 10, ...searchCriteria } = req.query;

      console.log('📡 API: GET /api/scrape/search called with:', searchCriteria);

      const result = await scrapeService.searchScrapeData(searchCriteria, parseInt(page), parseInt(limit));

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('❌ Error searching scrape data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // GET /api/scrape/stats - Get scrape data statistics
  async getScrapeDataStats(req, res) {
    try {
      console.log('📡 API: GET /api/scrape/stats called');

      const stats = await scrapeService.getScrapeDataStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Error getting statistics:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  // PUT /api/scrape/bulk - Bulk update scrape data
  async bulkUpdateScrapeData(req, res) {
    try {
      const { updateCriteria, updateData } = req.body;

      console.log('📡 API: PUT /api/scrape/bulk called');
      console.log('📡 Update criteria:', updateCriteria);
      console.log('📡 Update data:', updateData);

      if (!updateCriteria || !updateData) {
        return res.status(400).json({
          success: false,
          error: 'updateCriteria and updateData are required'
        });
      }

      const result = await scrapeService.bulkUpdateScrapeData(updateCriteria, updateData);

      res.json({
        success: true,
        message: `Bulk updated ${result.modifiedCount} records`,
        data: result
      });
    } catch (error) {
      console.error('❌ Error bulk updating scrape data:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  },

  async getKlook(req, res) {
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
    } = req.body || {};

    const payload = {
      page_from,
      arrangement_id,
      sku_list
    };

    try {
      const response = await axios.post(URL, payload, { headers: HEADERS, timeout: 20000 });
      res.json({ success: true, data: response.data });
    } catch (error) {
      if (error.response) {
        console.error('Error response data:', error.response.data);
        return res.status(error.response.status || 500).json({
          success: false,
          error: error.response.data
        });
      }

      if (error.request) {
        console.error('Error request data:', error.request);
        return res.status(504).json({
          success: false,
          error: 'No response received from Klook'
        });
      }

      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    }
  },

  async getKkday(req, res) {
    const {
      prodMid = '25777',
      beginDate = '2025-11-13',
      endDate = '2026-02-09',
      previewToken = '',
      useBrowser = false // Option to use Playwright browser automation
    } = req.body || {};

    // If useBrowser is true, delegate to browser method
    if (useBrowser) {
      return this.getKkdayWithBrowser(req, res);
    }

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

    console.log("🔄 Fetching KKDay packages...");

    try {
      const response = await axios.get(URL, {
        headers: HEADERS,
        timeout: 15000,
        httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400; // Accept 2xx and 3xx
        }
      });

      // Check if response is CAPTCHA redirect
      if (response.data && typeof response.data === 'object' && response.data.url && response.data.url.includes('captcha-delivery.com')) {
        console.error("❌ CAPTCHA detected in response, trying browser method...");
        // Automatically retry with browser
        req.body.useBrowser = true;
        return this.getKkdayWithBrowser(req, res);
      }

      const payload = response.data;

      if (payload.status !== 200) {
        console.error("❌ Unexpected status in payload:", payload.status);
        return res.status(payload.status || 500).json({
          success: false,
          error: `Unexpected status: ${payload.status}`,
          data: payload
        });
      }

      const packageMap = payload?.data?.PACKAGE || {};
      if (!packageMap || Object.keys(packageMap).length === 0) {
        console.log("⚠️ No packages found in response.");
        return res.json({
          success: true,
          message: "No packages found in response",
          data: []
        });
      }

      const itemMap = payload?.data?.ITEM || {};
      const allSkuSummaries = [];

      for (const [pkgId, pkg] of Object.entries(packageMap)) {
        const itemIds = pkg.items || [];

        if (itemIds.length === 0) {
          allSkuSummaries.push({
            package_id: pkgId,
            name: pkg.name || "(no name)",
            items: [],
            message: "Package does not list any item IDs.",
          });
          continue;
        }

        for (const itemId of itemIds) {
          const item = itemMap[String(itemId)];

          if (!item) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "Item not found in ITEM map.",
            });
            continue;
          }

          const specsMeta = item.specs || [];
          const skus = item.skus || [];

          if (!skus.length) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "No SKUs found.",
            });
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

              const price = sku.single_price?.fullday || null;

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

      res.json({
        success: true,
        data: allSkuSummaries
      });
    } catch (error) {
      // Check for CAPTCHA in error response
      if (error.response) {
        const errorData = error.response.data;
        if (errorData && typeof errorData === 'object' && errorData.url && errorData.url.includes('captcha-delivery.com')) {
          console.error("❌ CAPTCHA detected in error response, trying browser method...");
          // Automatically retry with browser
          req.body.useBrowser = true;
          return this.getKkdayWithBrowser(req, res);
        }
        
        console.error('Error response data:', errorData);
        return res.status(error.response.status || 500).json({
          success: false,
          error: errorData
        });
      }

      if (error.request) {
        console.error('Error request data:', error.request);
        return res.status(504).json({
          success: false,
          error: 'No response received from KKDay'
        });
      }

      console.error('Error message:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    }
  },

  // Alternative method using Playwright to bypass CAPTCHA
  async getKkdayWithBrowser(req, res) {
    const {
      prodMid = '25777',
      beginDate = '2025-11-13',
      endDate = '2026-02-09',
      previewToken = ''
    } = req.body || {};

    const URL = `https://www.kkday.com/api/_nuxt/product/fetch-packages-data?prodMid=${prodMid}&previewToken=${previewToken}&beginDate=${beginDate}&endDate=${endDate}`;

    console.log("🔄 Fetching KKDay packages using browser automation...");

    let browser;
    try {
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
      });

      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'th-TH',
        timezoneId: 'Asia/Bangkok',
        viewport: { width: 1920, height: 1080 },
        extraHTTPHeaders: {
          'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
          'country_lang': 'th-th',
          'lang_ui': 'th',
          'UD1': 'Thai_TH',
          'UD4': 'Thai_TH',
          'currency': 'THB',
          'market': 'th',
        }
      });

      const page = await context.newPage();
      
      // Navigate to the product page first to establish session
      await page.goto(`https://www.kkday.com/th/product/${prodMid}`, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit to let any scripts load
      await page.waitForTimeout(2000);

      // Now make the API request
      const response = await page.request.get(URL, {
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Referer': `https://www.kkday.com/th/product/${prodMid}`,
          'Origin': 'https://www.kkday.com',
        }
      });

      const payload = await response.json();

      if (payload.status !== 200) {
        console.error("❌ Unexpected status in payload:", payload.status);
        return res.status(payload.status || 500).json({
          success: false,
          error: `Unexpected status: ${payload.status}`,
          data: payload
        });
      }

      const packageMap = payload?.data?.PACKAGE || {};
      if (!packageMap || Object.keys(packageMap).length === 0) {
        console.log("⚠️ No packages found in response.");
        return res.json({
          success: true,
          message: "No packages found in response",
          data: []
        });
      }

      const itemMap = payload?.data?.ITEM || {};
      const allSkuSummaries = [];

      for (const [pkgId, pkg] of Object.entries(packageMap)) {
        const itemIds = pkg.items || [];

        if (itemIds.length === 0) {
          allSkuSummaries.push({
            package_id: pkgId,
            name: pkg.name || "(no name)",
            items: [],
            message: "Package does not list any item IDs.",
          });
          continue;
        }

        for (const itemId of itemIds) {
          const item = itemMap[String(itemId)];

          if (!item) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "Item not found in ITEM map.",
            });
            continue;
          }

          const specsMeta = item.specs || [];
          const skus = item.skus || [];

          if (!skus.length) {
            allSkuSummaries.push({
              package_id: pkgId,
              name: pkg.name || "(no name)",
              item_id: itemId,
              message: "No SKUs found.",
            });
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

              const price = sku.single_price?.fullday || null;

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

      res.json({
        success: true,
        data: allSkuSummaries
      });
    } catch (error) {
      console.error('❌ Error fetching with browser:', error.message);
      res.status(500).json({
        success: false,
        error: error.message || 'Request failed'
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }


};
