const SLEEP_TIME = 5000
const scraperObject = {
    async scraper(browser, query, location, remote) {
        let scrapedData = []

        const remoteAttr = remote ? '&sc=0kf%3Aattr(DSQF7)%3B' : ''
        const jobQuery = `https://fr.indeed.com/emplois?q=${query}&l=${location}${remoteAttr}`

        let page = await browser.newPage()
        let pageCounter = 1
        console.info(`⛵ Navigating to ${jobQuery}...`)
        await page.goto(jobQuery)

        async function scrapeCurrentPage() {
            await page.waitForSelector('#jobsearch-JapanPage')
            const urls = await page.$$eval('a.jcs-JobTitle', links => {
                return links.map(link => link.href)
            })

            let pagePromise = (link) => new Promise(async (resolve, reject) => {
                let job = {}
                let newPage = await browser.newPage()
                await newPage.goto(link, { waitUntil: 'networkidle2' })

                if (/^https:\/\/fr\.indeed\.com/.test(newPage.url())) {
                    try {
                        await newPage.$eval('#challenge-running', text => text.textContent)
                        console.info(`🤖 Bot detection triggered, entering sleep mode for ${SLEEP_TIME / 1000}s..`)
                        await new Promise(resolve => setTimeout(resolve, SLEEP_TIME))
                        console.info('⏰ Leaving sleep mode..')

                        await newPage.close()
                        newPage = await browser.newPage()
                        await newPage.goto(link, { waitUntil: 'networkidle2' })
                    } catch { }

                    try {
                        await newPage.waitForSelector('.jobsearch-JobInfoHeader-title-container')
                        job['url'] = link
                        job['title'] = await newPage.$eval('.jobsearch-JobInfoHeader-title', text => text.textContent)
                        job['description'] = await newPage.$eval('#jobDescriptionText', text => text.textContent)
                        try {
                            job['company'] = await newPage.$eval('div[data-company-name="true"]>a', text => text.textContent)
                        } catch {
                            job['company'] = await newPage.$eval('div[data-company-name="true"]', text => text.textContent)
                        }

                        job['location'] = await newPage.$eval('.jobsearch-JobInfoHeader-subtitle>div:nth-of-type(2)>div', text => text.textContent)

                        try {
                            job['remote'] = await newPage.$eval('.jobsearch-JobInfoHeader-subtitle>div:nth-of-type(3)>div', text => text.textContent === "Télétravail" ? true : false)
                        } catch {
                            job['remote'] = false
                        }

                        try {
                            job['salary'] = await newPage.$eval('#salaryInfoAndJobType>span:nth-of-type(1)', text => text.textContent)
                        } catch {
                            job['salary'] = 'N/A'
                        }

                        try {
                            job['type'] = await newPage.$eval('#salaryInfoAndJobType>span:nth-of-type(2)', text => text.textContent.substring(4))
                        } catch {
                            job['type'] = 'N/A'
                        }
                    } catch (e) {
                        console.warn('⚠️ Scraping Failed => ', e)
                    }
                }
                resolve(job)
                await newPage.close()
            })

            console.info(`⌛ Scraping ${urls.length} job offers..(Page ${pageCounter})`)
            for (let index in urls) {
                let currentPageData = await pagePromise(urls[index])
                console.info(`⌛ ${parseInt(index) + 1} / ${urls.length} scraped..`)
                scrapedData.push(currentPageData)
            }

            let nextPageExist = false
            let nextPageSelector = '[data-testid="pagination-page-next"]'
            try {
                await page.$eval(nextPageSelector, link => link.href)
                nextPageExist = true
            } catch {
                nextPageExist = false
            }

            if (nextPageExist) {
                try {
                    await page.$eval('.icl-Modal-close', text => text.textContent)
                    await page.click('.icl-Modal-close')
                } catch { }
                await page.click(nextPageSelector)
                pageCounter += 1

                return scrapeCurrentPage()
            }

            await page.close()
            return scrapedData;
        }
        let data = await scrapeCurrentPage()
        return data;
    }
}

module.exports = scraperObject;