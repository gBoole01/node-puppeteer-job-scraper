import pageScraper from './pageScraper.js';
import { writeFile } from 'fs';
async function scrapeAll(browserInstance) {
    try {
        const browser = await browserInstance;
        let scrapedData = {
            linkedin: {},
            indeed: {}
        }
        // scrapedData.linkedin['bordeaux'] = await pageScraper.linkedinScraper(browser, 'developpeur+web', 'Bordeaux%2C%20Nouvelle-Aquitaine%2C%20France', false);
        scrapedData.indeed['bordeaux'] = await pageScraper.indeedScraper(browser, 'developpeur+web', 'Bordeaux+%2833%29', false);
        // scrapedData.linkedin['remote'] = await pageScraper.linkedinScraper(browser, 'developpeur+web', 'France', true);
        // scrapedData.indeed['remote'] = await pageScraper.indeedScraper(browser, 'developpeur+web', 'France', true);
        await browser.close()

        const fileName = `data-${(new Date()).toISOString().replace(/:/g, '-').slice(0, -5)}Z`
        writeFile(`output/${fileName}.json`, JSON.stringify(scrapedData), 'utf8', function (err) {
            if (err) {
                return process.stderr.write(`❌ ${err}  \n`);
            }
            process.stdout.write(`\n✅ The data has been scraped and saved successfully! View it at './output/${fileName}.json'`);
        });
    }
    catch (err) {
        process.stderr.write(`❌ Could not resolve the browser instance => ${err}\n`);
    }
}

export default (browserInstance) => scrapeAll(browserInstance)