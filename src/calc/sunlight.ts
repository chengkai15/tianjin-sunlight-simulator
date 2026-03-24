/**
 * 采光分析模块
 * 基于太阳位置和房屋朝向计算有效采光数据
 */

import type { SolarPosition, DayInfo, SunlightData, Season } from '../types';
import { SEASON_CONFIG, TIANJIN_LAT, TIANJIN_LNG } from '../types';
import {
  calculateSolarPosition,
  calculateDayInfo,
  calculateDailySolarPath,
} from './solar';

/**
 * 计算太阳方位角与房屋朝向之间的最小角度差（考虑 360° 环绕）
 * 返回值在 [0, 180] 范围内
 */
function angleDifference(azimuth: number, orientation: number): number {
  let diff = Math.abs(azimuth - orientation) % 360;
  if (diff > 180) {
    diff = 360 - diff;
  }
  return diff;
}

/**
 * 计算有效采光时长（太阳直射房屋正面的时间段）
 *
 * 有效采光条件：
 * - 太阳高度角 > 0°（白天）
 * - 太阳方位角与房屋朝向差 < 90°（太阳在房屋正面半球内）
 *
 * solarPath 中的点以 0.5 小时为间隔，每个符合条件的点贡献 0.5 小时
 *
 * @param solarPath      一天中的太阳位置序列（0.5h 间隔）
 * @param houseOrientation 房屋朝向角度（0-360，正北为0°顺时针）
 * @param dayInfo        日出日落信息
 * @returns 有效采光时长（小时）
 */
export function calculateEffectiveSunlight(
  solarPath: SolarPosition[],
  houseOrientation: number,
  _dayInfo: DayInfo,
): number {
  let effectiveCount = 0;

  for (const pos of solarPath) {
    if (pos.altitude > 0 && angleDifference(pos.azimuth, houseOrientation) < 90) {
      effectiveCount++;
    }
  }

  // 每个点代表 0.5 小时
  return effectiveCount * 0.5;
}

/**
 * 获取完整采光数据
 *
 * @param season          季节
 * @param houseOrientation 房屋朝向角度（0-360）
 * @param currentHour     当前时刻（小时）
 * @returns 采光数据（总日照、有效采光、当前太阳位置）
 */
export function getSunlightData(
  season: Season,
  houseOrientation: number,
  currentHour: number,
): SunlightData {
  const { dayOfYear } = SEASON_CONFIG[season];

  const dayInfo = calculateDayInfo(TIANJIN_LAT, TIANJIN_LNG, dayOfYear);
  const solarPath = calculateDailySolarPath(TIANJIN_LAT, TIANJIN_LNG, dayOfYear);
  const currentPosition = calculateSolarPosition(
    TIANJIN_LAT,
    TIANJIN_LNG,
    dayOfYear,
    currentHour,
  );

  const effectiveSunlight = calculateEffectiveSunlight(
    solarPath,
    houseOrientation,
    dayInfo,
  );

  return {
    totalDaylight: dayInfo.daylight,
    effectiveSunlight,
    currentAzimuth: currentPosition.azimuth,
    currentAltitude: currentPosition.altitude,
  };
}
