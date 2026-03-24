/**
 * 旋转控件模块
 * 实现拖拽旋转交互（鼠标 + 触摸），用于设置房屋朝向角度
 */

import { StateManager } from '../state';
import { normalizeAngle } from '../calc/orientation';

/**
 * 从指针位置计算相对于元素中心的角度
 * 0° = 北（上方），顺时针增加
 */
export function pointerToAngle(centerX: number, centerY: number, pointerX: number, pointerY: number): number {
  const dx = pointerX - centerX;
  const dy = -(pointerY - centerY); // 翻转 Y 轴，使上方为正
  const radians = Math.atan2(dx, dy); // atan2(x, y) 使 0° 指向上方
  const degrees = radians * (180 / Math.PI);
  return normalizeAngle(degrees);
}

/**
 * 获取元素的中心坐标（相对于视口）
 */
function getElementCenter(el: HTMLElement): { cx: number; cy: number } {
  const rect = el.getBoundingClientRect();
  return {
    cx: rect.left + rect.width / 2,
    cy: rect.top + rect.height / 2,
  };
}

/**
 * 初始化旋转控件
 * @param stateManager 应用状态管理器
 */
export function initRotaryControl(stateManager: StateManager): void {
  const container = document.getElementById('rotary-control');
  if (!container) return;

  const dial = container.querySelector<HTMLElement>('.rotary-dial');
  if (!dial) return;

  // 创建方向指示线
  const indicator = document.createElement('div');
  indicator.className = 'rotary-indicator';
  dial.appendChild(indicator);

  let isDragging = false;

  /** 更新表盘旋转和 aria 属性 */
  function updateDial(angle: number): void {
    dial!.style.transform = `rotate(${angle}deg)`;
    container!.setAttribute('aria-valuenow', String(Math.round(angle)));
  }

  /** 处理指针移动，计算角度并更新状态 */
  function handlePointerMove(clientX: number, clientY: number): void {
    const { cx, cy } = getElementCenter(dial!);
    const angle = pointerToAngle(cx, cy, clientX, clientY);
    stateManager.setOrientation(angle);
  }

  // --- 鼠标事件 ---
  dial.addEventListener('mousedown', (e: MouseEvent) => {
    e.preventDefault();
    isDragging = true;
    handlePointerMove(e.clientX, e.clientY);
  });

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handlePointerMove(e.clientX, e.clientY);
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // --- 触摸事件 ---
  dial.addEventListener('touchstart', (e: TouchEvent) => {
    e.preventDefault();
    isDragging = true;
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  }, { passive: false });

  document.addEventListener('touchmove', (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    handlePointerMove(touch.clientX, touch.clientY);
  }, { passive: false });

  document.addEventListener('touchend', () => {
    isDragging = false;
  });

  // --- 订阅状态变更，同步更新控件 ---
  stateManager.subscribe((state) => {
    updateDial(state.orientation);
  });

  // 初始化显示
  updateDial(stateManager.getState().orientation);
}
