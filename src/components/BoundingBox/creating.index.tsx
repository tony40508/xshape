import { useActor } from '@xstate/react';
import { FC } from 'react';
import { BoundingBox } from '.';
import { Cursor } from '../../utils/types';
import { ActorService } from './machine';

type Props = {
  service: ActorService;
  cursorX: Cursor['x'];
  cursorY: Cursor['y'];
};

const CreatingBoundingBox: FC<Props> = ({ service, cursorX, cursorY }) => {
  const [state, send] = useActor(service);

  return state.matches('creating') ? (
    <BoundingBox
      annotation={{
        id: 'creating',
        type: 'boundingBox',
        color: state.context.color,
        texts: state.context.texts,
        points: [
          {
            x: Math.min(state.context.points[0].x, cursorX ?? 0),
            y: Math.min(state.context.points[0].y, cursorY ?? 0),
          },
          {
            x: Math.max(state.context.points[0].x, cursorX ?? 0),
            y: Math.min(state.context.points[0].y, cursorY ?? 0),
          },
          {
            x: Math.max(state.context.points[0].x, cursorX ?? 0),
            y: Math.max(state.context.points[0].y, cursorY ?? 0),
          },
          {
            x: Math.min(state.context.points[0].x, cursorX ?? 0),
            y: Math.max(state.context.points[0].y, cursorY ?? 0),
          },
        ],
        rotation: 0,
      }}
      isDraggable={false}
      isSelected={false}
      isListening={false}
      onSelect={() => undefined}
      onChange={() => undefined}
    />
  ) : null;
};

export { CreatingBoundingBox };
