// index.js
const puppeteer = require('puppeteer');
const { deleteMyComments } = require('./services/deleteMyComments');

async function main() {
  let browser;
  try {
    // Launch the browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    // Create a new page and set up viewport
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Navigate to Instagram and wait for login
    console.log('📱 Navigating to Instagram...');
    await page.goto('https://www.instagram.com', {
      waitUntil: 'networkidle2'
    });

    // Wait for manual login
    console.log('👋 Please log in to Instagram manually...');
    console.log('⏳ Waiting 30 seconds for login...');
    await new Promise(resolve => setTimeout(resolve, 20000));

    // Now run the comment deletion with the same page
    await deleteMyComments(page, 2000); // Delete 10 comments

  } catch (error) {
    console.error('❌ An error occurred:', error);
  } finally {
    // Always close the browser
    if (browser) {
      console.log('👋 Closing browser...');
      await browser.close();
    }
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}
