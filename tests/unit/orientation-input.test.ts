/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/state';
import { initOrientationInput } from '../../src/ui/orientation-input';

/**
 * 为测试创建所需的 DOM 元素
 */
function setupDOM(): { input: HTMLInputElement; label: HTMLSpanElement } {
  // 清理
  document.getElementById('orientation-input')?.remove();
  document.getElementById('direction-label')?.remove();

  const input = document.createElement('input');
  input.id = 'orientation-input';
  input.type = 'number';
  input.min = '0';
  input.max = '360';
  input.step = '1';
  input.value = '180';
  document.body.appendChild(input);

  const label = document.createElement('span');
  label.id = 'direction-label';
  label.textContent = '南';
  document.body.appendChild(label);

  return { input, label };
}

describe('initOrientationInput', () => {
  let stateManager: StateManager;
  let input: HTMLInputElement;
  let label: HTMLSpanElement;

  beforeEach(() => {
    stateManager = new StateManager();
    const dom = setupDOM();
    input = dom.input;
    label = dom.label;
    initOrientationInput(stateManager);
  });

  it('should initialize input with current state orientation', () => {
    // Default orientation is 180 (南)
    expect(input.value).toBe('180');
    expect(label.textContent).toBe('南');
  });

  it('should update state when valid number is entered', () => {
    input.value = '90';
    input.dispatchEvent(new Event('change'));
    expect(stateManager.getState().orientation).toBe(90);
  });

  it('should normalize out-of-range values (e.g. 370 → 10)', () => {
    input.value = '370';
    input.dispatchEvent(new Event('change'));
    expect(stateManager.getState().orientation).toBeCloseTo(10, 5);
  });

  it('should normalize negative values (e.g. -10 → 350)', () => {
    input.value = '-10';
    input.dispatchEvent(new Event('change'));
    expect(stateManager.getState().orientation).toBeCloseTo(350, 5);
  });

  it('should restore previous value on empty input', () => {
    // Set a known state first
    stateManager.setOrientation(45);
    input.value = '';
    input.dispatchEvent(new Event('change'));
    // Should restore to 45
    expect(input.value).toBe('45');
    expect(stateManager.getState().orientation).toBe(45);
  });

  it('should restore previous value on non-numeric input', () => {
    stateManager.setOrientation(90);
    input.value = 'abc';
    input.dispatchEvent(new Event('change'));
    expect(input.value).toBe('90');
    expect(stateManager.getState().orientation).toBe(90);
  });

  it('should sync input when state changes externally', () => {
    stateManager.setOrientation(270);
    expect(input.value).toBe('270');
    expect(label.textContent).toBe('西');
  });

  it('should update direction label for all cardinal directions', () => {
    stateManager.setOrientation(0);
    expect(label.textContent).toBe('北');

    stateManager.setOrientation(90);
    expect(label.textContent).toBe('东');

    stateManager.setOrientation(180);
    expect(label.textContent).toBe('南');

    stateManager.setOrientation(270);
    expect(label.textContent).toBe('西');
  });

  it('should handle Infinity input as invalid', () => {
    stateManager.setOrientation(120);
    input.value = 'Infinity';
    input.dispatchEvent(new Event('change'));
    expect(input.value).toBe('120');
    expect(stateManager.getState().orientation).toBe(120);
  });
});
