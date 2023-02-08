import { Rect } from 'konva/lib/shapes/Rect';
import { getCenter, rotate } from '../../utils/math';

export const getRotatedRect = (rectNode: Rect) => {
  const scaleX = rectNode.scaleX();
  const scaleY = rectNode.scaleY();

  const newWidth = rectNode.width() * scaleX;
  const newHeight = rectNode.height() * scaleY;

  const rx = newWidth / 2;
  const ry = newHeight / 2;

  const newX = rectNode.x();
  const newY = rectNode.y();
  const p0 = { x: newX, y: newY };

  const rotation = rectNode.rotation();
  const { x: cx, y: cy } = getCenter(p0.x, p0.y, rx, ry, rotation);

  return {
    points: [
      p0,
      rotate(cx + rx, cy - ry, cx, cy, rotation),
      rotate(cx + rx, cy + ry, cx, cy, rotation),
      rotate(cx - rx, cy + ry, cx, cy, rotation),
    ],
    rotation,
  };
};
