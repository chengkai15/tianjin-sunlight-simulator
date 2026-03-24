/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/state';
import { initTimeSlider } from '../../src/ui/time-slider';
import { SEASON_CONFIG, TIANJIN_LAT, TIANJIN_LNG } from '../../src/types';
import { calculateDayInfo } from '../../src/calc/solar';

/** 创建时间滑块所需的 DOM 元素 */
function setupDOM() {
  document.body.innerHTML = '';

  const slider = document.createElement('input');
  slider.id = 'time-slider';
  slider.type = 'range';
  slider.min = '5';
  slider.max = '19';
  slider.step = '0.1';
  slider.value = '12';
  document.body.appendChild(slider);

  const display = document.createElement('span');
  display.id = 'time-display';
  display.className = 'time-display';
  display.textContent = '12:00';
  document.body.appendChild(display);

  return { slider, display };
}

describe('initTimeSlider', () => {
  let stateManager: StateManager;
  let slider: HTMLInputElement;
  let display: HTMLElement;

  beforeEach(() => {
    stateManager = new StateManager();
    const dom = setupDOM();
    slider = dom.slider;
    display = dom.display;
    initTimeSlider(stateManager);
  });

  it('should initialize slider range based on current season', () => {
    const season = stateManager.getState().season;
    const config = SEASON_CONFIG[season];
    const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, config.dayOfYear);

    expect(Number(slider.min)).toBe(Math.floor(dayInfo.sunrise));
    expect(Number(slider.max)).toBe(Math.ceil(dayInfo.sunset));
  });

  it('should display formatted time on initialization', () => {
    // Display should show a valid HH:MM format
    expect(display.textContent).toMatch(/^\d{2}:\d{2}$/);
  });

  it('should update state when slider is dragged', () => {
    slider.value = '14.5';
    slider.dispatchEvent(new Event('input'));
    expect(stateManager.getState().currentHour).toBe(14.5);
  });

  it('should sync slider value when state changes externally', () => {
    stateManager.setCurrentHour(8.5);
    expect(slider.value).toBe('8.5');
  });

  it('should update time display when state changes', () => {
    stateManager.setCurrentHour(15);
    expect(display.textContent).toBe('15:00');
  });

  it('should update slider range when season changes', () => {
    stateManager.setSeason('summer');
    const summerConfig = SEASON_CONFIG['summer'];
    const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, summerConfig.dayOfYear);

    expect(Number(slider.min)).toBe(Math.floor(dayInfo.sunrise));
    expect(Number(slider.max)).toBe(Math.ceil(dayInfo.sunset));
  });

  it('should update slider range when switching to winter', () => {
    stateManager.setSeason('winter');
    const winterConfig = SEASON_CONFIG['winter'];
    const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, winterConfig.dayOfYear);

    expect(Number(slider.min)).toBe(Math.floor(dayInfo.sunrise));
    expect(Number(slider.max)).toBe(Math.ceil(dayInfo.sunset));
  });

  it('should clamp currentHour if outside new season range', () => {
    // Set hour to a late time
    stateManager.setCurrentHour(19);

    // Switch to winter where sunset is earlier
    stateManager.setSeason('winter');
    const winterConfig = SEASON_CONFIG['winter'];
    const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, winterConfig.dayOfYear);
    const maxVal = Math.ceil(dayInfo.sunset);

    // currentHour should be clamped to the max of winter range
    expect(stateManager.getState().currentHour).toBeLessThanOrEqual(maxVal);
  });

  it('should not crash when DOM elements are missing', () => {
    document.body.innerHTML = '';
    const sm = new StateManager();
    // Should not throw
    expect(() => initTimeSlider(sm)).not.toThrow();
  });
});
