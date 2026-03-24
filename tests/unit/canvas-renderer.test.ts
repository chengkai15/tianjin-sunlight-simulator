/**
 * Canvas 渲染器单元测试
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CanvasRenderer } from '../../src/render/canvas-renderer';
import type { AppState, SolarPosition } from '../../src/types';

/** 创建模拟 CanvasRenderingContext2D */
function createMockCtx(): CanvasRenderingContext2D {
  const gradientMock = { addColorStop: vi.fn() };
  return {
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillText: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    setTransform: vi.fn(),
    setLineDash: vi.fn(),
    createLinearGradient: vi.fn(() => gradientMock),
    font: '',
    textAlign: '',
    textBaseline: '',
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  } as unknown as CanvasRenderingContext2D;
}

/** 创建模拟 Canvas 元素，挂载到 DOM 中 */
function createMockCanvas(options: { contextFails?: boolean; zeroSize?: boolean } = {}): HTMLCanvasElement {
  const container = document.createElement('div');
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  document.body.appendChild(container);

  // Mock getBoundingClientRect on the container
  const size = options.zeroSize ? 0 : 400;
  container.getBoundingClientRect = () => ({
    width: size, height: size,
    top: 0, left: 0, right: size, bottom: size, x: 0, y: 0,
    toJSON: () => ({}),
  });

  // Override getContext to return our mock or null
  const mockCtx = options.contextFails ? null : createMockCtx();
  canvas.getContext = vi.fn(() => mockCtx) as any;

  return canvas;
}

describe('CanvasRenderer', () => {
  const defaultState: AppState = {
    orientation: 180,
    season: 'summer',
    currentHour: 12,
  };

  const sampleSolarPath: SolarPosition[] = [
    { azimuth: 90, altitude: 10 },
    { azimuth: 135, altitude: 40 },
    { azimuth: 180, altitude: 60 },
    { azimuth: 225, altitude: 40 },
    { azimuth: 270, altitude: 10 },
  ];

  const currentPosition: SolarPosition = { azimuth: 180, altitude: 60 };

  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should initialize with a valid canvas context', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);

    expect(renderer.isDegraded()).toBe(false);
  });

  it('should enter degraded mode when context fails', () => {
    const canvas = createMockCanvas({ contextFails: true });
    const renderer = new CanvasRenderer(canvas);

    expect(renderer.isDegraded()).toBe(true);
  });

  it('should show degraded message when context fails', () => {
    const canvas = createMockCanvas({ contextFails: true });
    const renderer = new CanvasRenderer(canvas);

    expect(canvas.style.display).toBe('none');
    const msg = canvas.parentElement!.querySelector('.canvas-degraded-message');
    expect(msg).not.toBeNull();
    expect(msg!.getAttribute('role')).toBe('alert');
  });

  it('should return RenderContext when not degraded', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);
    const ctx = renderer.getRenderContext();

    expect(ctx).not.toBeNull();
    expect(ctx!.canvas).toBe(canvas);
    expect(ctx!.width).toBe(400);
    expect(ctx!.height).toBe(400);
  });

  it('should return null RenderContext when degraded', () => {
    const canvas = createMockCanvas({ contextFails: true });
    const renderer = new CanvasRenderer(canvas);

    expect(renderer.getRenderContext()).toBeNull();
  });

  it('should render without errors for daytime position', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.render(defaultState, sampleSolarPath, currentPosition);
    }).not.toThrow();
  });

  it('should render without errors for nighttime position', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);
    const nightPosition: SolarPosition = { azimuth: 0, altitude: -10 };

    expect(() => {
      renderer.render(defaultState, sampleSolarPath, nightPosition);
    }).not.toThrow();
  });

  it('should not throw when rendering in degraded mode', () => {
    const canvas = createMockCanvas({ contextFails: true });
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.render(defaultState, sampleSolarPath, currentPosition);
    }).not.toThrow();
  });

  it('should not throw when resizing in degraded mode', () => {
    const canvas = createMockCanvas({ contextFails: true });
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.resize();
    }).not.toThrow();
  });

  it('should handle empty solar path', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.render(defaultState, [], currentPosition);
    }).not.toThrow();
  });

  it('should handle single-point solar path', () => {
    const canvas = createMockCanvas();
    const renderer = new CanvasRenderer(canvas);

    expect(() => {
      renderer.render(defaultState, [{ azimuth: 180, altitude: 45 }], currentPosition);
    }).not.toThrow();
  });
});
