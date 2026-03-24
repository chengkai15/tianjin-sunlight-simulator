/**
 * 季节选择器模块
 * 渲染四个季节按钮，切换季节时更新状态，显示日出日落时间
 */

import { StateManager } from '../state';
import type { Season } from '../types';
import { SEASON_CONFIG, TIANJIN_LAT, TIANJIN_LNG } from '../types';
import { calculateDayInfo } from '../calc/solar';

/**
 * 将小时数格式化为 HH:MM 字符串
 * 例如 6.5 → "06:30"
 */
export function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * 初始化季节选择器
 * - 为每个季节按钮添加点击事件，切换季节
 * - 订阅状态变更，更新按钮激活状态和季节信息
 */
export function initSeasonSelector(stateManager: StateManager): void {
  const selectorEl = document.getElementById('season-selector');
  const infoEl = document.getElementById('season-info');
  if (!selectorEl || !infoEl) return;

  const buttons = selectorEl.querySelectorAll<HTMLButtonElement>('.season-btn');
  const dateSpan = infoEl.querySelector<HTMLElement>('.season-date');
  const sunriseSpan = infoEl.querySelector<HTMLElement>('.season-sunrise');
  const sunsetSpan = infoEl.querySelector<HTMLElement>('.season-sunset');

  // 为每个按钮添加点击事件
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const season = btn.dataset.season as Season;
      if (season) {
        stateManager.setSeason(season);
      }
    });
  });

  /** 更新按钮激活状态和季节信息 */
  function updateUI(season: Season): void {
    // 更新按钮状态
    buttons.forEach((btn) => {
      const isActive = btn.dataset.season === season;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });

    // 计算当前季节的日出日落信息
    const config = SEASON_CONFIG[season];
    const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, config.dayOfYear);

    // 更新季节信息显示
    if (dateSpan) {
      dateSpan.textContent = config.date;
    }
    if (sunriseSpan) {
      sunriseSpan.textContent = `日出：${formatTime(dayInfo.sunrise)}`;
    }
    if (sunsetSpan) {
      sunsetSpan.textContent = `日落：${formatTime(dayInfo.sunset)}`;
    }
  }

  // 订阅状态变更
  stateManager.subscribe((state) => {
    updateUI(state.season);
  });

  // 初始化：用当前状态渲染
  updateUI(stateManager.getState().season);
}
