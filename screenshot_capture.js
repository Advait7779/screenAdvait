const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox'],
    executablePath: 'C:\\Users\\advai\\.cache\\puppeteer\\chrome\\win64-131.0.6778.204\\chrome-win64\\chrome.exe'
  });
  
  const page1 = await browser.newPage();
  await page1.setViewport({ width: 1280, height: 800 });
  await page1.goto('http://localhost:5173', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page1.screenshot({ path: 'a:/Projects/ScreenAdvait/public-site/public/ss-admin.png', fullPage: false });
  console.log('Screenshot 1 saved: ss-admin.png');

  const page2 = await browser.newPage();
  await page2.setViewport({ width: 1280, height: 800 });
  await page2.goto('http://localhost:5174', { waitUntil: 'networkidle2', timeout: 15000 });
  await new Promise(r => setTimeout(r, 3000));
  await page2.screenshot({ path: 'a:/Projects/ScreenAdvait/public-site/public/ss-customer.png', fullPage: false });
  console.log('Screenshot 2 saved: ss-customer.png');

  await browser.close();
  console.log('Done!');
})();
