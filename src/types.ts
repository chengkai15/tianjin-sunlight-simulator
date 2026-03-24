/** 太阳位置 */
export interface SolarPosition {
  /** 太阳方位角（度），正北为0°顺时针 */
  azimuth: number;
  /** 太阳高度角（度），地平线为0° */
  altitude: number;
}

/** 日出日落信息 */
export interface DayInfo {
  /** 日出时间（小时，如 6.5 表示 6:30） */
  sunrise: number;
  /** 日落时间（小时） */
  sunset: number;
  /** 日照时长（小时） */
  daylight: number;
}

/** 采光数据 */
export interface SunlightData {
  /** 总日照时长（小时） */
  totalDaylight: number;
  /** 有效采光时长（小时） */
  effectiveSunlight: number;
  /** 当前太阳方位角 */
  currentAzimuth: number;
  /** 当前太阳高度角 */
  currentAltitude: number;
}

/** 季节类型 */
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 应用状态 */
export interface AppState {
  /** 房屋朝向角度 [0, 360) */
  orientation: number;
  /** 当前季节 */
  season: Season;
  /** 当前时刻（小时） */
  currentHour: number;
}

/** 季节配置 */
export const SEASON_CONFIG: Record<Season, { dayOfYear: number; label: string; date: string }> = {
  spring: { dayOfYear: 79, label: '春分', date: '3月20日' },
  summer: { dayOfYear: 172, label: '夏至', date: '6月21日' },
  autumn: { dayOfYear: 265, label: '秋分', date: '9月22日' },
  winter: { dayOfYear: 355, label: '冬至', date: '12月21日' },
};

/** 天津纬度 */
export const TIANJIN_LAT = 39.1;

/** 天津经度 */
export const TIANJIN_LNG = 117.2;
