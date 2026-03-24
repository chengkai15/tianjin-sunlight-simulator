/**
 * 朝向处理模块
 * 处理朝向角度的输入、规范化和格式化
 */

/** 方位标签，按顺时针排列，每个覆盖 45° 范围 */
const DIRECTION_LABELS: { min: number; max: number; label: string }[] = [
  { min: 0, max: 22.5, label: '北' },
  { min: 22.5, max: 67.5, label: '东北' },
  { min: 67.5, max: 112.5, label: '东' },
  { min: 112.5, max: 157.5, label: '东南' },
  { min: 157.5, max: 202.5, label: '南' },
  { min: 202.5, max: 247.5, label: '西南' },
  { min: 247.5, max: 292.5, label: '西' },
  { min: 292.5, max: 337.5, label: '西北' },
  { min: 337.5, max: 360, label: '北' },
];

/**
 * 将任意角度值规范化到 [0, 360) 范围
 * 处理负数和超出范围的值
 */
export function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * 角度转方位标签（北、东北、东、东南、南、西南、西、西北）
 * 角度先规范化到 [0, 360)，再映射到对应方位
 */
export function angleToLabel(angle: number): string {
  const normalized = normalizeAngle(angle);
  for (const dir of DIRECTION_LABELS) {
    if (normalized >= dir.min && normalized < dir.max) {
      return dir.label;
    }
  }
  // 360 恰好等于 max 的边界情况，归为北
  return '北';
}

/**
 * 解析用户输入的角度字符串
 * 支持纯数字和带 ° 符号的输入
 * 返回规范化后的角度值，无效输入返回 null
 */
export function parseOrientation(input: string): number | null {
  const trimmed = input.trim().replace(/°$/, '');
  if (trimmed === '') return null;
  const value = Number(trimmed);
  if (isNaN(value) || !isFinite(value)) return null;
  return normalizeAngle(value);
}

/**
 * 格式化角度为显示字符串，保留一位小数
 * 例如：180 → "180.0°"
 */
export function formatOrientation(angle: number): string {
  const normalized = normalizeAngle(angle);
  return `${normalized.toFixed(1)}°`;
}
