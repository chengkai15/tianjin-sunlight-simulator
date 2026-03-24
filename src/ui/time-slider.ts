/**
 * 时间滑块模块
 * 允许用户选择一天中的具体时刻（日出到日落），实时更新太阳位置
 */

import { StateManager } from '../state';
import { SEASON_CONFIG, TIANJIN_LAT, TIANJIN_LNG } from '../types';
import { calculateDayInfo } from '../calc/solar';
import { formatTime } from './season-selector';

/**
 * 初始化时间滑块
 * - 拖动滑块时调用 stateManager.setCurrentHour()
 * - 订阅状态变更，同步滑块位置和时间显示
 * - 季节变更时更新滑块范围（日出到日落）
 */
export function initTimeSlider(stateManager: StateManager): void {
  const slider = document.getElementById('time-slider') as HTMLInputElement | null;
  const display = document.getElementById('time-display') as HTMLElement | null;
  if (!slider || !display) return;

  // 滑块 input 事件：用户拖动时更新状态
  slider.addEventListener('input', () => {
    const value = parseFloat(slider.value);
    if (!isNaN(value)) {
      stateManager.setCurrentHour(value);
    }
  });

  /** 更新滑块范围和显示 */
  let lastSeason: string | null = null;

  stateManager.subscribe((state) => {
    // 季节变更时，重新计算滑块范围
    if (state.season !== lastSeason) {
      lastSeason = state.season;
      const config = SEASON_CONFIG[state.season];
      const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, config.dayOfYear);

      const minVal = Math.floor(dayInfo.sunrise);
      const maxVal = Math.ceil(dayInfo.sunset);

      slider.min = String(minVal);
      slider.max = String(maxVal);

      // 如果当前时刻超出新范围，钳位到范围内
      if (state.currentHour < minVal || state.currentHour > maxVal) {
        const clamped = Math.max(minVal, Math.min(maxVal, state.currentHour));
        stateManager.setCurrentHour(clamped);
        return; // setCurrentHour 会再次触发 subscribe，避免重复更新
      }
    }

    // 同步滑块值和时间显示
    slider.value = String(state.currentHour);
    display.textContent = formatTime(state.currentHour);
  });

  // 初始化：用当前状态设置滑块范围和显示
  const initialState = stateManager.getState();
  const config = SEASON_CONFIG[initialState.season];
  const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, config.dayOfYear);

  const minVal = Math.floor(dayInfo.sunrise);
  const maxVal = Math.ceil(dayInfo.sunset);

  slider.min = String(minVal);
  slider.max = String(maxVal);
  lastSeason = initialState.season;

  // 钳位初始时刻
  const clampedHour = Math.max(minVal, Math.min(maxVal, initialState.currentHour));
  if (clampedHour !== initialState.currentHour) {
    stateManager.setCurrentHour(clampedHour);
  } else {
    slider.value = String(initialState.currentHour);
    display.textContent = formatTime(initialState.currentHour);
  }
}
