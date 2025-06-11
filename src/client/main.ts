import { Game } from './game';

const game = new Game();

function onResize(): void {
  game.resize(window.innerWidth, window.innerHeight);
}

async function onTouchStart(event: TouchEvent): Promise<void> {
  // CRITICAL FIX: Only handle touches on the game world, not on UI elements
  const target = event.target as HTMLElement;
  
  // Check if we're touching a UI element
  if (target && (
    target.tagName === 'BUTTON' || 
    target.closest('button') ||
    target.classList.contains('btn') ||
    target.closest('.btn') ||
    target.closest('.game-ready') ||
    target.closest('.game-over') ||
    target.closest('.screen-overlay') ||
    target.id === 'container' ||
    target.closest('#container')
  )) {
    // Don't handle game actions for UI touches
    return;
  }
  
  // Only handle touches on the 3D world
  if (target && target.closest('#world')) {
    event.preventDefault();
    await game.action();
  }
}

async function onMouseDown(event: MouseEvent): Promise<void> {
  // CRITICAL FIX: Only handle clicks on the game world, not on UI elements
  const target = event.target as HTMLElement;
  
  // Check if we're clicking a UI element
  if (target && (
    target.tagName === 'BUTTON' || 
    target.closest('button') ||
    target.classList.contains('btn') ||
    target.closest('.btn') ||
    target.closest('.game-ready') ||
    target.closest('.game-over') ||
    target.closest('.screen-overlay') ||
    target.id === 'container' ||
    target.closest('#container')
  )) {
    // Don't handle game actions for UI clicks
    return;
  }
  
  // Only handle clicks on the 3D world
  if (target && target.closest('#world')) {
    event.preventDefault();
    window.focus();
    await game.action();
  }
}

async function onKeyDown(event: KeyboardEvent): Promise<void> {
  if (event.code === 'Space') {
    event.preventDefault();
    await game.action();
  }
}

async function onLoad(): Promise<void> {
  await game.prepare(window.innerWidth, window.innerHeight, window.devicePixelRatio);

  await game.start();

  window.addEventListener('resize', onResize, false);
  window.addEventListener('orientationchange', onResize, false);
  window.addEventListener('touchstart', onTouchStart, { passive: false });
  window.addEventListener('mousedown', onMouseDown, false);
  window.focus();
  window.addEventListener('keydown', onKeyDown);
}

window.addEventListener('load', onLoad, false);
