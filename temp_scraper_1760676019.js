
import { scrapeService } from './services/scrapeService.js';

async function runScrape() {
    try {
        let result;
        switch('scrapeFullJson') {
            case 'scrapeWithOCR':
                result = await scrapeService.scrapeWithOCR('https://www.kkday.com/api/_nuxt/product/fetch-items-data?pkgOid=1277992&itemOidList=1023769');
                break;
            case 'scrapeFullJson':
                result = await scrapeService.scrapeFullJson('https://www.kkday.com/api/_nuxt/product/fetch-items-data?pkgOid=1277992&itemOidList=1023769');
                break;
            case 'scrapePriceWithOCR':
                result = await scrapeService.scrapePriceWithOCR('https://www.kkday.com/api/_nuxt/product/fetch-items-data?pkgOid=1277992&itemOidList=1023769');
                break;
            default:
                throw new Error('Unknown method: scrapeFullJson');
        }
        console.log(JSON.stringify({success: true, data: result}));
    } catch (error) {
        console.log(JSON.stringify({success: false, error: error.message}));
    }
}

runScrape();
