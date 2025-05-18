// services/login.js
const puppeteer = require('puppeteer');
const fs = require('fs');
require('dotenv').config();

async function login() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized'],
  });

  const page = await browser.newPage();

  // Try to reuse cookies
  const cookiesPath = 'cookies.json';
  if (fs.existsSync(cookiesPath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiesPath));
    await page.setCookie(...cookies);
    await page.goto('https://www.instagram.com/', { waitUntil: 'networkidle2' });

    // Test if session is still valid
    const loggedOut = await page.evaluate(() => {
      return document.querySelector('input[name="username"]') !== null;
    });

    if (!loggedOut) {
      console.log('🔐 Logged in with saved session.');
      return { browser, page };
    }

    console.log('⚠️ Saved cookies expired. Logging in manually...');
  }

  // Manual login fallback
  await page.goto('https://www.instagram.com/accounts/login/', { waitUntil: 'networkidle2' });

  // Wait for login form
  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', process.env.IG_USERNAME, { delay: 100 });
  await page.type('input[name="password"]', process.env.IG_PASSWORD, { delay: 100 });

  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle2' }),
  ]);

  // Check for login failure
  const loginFailed = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('p')).some(p =>
      p.innerText.includes("Sorry, your password was incorrect")
    );
  });

  if (loginFailed) {
    console.log('❌ Login failed. Check your credentials.');
    await browser.close();
    return null;
  }

  console.log('✅ Logged in successfully.');

  const cookies = await page.cookies();
  fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
  console.log('🍪 Session saved to cookies.json');

  return { browser, page };
}

module.exports = { login };
