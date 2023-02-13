import startBrowser from './browser.js'
import scraperController from './pageController.js'

let browserInstance = startBrowser();

scraperController(browserInstance)