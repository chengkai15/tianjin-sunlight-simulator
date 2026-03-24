/**
 * 数字输入框联动模块
 * 处理朝向角度数字输入框与状态管理器的双向同步
 */

import { StateManager } from '../state';
import { angleToLabel } from '../calc/orientation';

/**
 * 初始化数字输入框联动
 * - 输入框变更时更新状态（自动规范化）
 * - 订阅状态变更，同步更新输入框和方位标签
 * - 处理无效输入（非数字、空值）
 */
export function initOrientationInput(stateManager: StateManager): void {
  const input = document.getElementById('orientation-input') as HTMLInputElement | null;
  const directionLabel = document.getElementById('direction-label');
  if (!input || !directionLabel) return;

  // 输入框 change 事件：用户完成输入后触发
  input.addEventListener('change', () => {
    const raw = input.value.trim();
    const parsed = parseFloat(raw);

    if (raw === '' || isNaN(parsed) || !isFinite(parsed)) {
      // 无效输入：恢复为当前状态中的有效值
      const current = stateManager.getState().orientation;
      input.value = String(Math.round(current));
      return;
    }

    // 有效数字：通过 StateManager 设置（内部自动规范化）
    stateManager.setOrientation(parsed);
  });

  // 订阅状态变更，同步更新输入框和方位标签
  stateManager.subscribe((state) => {
    input.value = String(Math.round(state.orientation));
    directionLabel.textContent = angleToLabel(state.orientation);
  });

  // 初始化：用当前状态值填充
  const initialState = stateManager.getState();
  input.value = String(Math.round(initialState.orientation));
  directionLabel.textContent = angleToLabel(initialState.orientation);
}
