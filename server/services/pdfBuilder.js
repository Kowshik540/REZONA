'use strict';
const puppeteer = require('puppeteer');
const { generateHtml } = require('./htmlTemplates');

// Reuse browser instance for performance
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    timeout: 60000,
  });
  _browser.on('disconnected', () => { _browser = null; });
  return _browser;
}

async function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  const html = generateHtml(data, fmt);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    });
    return pdf;
  } finally {
    await page.close();
  }
}

// Graceful shutdown
async function closeBrowser() {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}

process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

module.exports = { buildResumePdf, closeBrowser };
