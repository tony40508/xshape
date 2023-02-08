import type { Point } from './types';

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180.0;

/**
 * @see https://github.com/excalidraw/excalidraw/blob/0d1058a596145894b703fe3078b574f83bfbb312/src/math.ts#L7
 */
export const rotate = (x1: number, y1: number, x2: number, y2: number, degrees: number) => {
  const radians = degreesToRadians(degrees);
  return {
    x: (x1 - x2) * Math.cos(radians) - (y1 - y2) * Math.sin(radians) + x2,
    y: (x1 - x2) * Math.sin(radians) + (y1 - y2) * Math.cos(radians) + y2,
  };
};

/**
 * @see https://github.com/konvajs/konva/blob/master/src/shapes/Transformer.ts#L146
 */
export const getCenter = (x: number, y: number, radiusX: number, radiusY: number, degrees: number) => {
  const radians = degreesToRadians(degrees);
  return {
    x: x + radiusX * Math.cos(radians) + radiusY * Math.sin(-radians),
    y: y + radiusY * Math.cos(radians) + radiusX * Math.sin(radians),
  };
};

export const hypotenuse = (p1: Point, p2: Point) => Math.hypot(p1.x - p2.x, p1.y - p2.y);
