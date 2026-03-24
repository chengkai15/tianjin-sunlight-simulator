/**
 * 太阳位置计算模块
 * 基于简化天文算法计算太阳方位角、高度角、日出日落等信息
 */

import type { SolarPosition, DayInfo } from '../types';

/** 角度转弧度 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** 弧度转角度 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * 计算太阳赤纬角（度）
 * δ = 23.45° × sin(360° × (284 + dayOfYear) / 365)
 */
function solarDeclination(dayOfYear: number): number {
  return 23.45 * Math.sin(toRad((360 * (284 + dayOfYear)) / 365));
}

/**
 * 计算时角（度）
 * H = 15° × (hourOfDay - 12) + (longitude - 120°)
 * 天津位于东八区，标准经度为 120°E
 */
function hourAngle(hourOfDay: number, longitude: number): number {
  return 15 * (hourOfDay - 12) + (longitude - 120);
}

/**
 * 计算日出日落时角（度）
 * cos(H₀) = -tan(lat) × tan(δ)
 * 返回正值 H₀（度），日出时角为 -H₀，日落时角为 +H₀
 */
function sunriseHourAngle(latitude: number, declination: number): number {
  const cosH0 = -Math.tan(toRad(latitude)) * Math.tan(toRad(declination));
  // 极昼/极夜边界处理
  if (cosH0 < -1) return 180; // 极昼
  if (cosH0 > 1) return 0;    // 极夜
  return toDeg(Math.acos(cosH0));
}

/**
 * 计算指定日期和时刻的太阳位置
 *
 * @param latitude  纬度（度）
 * @param longitude 经度（度）
 * @param dayOfYear 年内日序号（1-365）
 * @param hourOfDay 时刻（小时，如 14.5 表示 14:30）
 * @returns 太阳位置（方位角和高度角，单位：度）
 */
export function calculateSolarPosition(
  latitude: number,
  longitude: number,
  dayOfYear: number,
  hourOfDay: number,
): SolarPosition {
  const decl = solarDeclination(dayOfYear);
  const H = hourAngle(hourOfDay, longitude);

  const latRad = toRad(latitude);
  const declRad = toRad(decl);
  const hRad = toRad(H);

  // 太阳高度角: sin(α) = sin(lat)×sin(δ) + cos(lat)×cos(δ)×cos(H)
  const sinAlt =
    Math.sin(latRad) * Math.sin(declRad) +
    Math.cos(latRad) * Math.cos(declRad) * Math.cos(hRad);
  const altitude = toDeg(Math.asin(clamp(sinAlt, -1, 1)));

  // 太阳方位角: cos(A) = (sin(α)×sin(lat) - sin(δ)) / (cos(α)×cos(lat))
  const cosAlt = Math.cos(toRad(altitude));
  let azimuth: number;

  if (cosAlt * Math.cos(latRad) === 0) {
    // 太阳在天顶或纬度为 ±90° 的退化情况
    azimuth = 180;
  } else {
    const cosAz =
      (sinAlt * Math.sin(latRad) - Math.sin(declRad)) /
      (cosAlt * Math.cos(latRad));
    const azFromSouth = toDeg(Math.acos(clamp(cosAz, -1, 1)));

    // 转换为从正北顺时针的方位角：
    // 时角 ≤ 0（上午）→ 太阳偏东 → 方位角 = 180° - azFromSouth
    // 时角 > 0（下午）→ 太阳偏西 → 方位角 = 180° + azFromSouth
    if (H > 0) {
      azimuth = 180 + azFromSouth;
    } else {
      azimuth = 180 - azFromSouth;
    }
  }

  // 确保方位角在 [0, 360) 范围
  azimuth = ((azimuth % 360) + 360) % 360;

  return { azimuth, altitude };
}

/**
 * 计算指定日期的日出日落信息
 *
 * @param latitude  纬度（度）
 * @param longitude 经度（度）
 * @param dayOfYear 年内日序号（1-365）
 * @returns 日出日落信息
 */
export function calculateDayInfo(
  latitude: number,
  longitude: number,
  dayOfYear: number,
): DayInfo {
  const decl = solarDeclination(dayOfYear);
  const H0 = sunriseHourAngle(latitude, decl);

  // 时角转换为小时：H₀(度) / 15 = 小时偏移
  // 日出 = 12 - H₀/15，日落 = 12 + H₀/15（太阳时）
  // 经度修正：(longitude - 120°) / 15 小时
  const longitudeCorrection = (longitude - 120) / 15;

  const sunrise = 12 - H0 / 15 - longitudeCorrection;
  const sunset = 12 + H0 / 15 - longitudeCorrection;
  const daylight = sunset - sunrise;

  return { sunrise, sunset, daylight };
}

/**
 * 计算一天中从日出到日落每 0.5 小时的太阳位置序列
 *
 * @param latitude  纬度（度）
 * @param longitude 经度（度）
 * @param dayOfYear 年内日序号（1-365）
 * @returns 太阳位置数组（仅包含高度角 ≥ 0 的时刻）
 */
export function calculateDailySolarPath(
  latitude: number,
  longitude: number,
  dayOfYear: number,
): SolarPosition[] {
  const { sunrise, sunset } = calculateDayInfo(latitude, longitude, dayOfYear);
  const path: SolarPosition[] = [];

  // 从日出开始，每 0.5 小时取一个点，直到日落
  for (let hour = sunrise; hour <= sunset + 1e-9; hour += 0.5) {
    const pos = calculateSolarPosition(latitude, longitude, dayOfYear, hour);
    if (pos.altitude >= 0) {
      path.push(pos);
    }
  }

  return path;
}

/** 将值限制在 [min, max] 范围内 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
