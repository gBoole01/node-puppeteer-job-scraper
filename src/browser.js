import { launch } from 'puppeteer'

export default async function startBrowser() {
    let browser
    try {
        process.stdout.write("🚀 Opening the browser...... \n")
        browser = await launch({
            headless: false,
            args: ["--disable-setuid-sandbox"],
            'ignoreHTTPSErrors': true
        })
    } catch (err) {
        process.stderr.write(`❌ Could not create a browser instance => : ${err} \n`)
    }
    return browser
}

