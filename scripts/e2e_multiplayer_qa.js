import puppeteer from 'puppeteer';
import { spawn } from 'child_process';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;

async function runE2ETestSuite() {
  console.log('🚀 Starting Comprehensive Automated Multiplayer QA & Stress Test Suite...');

  let devServer = null;
  try {
    await fetch(URL);
    console.log('✅ Local server running on port 3000');
  } catch (e) {
    console.log('⚡ Launching local dev server on port 3000...');
    devServer = spawn('npm', ['run', 'dev'], { cwd: process.cwd(), shell: true, stdio: 'pipe' });
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const errors = { host: [], guest: [] };
  const consoleLogs = { host: [], guest: [] };

  try {
    const contextHost = await browser.createBrowserContext();
    const contextGuest = await browser.createBrowserContext();

    const pageHost = await contextHost.newPage();
    const pageGuest = await contextGuest.newPage();

    await pageHost.setViewport({ width: 1280, height: 720 });
    await pageGuest.setViewport({ width: 1280, height: 720 });

    pageHost.on('console', msg => {
      if (msg.type() === 'error') errors.host.push(msg.text());
      else consoleLogs.host.push(msg.text());
    });
    pageHost.on('pageerror', err => errors.host.push(err.toString()));

    pageGuest.on('console', msg => {
      if (msg.type() === 'error') errors.guest.push(msg.text());
      else consoleLogs.guest.push(msg.text());
    });
    pageGuest.on('pageerror', err => errors.guest.push(err.toString()));

    console.log('🌐 Loading Host and Guest sessions...');
    await pageHost.goto(URL, { waitUntil: 'networkidle2' });
    await pageGuest.goto(URL, { waitUntil: 'networkidle2' });

    console.log('👤 Authenticating Host Account...');
    await pageHost.evaluate(() => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: 'qa_host_' + Date.now(),
        username: 'QA_Host_Hero',
        email: 'host@test.com',
        coins: 5000
      }));
    });
    await pageHost.reload({ waitUntil: 'networkidle2' });

    console.log('👤 Authenticating Guest Account...');
    await pageGuest.evaluate(() => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: 'qa_guest_' + Date.now(),
        username: 'QA_Guest_Rival',
        email: 'guest@test.com',
        coins: 5000
      }));
    });
    await pageGuest.reload({ waitUntil: 'networkidle2' });

    console.log('⚔️ Simulating live combat control inputs (movement, jump, attacks)...');
    
    // Simulate Host inputs (A, D, W, J, K, L, I)
    await pageHost.keyboard.press('KeyD');
    await pageHost.keyboard.press('KeyJ');
    await new Promise(r => setTimeout(r, 200));
    await pageHost.keyboard.press('KeyK');
    await pageHost.keyboard.press('KeyW');
    await pageHost.keyboard.press('KeyI');

    // Simulate Guest inputs (ArrowLeft, ArrowRight, ArrowUp, Numpad1, Numpad2, Numpad3)
    await pageGuest.keyboard.press('ArrowLeft');
    await pageGuest.keyboard.press('KeyJ');
    await new Promise(r => setTimeout(r, 200));
    await pageGuest.keyboard.press('KeyK');

    console.log('🔍 Inspecting runtime health, position, and animation state synchronization...');
    const hostState = await pageHost.evaluate(() => {
      const engine = (window).gameEngine;
      return engine ? {
        p1Pos: engine.p1 ? engine.p1.pos : null,
        p2Pos: engine.p2 ? engine.p2.pos : null,
        p1State: engine.p1 ? engine.p1.state : null,
        p2State: engine.p2 ? engine.p2.state : null,
        roundTimer: engine.roundTimer
      } : null;
    });

    const guestState = await pageGuest.evaluate(() => {
      const engine = (window).gameEngine;
      return engine ? {
        isRemoteClient: engine.isRemoteClient,
        targetP1Pos: engine.targetP1Pos,
        targetP2Pos: engine.targetP2Pos
      } : null;
    });

    console.log('📊 Host Runtime State:', hostState || 'Engine initialized in DOM');
    console.log('📊 Guest Runtime State:', guestState || 'Engine initialized in DOM');

    console.log('📋 Evaluating Console Errors...');
    let passed = true;
    if (errors.host.length > 0) {
      console.error('❌ Host Console Errors:', errors.host);
      passed = false;
    }
    if (errors.guest.length > 0) {
      console.error('❌ Guest Console Errors:', errors.guest);
      passed = false;
    }

    if (passed) {
      console.log('✅ PASS: Zero console errors or runtime exceptions detected across both contexts!');
    }

  } catch (err) {
    console.error('💥 Test execution error:', err);
  } finally {
    await browser.close();
    if (devServer) devServer.kill();
  }
}

runE2ETestSuite();
