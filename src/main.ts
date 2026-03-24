/**
 * 天津房屋采光模拟器 - 入口文件
 * 初始化状态管理器和所有 UI/渲染组件，连接状态订阅
 */

import './styles.css';
import { StateManager } from './state';
import { initRotaryControl } from './ui/rotary-control';
import { initOrientationInput } from './ui/orientation-input';
import { initSeasonSelector } from './ui/season-selector';
import { initTimeSlider } from './ui/time-slider';
import { initDataPanel } from './ui/data-panel';
import { initCanvasRenderer } from './render/canvas-renderer';

// 等待 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  const stateManager = new StateManager();

  // 初始化 UI 交互组件
  initRotaryControl(stateManager);
  initOrientationInput(stateManager);
  initSeasonSelector(stateManager);
  initTimeSlider(stateManager);
  initDataPanel(stateManager);

  // 初始化 Canvas 渲染器（内部处理状态订阅和窗口 resize 事件）
  initCanvasRenderer(stateManager);
});
