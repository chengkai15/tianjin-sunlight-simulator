import { describe, it, expect, vi } from 'vitest';
import { StateManager } from '../../src/state';

describe('StateManager', () => {
  it('should have correct default state', () => {
    const manager = new StateManager();
    const state = manager.getState();

    expect(state.orientation).toBe(180);
    expect(state.currentHour).toBe(12);
    expect(['spring', 'summer', 'autumn', 'winter']).toContain(state.season);
  });

  it('should return a copy of state (not a reference)', () => {
    const manager = new StateManager();
    const state1 = manager.getState();
    const state2 = manager.getState();

    expect(state1).toEqual(state2);
    expect(state1).not.toBe(state2);
  });

  describe('setOrientation', () => {
    it('should update orientation and normalize angle', () => {
      const manager = new StateManager();
      manager.setOrientation(90);
      expect(manager.getState().orientation).toBe(90);
    });

    it('should normalize negative angles', () => {
      const manager = new StateManager();
      manager.setOrientation(-10);
      expect(manager.getState().orientation).toBe(350);
    });

    it('should normalize angles >= 360', () => {
      const manager = new StateManager();
      manager.setOrientation(370);
      expect(manager.getState().orientation).toBe(10);
    });

    it('should notify listeners on change', () => {
      const manager = new StateManager();
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setOrientation(90);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ orientation: 90 }));
    });
  });

  describe('setSeason', () => {
    it('should update season', () => {
      const manager = new StateManager();
      manager.setSeason('winter');
      expect(manager.getState().season).toBe('winter');
    });

    it('should notify listeners on change', () => {
      const manager = new StateManager();
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setSeason('summer');
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ season: 'summer' }));
    });
  });

  describe('setCurrentHour', () => {
    it('should update current hour', () => {
      const manager = new StateManager();
      manager.setCurrentHour(8);
      expect(manager.getState().currentHour).toBe(8);
    });

    it('should notify listeners on change', () => {
      const manager = new StateManager();
      const listener = vi.fn();
      manager.subscribe(listener);

      manager.setCurrentHour(15);
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ currentHour: 15 }));
    });
  });

  describe('subscribe', () => {
    it('should support multiple listeners', () => {
      const manager = new StateManager();
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      manager.subscribe(listener1);
      manager.subscribe(listener2);
      manager.setOrientation(45);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });

    it('should return an unsubscribe function', () => {
      const manager = new StateManager();
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      manager.setOrientation(45);
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      manager.setOrientation(90);
      expect(listener).toHaveBeenCalledTimes(1); // not called again
    });

    it('should handle unsubscribe called multiple times', () => {
      const manager = new StateManager();
      const listener = vi.fn();
      const unsubscribe = manager.subscribe(listener);

      unsubscribe();
      unsubscribe(); // should not throw

      manager.setOrientation(90);
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('default season detection', () => {
    it('should detect spring for March-May', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 3, 15)); // April
      const manager = new StateManager();
      expect(manager.getState().season).toBe('spring');
      vi.useRealTimers();
    });

    it('should detect summer for June-August', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 6, 15)); // July
      const manager = new StateManager();
      expect(manager.getState().season).toBe('summer');
      vi.useRealTimers();
    });

    it('should detect autumn for September-November', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 9, 15)); // October
      const manager = new StateManager();
      expect(manager.getState().season).toBe('autumn');
      vi.useRealTimers();
    });

    it('should detect winter for December-February', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2024, 0, 15)); // January
      const manager = new StateManager();
      expect(manager.getState().season).toBe('winter');
      vi.useRealTimers();
    });
  });
});
