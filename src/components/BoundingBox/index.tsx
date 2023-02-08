import Konva from 'konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { FC, useEffect, useMemo, useRef } from 'react';
import { Line, Rect, Transformer, Text } from 'react-konva';
import { hypotenuse } from '../../utils/math';
import type { Point } from '../../utils/types';
import type { BoundingBoxAnnotation } from './machine';
import { getRotatedRect } from './utils';

type Props = {
  annotation: BoundingBoxAnnotation;
  isDraggable: boolean;
  isSelected: boolean;
  isListening: boolean;
  isDebug?: boolean;
  onSelect: (e: KonvaEventObject<MouseEvent>) => void;
  onChange: (points: Point[], rotation: number) => void;
};

const BoundingBox: FC<Props> = ({
  annotation,
  isDraggable,
  isSelected,
  isListening,
  isDebug = false,
  onSelect,
  onChange,
}) => {
  const rectRef = useRef<Konva.Rect | null>(null);
  const trRef = useRef<Konva.Transformer | null>(null);

  useEffect(() => {
    if (isSelected && trRef.current && rectRef.current) {
      trRef.current.nodes([rectRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const [p0, p1, p2] = annotation.points;
  const width = hypotenuse(p1, p0);
  const height = hypotenuse(p2, p1);

  const rightTopPoint = useMemo(
    () =>
      annotation.points.reduce((pointA, pointB) => {
        if (pointA.x > pointB.x) return pointA;
        if (pointA.x === pointB.x && pointA.y < pointB.y) return pointA;
        return pointB;
      }),
    [annotation.points],
  );

  return (
    <>
      <Rect
        name={annotation.id}
        ref={rectRef}
        x={p0.x}
        y={p0.y}
        width={width}
        height={height}
        rotation={annotation.rotation}
        draggable={isDraggable}
        listening={isListening}
        stroke={annotation.color}
        onClick={onSelect}
        onDragEnd={() => {
          const rectNode = rectRef.current;
          if (rectNode === null) return;

          const { points, rotation } = getRotatedRect(rectNode);
          onChange(points, rotation);
        }}
        onTransformEnd={() => {
          const rectNode = rectRef.current;
          if (rectNode === null) return;

          const { points, rotation } = getRotatedRect(rectNode);
          onChange(points, rotation);

          // Reset scales back
          rectNode.scaleX(1);
          rectNode.scaleY(1);
        }}
      />
      {isSelected && <Transformer ref={trRef} />}
      <Text
        x={rightTopPoint.x + 5}
        y={rightTopPoint.y}
        text={annotation.texts.join('\n')}
        fill={annotation.color}
        fontSize={17}
        visible={annotation.texts.length > 0}
      />
      {isDebug && (
        <Line
          name="debug"
          points={annotation.points.flatMap(({ x, y }) => [x, y])}
          closed
          stroke="red"
          listening={false}
        />
      )}
    </>
  );
};

export { BoundingBox };
