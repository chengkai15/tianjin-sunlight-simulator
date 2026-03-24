/**
 * 数据展示面板模块
 * 订阅状态变更，显示采光数据：总日照时长、有效采光时长、太阳方位角和高度角
 */

import { StateManager } from '../state';
import { getSunlightData } from '../calc/sunlight';

/**
 * 初始化数据展示面板
 * - 订阅状态变更，调用 getSunlightData() 获取数据
 * - 更新 4 个数据项的显示
 */
export function initDataPanel(stateManager: StateManager): void {
  const totalDaylightEl = document.getElementById('data-total-daylight');
  const effectiveSunlightEl = document.getElementById('data-effective-sunlight');
  const azimuthEl = document.getElementById('data-azimuth');
  const altitudeEl = document.getElementById('data-altitude');

  if (!totalDaylightEl || !effectiveSunlightEl || !azimuthEl || !altitudeEl) return;

  /** 根据状态更新面板数据 */
  function updatePanel(state: { season: Parameters<typeof getSunlightData>[0]; orientation: number; currentHour: number }): void {
    const data = getSunlightData(state.season, state.orientation, state.currentHour);

    totalDaylightEl!.textContent = `${data.totalDaylight.toFixed(1)} 小时`;
    effectiveSunlightEl!.textContent = `${data.effectiveSunlight.toFixed(1)} 小时`;
    azimuthEl!.textContent = `${data.currentAzimuth.toFixed(1)}°`;
    altitudeEl!.textContent = `${data.currentAltitude.toFixed(1)}°`;
  }

  // 订阅状态变更
  stateManager.subscribe(updatePanel);

  // 用当前状态初始化面板
  updatePanel(stateManager.getState());
}
