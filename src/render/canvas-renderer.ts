/**
 * Canvas 渲染器模块
 * 管理 Canvas 上下文和尺寸，协调各渲染子模块绘制采光可视化
 */

import type { AppState, SolarPosition } from '../types';
import { SEASON_CONFIG, TIANJIN_LAT, TIANJIN_LNG } from '../types';
import { calculateSolarPosition, calculateDailySolarPath } from '../calc/solar';
import type { StateManager } from '../state';

/** 渲染上下文，传递给子模块使用 */
export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
}

/**
 * Canvas 渲染器
 * 负责管理 Canvas 上下文、尺寸适配和协调子模块渲染
 */
export class CanvasRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private width = 0;
  private height = 0;
  private degraded = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.degraded = true;
      this.showDegradedMessage();
      return;
    }
    this.ctx = ctx;
    this.resize();
  }

  /** 是否处于降级模式（Canvas 上下文获取失败） */
  isDegraded(): boolean {
    return this.degraded;
  }

  /** 获取渲染上下文，供子模块使用 */
  getRenderContext(): RenderContext | null {
    if (!this.ctx) return null;
    return {
      canvas: this.canvas,
      ctx: this.ctx,
      width: this.width,
      height: this.height,
    };
  }

  /**
   * 响应窗口尺寸变化，更新 Canvas 尺寸
   * 考虑 devicePixelRatio 以支持高清屏
   */
  resize(): void {
    if (this.degraded || !this.ctx) return;

    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // 如果容器尺寸为 0，延迟重试
    if (displayWidth === 0 || displayHeight === 0) {
      requestAnimationFrame(() => this.resize());
      return;
    }

    // 设置 Canvas 实际像素尺寸（高清屏适配）
    this.canvas.width = displayWidth * dpr;
    this.canvas.height = displayHeight * dpr;

    // 设置 CSS 显示尺寸
    this.canvas.style.width = `${displayWidth}px`;
    this.canvas.style.height = `${displayHeight}px`;

    // 缩放上下文以匹配 DPR
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.width = displayWidth;
    this.height = displayHeight;
  }

  /**
   * 主渲染方法，协调各子模块绘制
   * @param state 当前应用状态
   * @param solarPath 当日太阳轨迹
   * @param currentPosition 当前时刻太阳位置
   */
  render(
    state: AppState,
    solarPath: SolarPosition[],
    currentPosition: SolarPosition,
  ): void {
    if (this.degraded || !this.ctx) return;
    if (this.width === 0 || this.height === 0) return;

    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.4;

    // 1. 清空画布
    ctx.clearRect(0, 0, w, h);

    // 2. 绘制背景和罗盘
    this.drawCompassRose(ctx, cx, cy, radius);

    // 3. 绘制太阳轨迹弧线（子模块 sun-path.ts 将在 6.3 实现）
    this.drawSunPath(ctx, cx, cy, radius, solarPath);

    // 4. 绘制房屋俯视图（子模块 house-view.ts 将在 6.2 实现）
    this.drawHouse(ctx, cx, cy, radius, state.orientation);

    // 5. 绘制光照效果（子模块 lighting.ts 将在 6.4 实现）
    this.drawLighting(ctx, cx, cy, radius, state.orientation, currentPosition);

    // 6. 绘制当前太阳位置标记
    this.drawSunMarker(ctx, cx, cy, radius, currentPosition);
  }

  /** 绘制罗盘背景（N/E/S/W 标签） */
  private drawCompassRose(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
  ): void {
    // 绘制外圆
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 绘制十字线
    ctx.beginPath();
    ctx.moveTo(cx, cy - radius);
    ctx.lineTo(cx, cy + radius);
    ctx.moveTo(cx - radius, cy);
    ctx.lineTo(cx + radius, cy);
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // 绘制方位标签
    const labelOffset = radius + 16;
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#666';

    ctx.fillText('北', cx, cy - labelOffset);
    ctx.fillText('南', cx, cy + labelOffset);
    ctx.fillText('东', cx + labelOffset, cy);
    ctx.fillText('西', cx - labelOffset, cy);
  }

  /**
   * 绘制太阳轨迹弧线
   * 将太阳方位角和高度角映射到圆形区域内
   */
  private drawSunPath(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    solarPath: SolarPosition[],
  ): void {
    if (solarPath.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = '#FFA500';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);

    for (let i = 0; i < solarPath.length; i++) {
      const pos = solarPath[i];
      const point = this.solarToCanvas(pos, cx, cy, radius);
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();
    ctx.setLineDash([]);
  }

  /** 绘制房屋俯视图（简化矩形 + 朝向箭头） */
  private drawHouse(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    orientation: number,
  ): void {
    const houseSize = radius * 0.25;

    ctx.save();
    ctx.translate(cx, cy);
    // 旋转：朝向角度以正北为0°顺时针，Canvas 以正东为0°逆时针
    ctx.rotate(((orientation) * Math.PI) / 180);

    // 绘制房屋矩形
    ctx.fillStyle = 'rgba(100, 140, 180, 0.6)';
    ctx.strokeStyle = '#456';
    ctx.lineWidth = 2;
    ctx.fillRect(-houseSize / 2, -houseSize / 2, houseSize, houseSize);
    ctx.strokeRect(-houseSize / 2, -houseSize / 2, houseSize, houseSize);

    // 绘制正面标记（朝向方向的一条红线）
    ctx.beginPath();
    ctx.moveTo(-houseSize / 2, -houseSize / 2);
    ctx.lineTo(houseSize / 2, -houseSize / 2);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 绘制朝向箭头
    ctx.beginPath();
    ctx.moveTo(0, -houseSize / 2);
    ctx.lineTo(0, -houseSize / 2 - 12);
    ctx.lineTo(-5, -houseSize / 2 - 6);
    ctx.moveTo(0, -houseSize / 2 - 12);
    ctx.lineTo(5, -houseSize / 2 - 6);
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  /** 绘制光照效果（从太阳方向到房屋的渐变光线） */
  private drawLighting(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    _orientation: number,
    sunPosition: SolarPosition,
  ): void {
    if (sunPosition.altitude <= 0) return; // 夜间不绘制

    const sunPoint = this.solarToCanvas(sunPosition, cx, cy, radius);

    // 光照强度基于高度角（越高越强）
    const intensity = Math.min(sunPosition.altitude / 90, 1);

    // 绘制从太阳到中心的光线渐变
    const gradient = ctx.createLinearGradient(sunPoint.x, sunPoint.y, cx, cy);
    gradient.addColorStop(0, `rgba(255, 223, 0, ${intensity * 0.4})`);
    gradient.addColorStop(1, `rgba(255, 223, 0, 0)`);

    ctx.beginPath();
    const spread = radius * 0.3;
    const angle = Math.atan2(cy - sunPoint.y, cx - sunPoint.x);
    ctx.moveTo(sunPoint.x, sunPoint.y);
    ctx.lineTo(
      cx + spread * Math.cos(angle + Math.PI / 2),
      cy + spread * Math.sin(angle + Math.PI / 2),
    );
    ctx.lineTo(
      cx + spread * Math.cos(angle - Math.PI / 2),
      cy + spread * Math.sin(angle - Math.PI / 2),
    );
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  /** 绘制当前太阳位置标记（黄色圆点） */
  private drawSunMarker(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    radius: number,
    position: SolarPosition,
  ): void {
    if (position.altitude <= 0) return; // 夜间不绘制

    const point = this.solarToCanvas(position, cx, cy, radius);

    // 外发光
    ctx.beginPath();
    ctx.arc(point.x, point.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
    ctx.fill();

    // 太阳圆点
    ctx.beginPath();
    ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.strokeStyle = '#FF8C00';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();
  }

  /**
   * 将太阳位置（方位角+高度角）映射到 Canvas 坐标
   * 方位角决定方向（正北为上），高度角决定距中心的距离（越低越远）
   */
  private solarToCanvas(
    position: SolarPosition,
    cx: number,
    cy: number,
    radius: number,
  ): { x: number; y: number } {
    // 方位角转弧度，正北为上（-90° 偏移使 0° 指向上方）
    const angleRad = ((position.azimuth - 90) * Math.PI) / 180;
    // 高度角映射距离：90° 在中心，0° 在边缘
    const dist = radius * (1 - position.altitude / 90);

    return {
      x: cx + dist * Math.cos(angleRad),
      y: cy + dist * Math.sin(angleRad),
    };
  }

  /** Canvas 上下文获取失败时显示降级提示 */
  private showDegradedMessage(): void {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    this.canvas.style.display = 'none';

    const msg = document.createElement('div');
    msg.className = 'canvas-degraded-message';
    msg.setAttribute('role', 'alert');
    msg.textContent = '您的浏览器不支持 Canvas 渲染，无法显示采光可视化。请升级浏览器后重试。';
    parent.appendChild(msg);
  }
}

/**
 * 初始化 Canvas 渲染器并连接到状态管理器
 * @param stateManager 应用状态管理器
 * @returns CanvasRenderer 实例，如果初始化失败返回 null
 */
export function initCanvasRenderer(stateManager: StateManager): CanvasRenderer | null {
  const canvas = document.getElementById('sunlight-canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    console.warn('未找到 #sunlight-canvas 元素');
    return null;
  }

  const renderer = new CanvasRenderer(canvas);
  if (renderer.isDegraded()) {
    return renderer;
  }

  // 渲染函数：根据当前状态计算太阳数据并渲染
  const doRender = (state: AppState): void => {
    const { dayOfYear } = SEASON_CONFIG[state.season];
    const solarPath = calculateDailySolarPath(TIANJIN_LAT, TIANJIN_LNG, dayOfYear);
    const currentPosition = calculateSolarPosition(
      TIANJIN_LAT,
      TIANJIN_LNG,
      dayOfYear,
      state.currentHour,
    );
    renderer.render(state, solarPath, currentPosition);
  };

  // 订阅状态变更
  stateManager.subscribe(doRender);

  // 绑定窗口 resize 事件
  window.addEventListener('resize', () => {
    renderer.resize();
    doRender(stateManager.getState());
  });

  // 初始渲染
  renderer.resize();
  doRender(stateManager.getState());

  return renderer;
}
