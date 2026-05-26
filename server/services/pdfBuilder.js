'use strict';
const puppeteer = require('puppeteer-core');
const { generateHtml } = require('./htmlTemplates');

// Reuse browser instance for performance
let _browser = null;

async function getBrowser() {
  if (_browser && _browser.connected) return _browser;

  let executablePath;
  let args = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'];
  let headless = 'new';

  // Try @sparticuz/chromium first (works on Render/Lambda/serverless — Linux only)
  if (process.platform === 'linux') {
    try {
      const chromium = require('@sparticuz/chromium');
      executablePath = await chromium.executablePath();
      args = chromium.args;
      headless = chromium.headless;
    } catch (e) {
      executablePath = findSystemChrome();
    }
  } else {
    // Windows/Mac: use system Chrome
    executablePath = findSystemChrome();
  }

  if (!executablePath) {
    throw new Error('No Chrome/Chromium found. Install @sparticuz/chromium or set CHROME_PATH env var.');
  }

  _browser = await puppeteer.launch({
    args,
    defaultViewport: { width: 794, height: 1123 }, // A4 at 96dpi
    executablePath,
    headless,
  });

  _browser.on('disconnected', () => { _browser = null; });
  return _browser;
}

// Find Chrome on the system (for local development)
function findSystemChrome() {
  const fs = require('fs');
  const paths = [
    process.env.CHROME_PATH,
    // Windows
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
    // Linux
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    // Mac
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function buildResumePdf(data, fmt) {
  fmt = Math.max(1, Math.min(34, parseInt(fmt) || 1));
  const html = generateHtml(data, fmt);

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 30000 });
    const pdfData = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' }
    });
    // Puppeteer returns Uint8Array — convert to Node Buffer for Express res.send()
    return Buffer.from(pdfData);
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
