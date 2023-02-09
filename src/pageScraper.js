const SLEEP_TIME = 5000
const scraperObject = {
    async indeedScraper(browser, query, location, remote) {
        let scrapedData = []

        const remoteAttr = remote ? '&sc=0kf%3Aattr(DSQF7)%3B' : ''
        const jobQuery = `https://fr.indeed.com/emplois?q=${query}&l=${location}${remoteAttr}&fromage=7`

        let page = await browser.newPage()
        let pageCounter = 1
        console.info(`⛵ Navigating to "${jobQuery}"...`)
        await page.goto(jobQuery, { waitUntil: 'networkidle2' })

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
                        job['description'] = await newPage.$eval('#jobDescriptionText', text => text.textContent.replace(/\n/g, ''))
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
            return scrapedData
        }
        let data = await scrapeCurrentPage()
        return data
    },

    async linkedinScraper(browser, query, location, remote) {
        let scrapedData = []

        const remoteAttr = remote ? '&f_WT=2' : ''
        let jobQuery = `https://fr.linkedin.com/jobs/search?keywords=${query}&location=${location}&locationId=&f_TPR=r604800&distance=25${remoteAttr}&position=1&pageNum=0`

        let page = await browser.newPage()
        console.info(`⛵ Navigating to "${jobQuery}"...`)
        await page.goto(jobQuery, { waitUntil: 'networkidle2' })

        const jobCount = await page.$eval('.results-context-header__job-count', text => text.textContent)
        const scrollIterations = Math.ceil(parseInt(jobCount.replace(/\s+/g, '')) / 25)

        async function scrollToBottom() {
            await page.evaluate(() => new Promise((resolve) => {
                var scrollTop = -1
                const interval = setInterval(async () => {
                    window.scrollBy(0, 100)
                    if (document.documentElement.scrollTop !== scrollTop) {
                        scrollTop = document.documentElement.scrollTop
                        return
                    }
                    clearInterval(interval)
                    resolve()
                }, 70)
            }))
        }

        async function shakePage() {
            await new Promise(resolve => setTimeout(resolve, 2000))
            await page.evaluate(() => window.scrollBy(0, -400))
            await new Promise(resolve => setTimeout(resolve, 2000))
            await page.evaluate(() => window.scrollBy(0, 400))
            await new Promise(resolve => setTimeout(resolve, 2000))
        }

        for (let i = 1; i <= scrollIterations; i++) {
            console.log(`⌛ Scrolling ${i} / ${scrollIterations}..`)
            await scrollToBottom()
            if (i <= scrollIterations) {
                try { await page.click('.infinite-scroller__show-more-button') } catch { }
                await shakePage()
            }
        }

        const urls = await page.$$eval('a.base-card__full-link', links => {
            return links.map(link => link.href)
        })

        let pagePromise = (link) => new Promise(async (resolve, reject) => {
            let job = {}
            let newPage = await browser.newPage()
            await newPage.goto(link, { waitUntil: 'networkidle2' })

            job['url'] = link
            try {
                job['title'] = await newPage.$eval('.top-card-layout__title', text => text.textContent)
                job['company'] = await newPage.$eval('.topcard__org-name-link', text => text.textContent.replace(/\n/g, '').trim())
                job['location'] = await newPage.$eval('.top-card-layout__second-subline>div>span:nth-of-type(2)', text => text.textContent.replace(/\n/g, '').trim())
                job['description'] = await newPage.$eval('.show-more-less-html__markup', text => text.textContent.replace(/\n/g, ''))
            } catch { }
            resolve(job)
            await newPage.close()
        })

        console.info(`⌛ Scraping ${urls.length} job offers..`)
        for (let index in urls) {
            let currentPageData = await pagePromise(urls[index])
            console.info(`⌛ ${parseInt(index) + 1} / ${urls.length} scraped..`)
            scrapedData.push(currentPageData)
        }

        await page.close()
        return scrapedData
    }
}

module.exports = scraperObject