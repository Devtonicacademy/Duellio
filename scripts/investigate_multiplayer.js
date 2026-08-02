import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const URL = `http://localhost:${PORT}`;
const LOG_FILE = path.join(process.cwd(), 'multiplayer_investigation_results.json');

function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(URL, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.end();
  });
}

async function runInvestigation() {
  console.log('🔍 Starting Comprehensive Real-Time Multiplayer QA Investigation...');

  let devServer = null;
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('⚡ Starting local dev server on port 3000...');
    devServer = spawn('npx', ['vite', '--port=3000', '--host=0.0.0.0'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'pipe'
    });
    let tries = 0;
    while (tries < 30) {
      await new Promise(r => setTimeout(r, 1000));
      if (await checkServer()) {
        console.log('✅ Dev server is up!');
        break;
      }
      tries++;
    }
  } else {
    console.log('✅ Dev server is already running.');
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const timeline = [];
  const consoleLogs = { host: [], guest: [] };
  const failedResources = { host: [], guest: [] };
  const networkLogs = { host: [], guest: [] };

  function logEvent(actor, category, event, details = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      timeMs: Date.now(),
      actor,
      category,
      event,
      details
    };
    timeline.push(entry);
    console.log(`[${entry.timestamp.split('T')[1].slice(0, 8)}] [${actor.toUpperCase()}] [${category}] ${event}`);
  }

  try {
    const contextHost = await browser.createBrowserContext();
    const contextGuest = await browser.createBrowserContext();

    const pageHost = await contextHost.newPage();
    const pageGuest = await contextGuest.newPage();

    await pageHost.setViewport({ width: 1280, height: 720 });
    await pageGuest.setViewport({ width: 1280, height: 720 });

    // Console & pageerror listeners
    pageHost.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.host.push({ type, text, location: msg.location() });
      if (type === 'error' || type === 'warning') {
        logEvent('Host', 'Console', `${type.toUpperCase()}: ${text}`);
      }
    });
    pageHost.on('pageerror', err => {
      consoleLogs.host.push({ type: 'pageerror', text: err.toString(), stack: err.stack });
      logEvent('Host', 'PageError', err.toString());
    });
    pageHost.on('requestfailed', req => {
      failedResources.host.push({ url: req.url(), error: req.failure()?.errorText });
      logEvent('Host', 'FailedResource', `404/Failed: ${req.url()}`);
    });

    pageGuest.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.guest.push({ type, text, location: msg.location() });
      if (type === 'error' || type === 'warning') {
        logEvent('Guest', 'Console', `${type.toUpperCase()}: ${text}`);
      }
    });
    pageGuest.on('pageerror', err => {
      consoleLogs.guest.push({ type: 'pageerror', text: err.toString(), stack: err.stack });
      logEvent('Guest', 'PageError', err.toString());
    });
    pageGuest.on('requestfailed', req => {
      failedResources.guest.push({ url: req.url(), error: req.failure()?.errorText });
      logEvent('Guest', 'FailedResource', `404/Failed: ${req.url()}`);
    });

    // Network tracking
    pageHost.on('request', req => {
      if (req.url().includes('firestore.googleapis.com')) {
        networkLogs.host.push({ method: req.method(), url: req.url(), time: Date.now() });
      }
    });
    pageGuest.on('request', req => {
      if (req.url().includes('firestore.googleapis.com')) {
        networkLogs.guest.push({ method: req.method(), url: req.url(), time: Date.now() });
      }
    });

    // 1. Open Host Page
    logEvent('Host', 'Navigation', 'Navigating to Duellio home page');
    await pageHost.goto(URL, { waitUntil: 'networkidle2' });

    const hostUid = 'qa_host_' + Date.now();
    const hostName = 'Master_Host';
    logEvent('Host', 'Auth', 'Logging in Host user', { uid: hostUid, username: hostName });
    await pageHost.evaluate((uid, name) => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: uid,
        username: name,
        email: 'host@duellio.test',
        coins: 10000,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
        status: 'online'
      }));
    }, hostUid, hostName);
    await pageHost.reload({ waitUntil: 'networkidle2' });

    // 2. Open Guest Page
    logEvent('Guest', 'Navigation', 'Navigating to Duellio home page');
    await pageGuest.goto(URL, { waitUntil: 'networkidle2' });

    const guestUid = 'qa_guest_' + Date.now();
    const guestName = 'Challenger_Guest';
    logEvent('Guest', 'Auth', 'Logging in Guest user', { uid: guestUid, username: guestName });
    await pageGuest.evaluate((uid, name) => {
      localStorage.setItem('duellio_user', JSON.stringify({
        uid: uid,
        username: name,
        email: 'guest@duellio.test',
        coins: 10000,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        status: 'online'
      }));
    }, guestUid, guestName);
    await pageGuest.reload({ waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 1000));

    // 3. Host clicks Lobbies / Sandbox tab
    logEvent('Host', 'UI', 'Navigating to Lobbies / Sandbox tab');
    await pageHost.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sandboxBtn = btns.find(b => b.textContent?.includes('Lobbies') || b.textContent?.includes('Sandbox'));
      if (sandboxBtn) sandboxBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // Host clicks Create Challenge button
    logEvent('Host', 'Matchmaking', 'Host opening Create Challenge modal');
    await pageHost.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const createBtn = btns.find(b => b.textContent?.includes('Create') || b.textContent?.includes('Host') || b.textContent?.includes('Challenge'));
      if (createBtn) createBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // Select Stickman game in challenge modal if selector present
    logEvent('Host', 'Matchmaking', 'Host selecting Stickman and creating lobby');
    await pageHost.evaluate(() => {
      const select = document.querySelector('select');
      if (select) {
        select.value = 'Stickman';
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      const btns = Array.from(document.querySelectorAll('button'));
      const broadcastBtn = btns.find(b => b.textContent?.includes('Broadcast') || b.textContent?.includes('Host') || b.textContent?.includes('Create') || b.textContent?.includes('Challenge'));
      if (broadcastBtn) broadcastBtn.click();
    });

    await new Promise(r => setTimeout(r, 2000));

    // 4. Guest opens Lobbies tab and joins open lobby
    logEvent('Guest', 'UI', 'Guest navigating to Lobbies / Sandbox tab');
    await pageGuest.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const sandboxBtn = btns.find(b => b.textContent?.includes('Lobbies') || b.textContent?.includes('Sandbox'));
      if (sandboxBtn) sandboxBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // Guest clicks Active Sessions / Open Lobbies tab
    logEvent('Guest', 'Matchmaking', 'Guest clicking Active Sessions / Open Lobbies');
    await pageGuest.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const activeSessionsBtn = btns.find(b => b.textContent?.includes('Active') || b.textContent?.includes('Lobbies'));
      if (activeSessionsBtn) activeSessionsBtn.click();
    });

    await new Promise(r => setTimeout(r, 1500));

    // Guest clicks Join & Play
    logEvent('Guest', 'Matchmaking', 'Guest clicking Join & Play on open lobby');
    await pageGuest.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const joinBtn = btns.find(b => b.textContent?.includes('Join & Play') || b.textContent?.includes('Join') || b.textContent?.includes('Play'));
      if (joinBtn) joinBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    // Verify engine & canvas state
    const getEngineData = (p) => p.evaluate(() => {
      return {
        hasCanvas: !!document.querySelector('canvas'),
        hasEngine: !!window.gameEngine,
        engineState: window.gameEngine ? {
          gameState: window.gameEngine.gameState,
          mode: window.gameEngine.mode,
          isRemoteClient: window.gameEngine.isRemoteClient,
          p1: window.gameEngine.p1 ? { x: Math.round(window.gameEngine.p1.pos.x), y: Math.round(window.gameEngine.p1.pos.y), health: window.gameEngine.p1.health, chi: window.gameEngine.p1.chi, state: window.gameEngine.p1.state } : null,
          p2: window.gameEngine.p2 ? { x: Math.round(window.gameEngine.p2.pos.x), y: Math.round(window.gameEngine.p2.pos.y), health: window.gameEngine.p2.health, chi: window.gameEngine.p2.chi, state: window.gameEngine.p2.state } : null
        } : null
      };
    });

    const hostStatus = await getEngineData(pageHost);
    const guestStatus = await getEngineData(pageGuest);

    logEvent('System', 'GameInit', 'Game Engine Status Check', { hostStatus, guestStatus });

    // Run 5 match iterations for 5x consistent reproduction verification
    const roundResults = [];
    for (let round = 1; round <= 5; round++) {
      logEvent('System', 'Gameplay', `>>> STARTING MULTIPLAYER MATCH ROUND ${round}/5 <<<`);

      const getSnapshot = async (label) => {
        const h = await pageHost.evaluate(() => {
          const e = window.gameEngine;
          if (!e) return null;
          return {
            gameState: e.gameState,
            roundTimer: e.roundTimer,
            p1: e.p1 ? { x: Math.round(e.p1.pos.x), y: Math.round(e.p1.pos.y), health: e.p1.health, chi: e.p1.chi, state: e.p1.state, facingRight: e.p1.facingRight } : null,
            p2: e.p2 ? { x: Math.round(e.p2.pos.x), y: Math.round(e.p2.pos.y), health: e.p2.health, chi: e.p2.chi, state: e.p2.state, facingRight: e.p2.facingRight } : null,
            remoteP2Inputs: e.input?.remoteP2Inputs || null
          };
        });

        const g = await pageGuest.evaluate(() => {
          const e = window.gameEngine;
          if (!e) return null;
          return {
            gameState: e.gameState,
            roundTimer: e.roundTimer,
            p1: e.p1 ? { x: Math.round(e.p1.pos.x), y: Math.round(e.p1.pos.y), health: e.p1.health, chi: e.p1.chi, state: e.p1.state, facingRight: e.p1.facingRight } : null,
            p2: e.p2 ? { x: Math.round(e.p2.pos.x), y: Math.round(e.p2.pos.y), health: e.p2.health, chi: e.p2.chi, state: e.p2.state, facingRight: e.p2.facingRight } : null,
            targetP1Pos: e.targetP1Pos || null,
            targetP2Pos: e.targetP2Pos || null
          };
        });

        const desync = {
          p1PosDiff: (h?.p1 && g?.p1) ? Math.hypot(h.p1.x - g.p1.x, h.p1.y - g.p1.y) : 0,
          p2PosDiff: (h?.p2 && g?.p2) ? Math.hypot(h.p2.x - g.p2.x, h.p2.y - g.p2.y) : 0,
          p1HealthDiff: (h?.p1 && g?.p1) ? Math.abs(h.p1.health - g.p1.health) : 0,
          p2HealthDiff: (h?.p2 && g?.p2) ? Math.abs(h.p2.health - g.p2.health) : 0,
          p1StateMatch: h?.p1?.state === g?.p1?.state,
          p2StateMatch: h?.p2?.state === g?.p2?.state
        };

        logEvent('System', 'SyncCheck', `[Round ${round} - ${label}]`, { host: h, guest: g, desync });
        return { h, g, desync };
      };

      await getSnapshot('Initial Countdown/Fight');

      // Simulate Host movement (D: right) and Punch (J)
      logEvent('Host', 'Input', 'Host pressing KeyD (move right) & KeyJ (punch)');
      await pageHost.keyboard.down('KeyD');
      await new Promise(r => setTimeout(r, 250));
      await pageHost.keyboard.up('KeyD');
      await pageHost.keyboard.press('KeyJ');

      // Simulate Guest movement (A: move left) and Punch (J)
      logEvent('Guest', 'Input', 'Guest pressing KeyA (move left) & KeyJ (punch)');
      await pageGuest.keyboard.down('KeyA');
      await new Promise(r => setTimeout(r, 250));
      await pageGuest.keyboard.up('KeyA');
      await pageGuest.keyboard.press('KeyJ');

      await new Promise(r => setTimeout(r, 600));
      await getSnapshot('After Movement & Punch');

      // Simulate Host jump (W) & special (I)
      logEvent('Host', 'Input', 'Host pressing KeyW (jump) & KeyI (special)');
      await pageHost.keyboard.press('KeyW');
      await pageHost.keyboard.press('KeyI');

      // Simulate Guest kick (K) & jump (W)
      logEvent('Guest', 'Input', 'Guest pressing KeyK (kick) & KeyW (jump)');
      await pageGuest.keyboard.press('KeyK');
      await pageGuest.keyboard.press('KeyW');

      await new Promise(r => setTimeout(r, 1200));
      await getSnapshot('After Special & Kick');

      // Force KO to test gameover transition and rematch logic
      logEvent('Host', 'GameLogic', 'Setting P2 health to 0 to trigger KO & victory');
      await pageHost.evaluate(() => {
        if (window.gameEngine && window.gameEngine.p2) {
          window.gameEngine.p2.health = 0;
        }
      });

      await new Promise(r => setTimeout(r, 1500));
      const gameOverSnap = await getSnapshot('Match Game Over');
      roundResults.push(gameOverSnap);

      // Re-Match test: Host and Guest click Play Again
      if (round < 5) {
        logEvent('Host', 'Rematch', 'Host clicking Play Again button');
        await pageHost.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Play Again'));
          if (btn) btn.click();
        });

        logEvent('Guest', 'Rematch', 'Guest clicking Play Again button');
        await pageGuest.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Play Again'));
          if (btn) btn.click();
        });

        await new Promise(r => setTimeout(r, 1500));
      }
    }

    logEvent('System', 'Complete', 'All 5 test iterations executed.');

  } catch (err) {
    logEvent('System', 'Error', err.toString(), { stack: err.stack });
  } finally {
    const reportData = {
      timeline,
      consoleLogs,
      failedResources,
      networkLogsSummary: {
        hostRequests: networkLogs.host.length,
        guestRequests: networkLogs.guest.length
      }
    };
    fs.writeFileSync(LOG_FILE, JSON.stringify(reportData, null, 2));
    console.log(`📄 Results saved to ${LOG_FILE}`);

    await browser.close();
    if (devServer) devServer.kill();
  }
}

runInvestigation();
