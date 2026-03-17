import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('img[alt]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/jules/verification/home.png', fullPage: true });
    console.log("Screenshot saved to /home/jules/verification/home.png");

    await page.goto('http://localhost:3000/rooms');
    await page.waitForSelector('img[alt]', { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/home/jules/verification/rooms.png', fullPage: true });
    console.log("Screenshot saved to /home/jules/verification/rooms.png");

  } catch (e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
