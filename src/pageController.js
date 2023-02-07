const pageScraper = require('./pageScraper');
const fs = require('fs');
async function scrapeAll(browserInstance) {
    try {
        const browser = await browserInstance;
        let scrapedData = {}
        scrapedData['bordeaux'] = await pageScraper.scraper(browser, 'developpeur+web', 'Bordeaux+%2833%29', false);
        scrapedData['remote'] = await pageScraper.scraper(browser, 'developpeur+web', 'France', true);
        await browser.close()

        const fileName = `data-${(new Date()).toISOString().replace(/:/g, '-').slice(0, -5)}Z`
        fs.writeFile(`output/${fileName}.json`, JSON.stringify(scrapedData), 'utf8', function (err) {
            if (err) {
                return console.log(err);
            }
            console.log(`The data has been scraped and saved successfully! View it at './output/${fileName}.json'`);
        });
    }
    catch (err) {
        console.log("Could not resolve the browser instance => ", err);
    }
}

module.exports = (browserInstance) => scrapeAll(browserInstance)