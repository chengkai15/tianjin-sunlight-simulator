/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/state';
import { initSeasonSelector, formatTime } from '../../src/ui/season-selector';

/** 为测试创建所需的 DOM 元素 */
function setupDOM() {
  document.body.innerHTML = '';

  const selector = document.createElement('div');
  selector.id = 'season-selector';
  selector.setAttribute('role', 'radiogroup');

  const seasons = ['spring', 'summer', 'autumn', 'winter'];
  const labels = ['春分', '夏至', '秋分', '冬至'];
  seasons.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.className = 'season-btn';
    btn.dataset.season = s;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', 'false');
    btn.textContent = labels[i];
    selector.appendChild(btn);
  });
  document.body.appendChild(selector);

  const info = document.createElement('div');
  info.id = 'season-info';
  info.innerHTML = `
    <span class="season-date"></span>
    <span class="season-sunrise">日出：--:--</span>
    <span class="season-sunset">日落：--:--</span>
  `;
  document.body.appendChild(info);

  return { selector, info };
}

describe('formatTime', () => {
  it('should format 6.5 as "06:30"', () => {
    expect(formatTime(6.5)).toBe('06:30');
  });

  it('should format 12 as "12:00"', () => {
    expect(formatTime(12)).toBe('12:00');
  });

  it('should format 18.75 as "18:45"', () => {
    expect(formatTime(18.75)).toBe('18:45');
  });

  it('should format 5.25 as "05:15"', () => {
    expect(formatTime(5.25)).toBe('05:15');
  });
});

describe('initSeasonSelector', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    setupDOM();
    initSeasonSelector(stateManager);
  });

  it('should set active class and aria-checked on the current season button', () => {
    const season = stateManager.getState().season;
    const activeBtn = document.querySelector(`[data-season="${season}"]`) as HTMLButtonElement;
    expect(activeBtn.classList.contains('active')).toBe(true);
    expect(activeBtn.getAttribute('aria-checked')).toBe('true');
  });

  it('should only have one active button at a time', () => {
    const activeButtons = document.querySelectorAll('.season-btn.active');
    expect(activeButtons.length).toBe(1);
  });

  it('should update state when a season button is clicked', () => {
    const winterBtn = document.querySelector('[data-season="winter"]') as HTMLButtonElement;
    winterBtn.click();
    expect(stateManager.getState().season).toBe('winter');
  });

  it('should update active button when season changes', () => {
    stateManager.setSeason('summer');
    const summerBtn = document.querySelector('[data-season="summer"]') as HTMLButtonElement;
    const springBtn = document.querySelector('[data-season="spring"]') as HTMLButtonElement;

    expect(summerBtn.classList.contains('active')).toBe(true);
    expect(summerBtn.getAttribute('aria-checked')).toBe('true');
    expect(springBtn.classList.contains('active')).toBe(false);
    expect(springBtn.getAttribute('aria-checked')).toBe('false');
  });

  it('should display season date in season-info', () => {
    stateManager.setSeason('spring');
    const dateSpan = document.querySelector('.season-date') as HTMLElement;
    expect(dateSpan.textContent).toBe('3月20日');
  });

  it('should display sunrise and sunset times', () => {
    stateManager.setSeason('summer');
    const sunriseSpan = document.querySelector('.season-sunrise') as HTMLElement;
    const sunsetSpan = document.querySelector('.season-sunset') as HTMLElement;

    // Sunrise and sunset should contain formatted times (HH:MM pattern)
    expect(sunriseSpan.textContent).toMatch(/日出：\d{2}:\d{2}/);
    expect(sunsetSpan.textContent).toMatch(/日落：\d{2}:\d{2}/);
  });

  it('should update info when switching seasons', () => {
    stateManager.setSeason('winter');
    const dateSpan = document.querySelector('.season-date') as HTMLElement;
    expect(dateSpan.textContent).toBe('12月21日');

    stateManager.setSeason('autumn');
    expect(dateSpan.textContent).toBe('9月22日');
  });
});
