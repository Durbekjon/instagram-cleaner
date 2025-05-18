const puppeteer = require('puppeteer');

async function demonstratePuppeteer() {
  try {
    // Launch the browser
    console.log('🚀 Launching browser...');
    const browser = await puppeteer.launch({
      headless: false, // Set to true for production
      defaultViewport: null,
      args: ['--start-maximized']
    });

    // Create a new page
    const page = await browser.newPage();
    
    // Navigate to Instagram
    console.log('🧭 Navigating to Instagram...');
    await page.goto('https://www.instagram.com', {
      waitUntil: 'networkidle2' // Wait until network is idle
    });

    // Wait for a few seconds to ensure page is fully loaded
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Example: Find an element using XPath (in this case, looking for the login link)
    console.log('🔍 Looking for elements...');
    const elements = await page.$x("//span[contains(text(), 'Log in')]");
    
    if (elements.length > 0) {
      console.log('✅ Found the element!');
      // Click the element
      await elements[0].click();
      console.log('👆 Clicked the element');
    } else {
      console.log('❌ Element not found');
    }

    // Wait a bit to see the result
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Close the browser
    console.log('👋 Closing browser...');
    await browser.close();
    
  } catch (error) {
    console.error('❌ An error occurred:', error);
    // Make sure to close the browser even if an error occurs
    if (browser) {
      await browser.close();
    }
  }
}

// Export the function
module.exports = { demonstratePuppeteer };

// If running this file directly
if (require.main === module) {
  demonstratePuppeteer();
} 