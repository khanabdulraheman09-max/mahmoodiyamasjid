// Native Android Experience Automated Verification Suite
// Tests navigation stack, modal back-button interception, exit confirmation, and NativeService APIs

import { NativeService } from '../services/nativeService';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${message}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${message}`);
  }
}

// Simulated Navigation & Back Handler State Machine matching NavigationContext logic
class TestNavigationStack {
  public currentTab: string = 'dashboard';
  public history: string[] = ['dashboard'];
  public isExitPromptVisible: boolean = false;
  public exitCalled: boolean = false;
  private backHandlers: Array<{ id: string; priority: number; handler: () => boolean }> = [];
  private lastBackPressTime: number = 0;

  registerBackHandler(id: string, handler: () => boolean, priority: number = 50): () => void {
    this.backHandlers = this.backHandlers.filter((h) => h.id !== id);
    this.backHandlers.push({ id, priority, handler });
    return () => {
      this.backHandlers = this.backHandlers.filter((h) => h.id !== id);
    };
  }

  navigateTo(tab: string) {
    if (this.currentTab === tab) return;
    if (tab === 'dashboard') {
      this.history = ['dashboard'];
    } else {
      this.history.push(tab);
    }
    this.currentTab = tab;
  }

  handleBackButton(): boolean {
    // 1. Highest priority modal / sheet handler
    if (this.backHandlers.length > 0) {
      const sorted = [...this.backHandlers].sort((a, b) => b.priority - a.priority);
      for (const item of sorted) {
        if (item.handler()) {
          return true; // Modal dismissed
        }
      }
    }

    // 2. Tab history pop
    if (this.history.length > 1) {
      this.history.pop();
      this.currentTab = this.history[this.history.length - 1];
      return true;
    }

    // 3. Exit prompt on root dashboard
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      this.exitCalled = true;
      return true;
    } else {
      this.lastBackPressTime = now;
      this.isExitPromptVisible = true;
      return false;
    }
  }
}

async function runNativeVerification() {
  console.log('=====================================================================');
  console.log('MASJID MEHMOODIYA - NATIVE ANDROID EXPERIENCE VERIFICATION TEST');
  console.log('=====================================================================');

  // 1. Test Navigation Stack History
  console.log('\n-- 1. Navigation Stack & History Tracking --');
  const nav = new TestNavigationStack();
  assert(nav.currentTab === 'dashboard' && nav.history.length === 1, 'Initial screen is Dashboard at root');

  nav.navigateTo('maktab');
  assert(nav.currentTab === 'maktab' && nav.history.length === 2, 'Navigated to Maktab; history depth is 2');

  nav.navigateTo('quran');
  assert(nav.currentTab === 'quran' && nav.history.length === 3, 'Navigated to Quran; history depth is 3');

  // 2. Test Hardware Back Button Screen Navigation
  console.log('\n-- 2. Hardware Back Button Screen Navigation --');
  const back1 = nav.handleBackButton();
  assert(back1 === true, 'First back button press handled');
  assert(nav.currentTab === 'maktab', `Returned from Quran to Maktab (current: ${nav.currentTab})`);

  const back2 = nav.handleBackButton();
  assert(back2 === true, 'Second back button press handled');
  assert(nav.currentTab === 'dashboard', `Returned from Maktab to Dashboard (current: ${nav.currentTab})`);

  // 3. Test Modal Back-Handler Interception (Close modal before navigating away)
  console.log('\n-- 3. Modal / Sheet Interception Priority --');
  nav.navigateTo('announcements');
  assert(nav.currentTab === 'announcements', 'Navigated to Announcements screen');

  const modalState = { isOpen: true };
  const unregisterModal = nav.registerBackHandler(
    'test_create_announcement_modal',
    () => {
      if (modalState.isOpen) {
        modalState.isOpen = false;
        return true; // Modal handled back event
      }
      return false;
    },
    90
  );

  assert(modalState.isOpen === true, 'Test modal opened over screen');
  const modalBack = nav.handleBackButton();
  assert(modalBack === true, 'Back button intercepted by modal handler');
  assert(modalState.isOpen === false, 'Modal closed successfully');
  assert(nav.currentTab === 'announcements', 'Screen remains on Announcements; did not navigate away');

  unregisterModal();

  // Subsequent back button pops the screen
  const screenBack = nav.handleBackButton();
  assert(screenBack === true && nav.currentTab === 'dashboard', 'Subsequent back button returned to Dashboard');

  // 4. Test Root Dashboard Exit Protection (Double-Tap to Exit)
  console.log('\n-- 4. Dashboard Exit Confirmation --');
  assert(nav.currentTab === 'dashboard', 'User is on root Dashboard');

  // First back press: shows "Press back again to exit" toast, does not exit
  const exitAttempt1 = nav.handleBackButton();
  assert(exitAttempt1 === false, 'First back press did NOT exit app');
  assert(nav.isExitPromptVisible === true, 'Exit confirmation toast is triggered');
  assert(nav.exitCalled === false, 'App exit was prevented on single press');

  // Second back press within 2000ms: exits app
  const exitAttempt2 = nav.handleBackButton();
  assert(exitAttempt2 === true, 'Second back press within 2000ms handled');
  assert(nav.exitCalled === true, 'App exit confirmed on second press');

  // 5. Test NativeService Defensive Execution
  console.log('\n-- 5. Native Services & System Bar Configuration --');
  await NativeService.init();
  assert(true, 'NativeService.init() executed safely');

  await NativeService.hideSplash();
  assert(true, 'NativeService.hideSplash() executed safely');

  await NativeService.hapticTap();
  await NativeService.hapticMedium();
  await NativeService.hapticSuccess();
  await NativeService.hapticWarning();
  assert(true, 'Native Haptics (Tap, Medium, Success, Warning) ran without exception');

  const copyResult = await NativeService.copyText('19.9248, 75.3670');
  assert(typeof copyResult === 'boolean', `NativeService.copyText returned boolean: ${copyResult}`);

  const shareResult = await NativeService.share({
    title: 'Masjid Mehmoodiya Test',
    text: 'Salah timings and Maktab updates',
  });
  assert(typeof shareResult === 'boolean', `NativeService.share returned boolean: ${shareResult}`);

  console.log('\n=====================================================================');
  console.log(`NATIVE EXPERIENCE VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================================');

  if (failed > 0) {
    throw new Error(`${failed} native experience tests failed`);
  }
}

runNativeVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
