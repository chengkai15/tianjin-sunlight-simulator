import { describe, it, expect } from 'vitest';
import { pointerToAngle } from '../../src/ui/rotary-control';

describe('pointerToAngle', () => {
  const cx = 100;
  const cy = 100;

  it('should return 0° when pointer is directly above center (north)', () => {
    const angle = pointerToAngle(cx, cy, 100, 50);
    expect(angle).toBeCloseTo(0, 0);
  });

  it('should return 90° when pointer is to the right (east)', () => {
    const angle = pointerToAngle(cx, cy, 150, 100);
    expect(angle).toBeCloseTo(90, 0);
  });

  it('should return 180° when pointer is directly below center (south)', () => {
    const angle = pointerToAngle(cx, cy, 100, 150);
    expect(angle).toBeCloseTo(180, 0);
  });

  it('should return 270° when pointer is to the left (west)', () => {
    const angle = pointerToAngle(cx, cy, 50, 100);
    expect(angle).toBeCloseTo(270, 0);
  });

  it('should return ~45° for northeast diagonal', () => {
    const angle = pointerToAngle(cx, cy, 150, 50);
    expect(angle).toBeCloseTo(45, 0);
  });

  it('should return ~135° for southeast diagonal', () => {
    const angle = pointerToAngle(cx, cy, 150, 150);
    expect(angle).toBeCloseTo(135, 0);
  });

  it('should return ~225° for southwest diagonal', () => {
    const angle = pointerToAngle(cx, cy, 50, 150);
    expect(angle).toBeCloseTo(225, 0);
  });

  it('should return ~315° for northwest diagonal', () => {
    const angle = pointerToAngle(cx, cy, 50, 50);
    expect(angle).toBeCloseTo(315, 0);
  });

  it('should always return a value in [0, 360)', () => {
    // Test various positions around the circle
    for (let deg = 0; deg < 360; deg += 15) {
      const rad = (deg * Math.PI) / 180;
      const px = cx + 50 * Math.sin(rad);
      const py = cy - 50 * Math.cos(rad);
      const angle = pointerToAngle(cx, cy, px, py);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(360);
    }
  });
});
