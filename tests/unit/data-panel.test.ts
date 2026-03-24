/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/state';
import { initDataPanel } from '../../src/ui/data-panel';
import { getSunlightData } from '../../src/calc/sunlight';

/** 创建数据面板所需的 DOM 元素 */
function setupDOM() {
  document.body.innerHTML = `
    <dl class="data-list">
      <div class="data-item">
        <dt>总日照时长</dt>
        <dd id="data-total-daylight">--</dd>
      </div>
      <div class="data-item">
        <dt>有效采光时长</dt>
        <dd id="data-effective-sunlight">--</dd>
      </div>
      <div class="data-item">
        <dt>太阳方位角</dt>
        <dd id="data-azimuth">--</dd>
      </div>
      <div class="data-item">
        <dt>太阳高度角</dt>
        <dd id="data-altitude">--</dd>
      </div>
    </dl>
  `;
}

describe('initDataPanel', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
    setupDOM();
    initDataPanel(stateManager);
  });

  it('should populate data on initialization', () => {
    const state = stateManager.getState();
    const data = getSunlightData(state.season, state.orientation, state.currentHour);

    expect(document.getElementById('data-total-daylight')!.textContent).toBe(`${data.totalDaylight.toFixed(1)} 小时`);
    expect(document.getElementById('data-effective-sunlight')!.textContent).toBe(`${data.effectiveSunlight.toFixed(1)} 小时`);
    expect(document.getElementById('data-azimuth')!.textContent).toBe(`${data.currentAzimuth.toFixed(1)}°`);
    expect(document.getElementById('data-altitude')!.textContent).toBe(`${data.currentAltitude.toFixed(1)}°`);
  });

  it('should update data when season changes', () => {
    stateManager.setSeason('winter');
    const state = stateManager.getState();
    const data = getSunlightData(state.season, state.orientation, state.currentHour);

    expect(document.getElementById('data-total-daylight')!.textContent).toBe(`${data.totalDaylight.toFixed(1)} 小时`);
    expect(document.getElementById('data-effective-sunlight')!.textContent).toBe(`${data.effectiveSunlight.toFixed(1)} 小时`);
  });

  it('should update data when orientation changes', () => {
    stateManager.setOrientation(90); // 朝东
    const state = stateManager.getState();
    const data = getSunlightData(state.season, state.orientation, state.currentHour);

    expect(document.getElementById('data-effective-sunlight')!.textContent).toBe(`${data.effectiveSunlight.toFixed(1)} 小时`);
    expect(document.getElementById('data-azimuth')!.textContent).toBe(`${data.currentAzimuth.toFixed(1)}°`);
  });

  it('should update data when currentHour changes', () => {
    stateManager.setCurrentHour(8);
    const state = stateManager.getState();
    const data = getSunlightData(state.season, state.orientation, state.currentHour);

    expect(document.getElementById('data-azimuth')!.textContent).toBe(`${data.currentAzimuth.toFixed(1)}°`);
    expect(document.getElementById('data-altitude')!.textContent).toBe(`${data.currentAltitude.toFixed(1)}°`);
  });

  it('should format values with correct units', () => {
    const totalDaylight = document.getElementById('data-total-daylight')!.textContent!;
    const effectiveSunlight = document.getElementById('data-effective-sunlight')!.textContent!;
    const azimuth = document.getElementById('data-azimuth')!.textContent!;
    const altitude = document.getElementById('data-altitude')!.textContent!;

    expect(totalDaylight).toMatch(/^\d+\.\d 小时$/);
    expect(effectiveSunlight).toMatch(/^\d+\.\d 小时$/);
    expect(azimuth).toMatch(/^-?\d+\.\d°$/);
    expect(altitude).toMatch(/^-?\d+\.\d°$/);
  });

  it('should not crash when DOM elements are missing', () => {
    document.body.innerHTML = '';
    const sm = new StateManager();
    expect(() => initDataPanel(sm)).not.toThrow();
  });
});
