import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

async function runE2ETests() {
  console.log('🚀 Starting Automated Multiplayer QA E2E Test Suite...');

  // Start dev server if not already running
  let devServer = null;
  try {
    const response = await fetch(URL);
    console.log('✅ Local server is already running on port 3000');
  } catch (e) {
    console.log('⚡ Launching local dev server on port 3000...');
    devServer = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), shell: true, stdio: 'pipe' });
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const logs = { host: [], guest: [] };
  const errors = { host: [], guest: [] };

  try {
    // 1. Create two isolated browser contexts
    const contextHost = await browser.createBrowserContext();
    const contextGuest = await browser.createBrowserContext();

    const pageHost = await contextHost.newPage();
    const pageGuest = await contextGuest.newPage();

    // Configure viewport
    await pageHost.setViewport({ width: 1280, height: 720 });
    await pageGuest.setViewport({ width: 1280, height: 720 });

    // Attach error listeners
    pageHost.on('console', msg => {
      if (msg.type() === 'error') errors.host.push(msg.text());
      else logs.host.push(msg.text());
    });
    pageHost.on('pageerror', err => errors.host.push(err.toString()));

    pageGuest.on('console', msg => {
      if (msg.type() === 'error') errors.guest.push(msg.text());
      else logs.guest.push(msg.text());
    });
    pageGuest.on('pageerror', err => errors.guest.push(err.toString()));

    console.log('🌐 Opening Host & Guest browser pages...');
    await pageHost.goto(URL, { waitUntil: 'networkidle2' });
    await pageGuest.goto(URL, { waitUntil: 'networkidle2' });

    console.log('👤 Logging in Host user...');
    await pageHost.evaluate(() => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: 'qa_host_uid_' + Date.now(),
        username: 'QA_Host_' + Math.floor(Math.random() * 1000),
        email: 'host@test.com',
        coins: 10000
      }));
    });
    await pageHost.reload({ waitUntil: 'networkidle2' });

    console.log('👤 Logging in Guest user...');
    await pageGuest.evaluate(() => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: 'qa_guest_uid_' + Date.now(),
        username: 'QA_Guest_' + Math.floor(Math.random() * 1000),
        email: 'guest@test.com',
        coins: 10000
      }));
    });
    await pageGuest.reload({ waitUntil: 'networkidle2' });

    console.log('✨ Checking for runtime frontend errors...');
    if (errors.host.length > 0) {
      console.error('❌ Host Console Errors detected:', errors.host);
    }
    if (errors.guest.length > 0) {
      console.error('❌ Guest Console Errors detected:', errors.guest);
    }

    if (errors.host.length === 0 && errors.guest.length === 0) {
      console.log('🎉 Clean test execution! Zero console/runtime errors recorded on both Host and Guest contexts.');
    }

  } catch (err) {
    console.error('💥 Test suite exception:', err);
  } finally {
    await browser.close();
    if (devServer) {
      devServer.kill();
    }
  }
}

runE2ETests();
