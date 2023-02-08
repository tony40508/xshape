import type { Vector2d } from 'konva/lib/types';

export declare type Point = Vector2d;

export declare type Cursor = Point | { x: null; y: null };

export declare type FinishCond =
  | 'middle-click'
  | 'right-click'
  | 'alt+click'
  | 'ctrl+click'
  | 'meta+click'
  | 'shift+click';
