/**
 * 应用状态管理模块
 * 集中管理应用状态，通知各组件更新
 */

import type { AppState, Season } from './types';
import { normalizeAngle } from './calc/orientation';

/** 状态变更监听器 */
export type StateListener = (state: AppState) => void;

/**
 * 根据当前月份判断季节
 * 3-5月=春季, 6-8月=夏季, 9-11月=秋季, 12-2月=冬季
 */
function getDefaultSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

/**
 * 应用状态管理器
 * 管理房屋朝向、季节、当前时刻等状态，状态变更时通知所有订阅者
 */
export class StateManager {
  private state: AppState;
  private listeners: Set<StateListener> = new Set();

  constructor() {
    this.state = {
      orientation: 180, // 默认朝南
      season: getDefaultSeason(),
      currentHour: 12, // 默认正午
    };
  }

  /** 获取当前状态的只读副本 */
  getState(): AppState {
    return { ...this.state };
  }

  /** 设置房屋朝向角度，自动规范化到 [0, 360) */
  setOrientation(angle: number): void {
    this.state = { ...this.state, orientation: normalizeAngle(angle) };
    this.notify();
  }

  /** 设置当前季节 */
  setSeason(season: Season): void {
    this.state = { ...this.state, season };
    this.notify();
  }

  /** 设置当前时刻（小时） */
  setCurrentHour(hour: number): void {
    this.state = { ...this.state, currentHour: hour };
    this.notify();
  }

  /** 订阅状态变更，返回取消订阅函数 */
  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** 通知所有订阅者 */
  private notify(): void {
    const currentState = this.getState();
    for (const listener of this.listeners) {
      listener(currentState);
    }
  }
}
