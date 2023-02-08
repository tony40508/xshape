import {
  ActorRef,
  assign,
  BaseActionObject,
  createMachine,
  ResolveTypegenMeta,
  send,
  sendParent,
  ServiceMap,
  State as XState,
  TypegenDisabled,
} from 'xstate';
import { defaultColor } from '../../utils/constants';
import type { Point } from '../../utils/types';

export type Context = {
  points: Point[];
  color: string;
  texts: string[];
};

type Event =
  | { type: 'ADD.POINT'; point: Point; color: string; texts: string[]; isAdded: boolean; isFinished: boolean }
  | { type: 'RESET' };

type State =
  | {
      value: 'idle';
      context: Context;
    }
  | {
      value: 'creating';
      context: Context;
    };

export type ActorService = ActorRef<
  Event,
  XState<Context, Event, any, State, ResolveTypegenMeta<TypegenDisabled, Event, BaseActionObject, ServiceMap>>
>;

const type = 'boundingBox';

const initialContext: Context = {
  points: [],
  color: defaultColor,
  texts: [],
};

const boundingBoxMachine = createMachine<Context, Event, State>({
  id: type,
  predictableActionArguments: true,
  context: initialContext,
  initial: 'idle',
  states: {
    idle: {
      on: {
        'ADD.POINT': {
          target: 'creating',
          cond: (context, event) => event.isAdded && context.points.length === 0,
          actions: assign({
            points: (context, event) => {
              return context.points.concat(event.point);
            },
            color: (context, event) => event.color,
            texts: (context, event) => event.texts,
          }),
        },
      },
    },
    creating: {
      on: {
        'ADD.POINT': [
          {
            target: 'created',
            cond: (context, event) => event.isAdded && context.points.length === 1,
            actions: assign({
              points: (context, event) => {
                const p0 = context.points[0];
                const p3 = event.point;

                const rightLowerCorner = { x: Math.max(p0.x, p3.x), y: Math.max(p0.y, p3.y) };
                const leftUpperCorner = { x: Math.min(p0.x, p3.x), y: Math.min(p0.y, p3.y) };
                const rightUpperCorner = { x: rightLowerCorner.x, y: leftUpperCorner.y };
                const leftLowerCorner = { x: leftUpperCorner.x, y: rightLowerCorner.y };

                let newPoints = context.points.slice();
                newPoints = [leftUpperCorner, rightUpperCorner, rightLowerCorner, leftLowerCorner];

                return newPoints;
              },
            }),
          },
          {
            target: 'idle',
            cond: (context, event) => event.isFinished && context.points.length === 1,
            actions: send('RESET'),
          },
        ],
      },
    },
    created: {
      entry: [
        sendParent((context) => ({
          type: 'COMMIT.ANNOTATION',
          annotation: createBoundingBox(context),
        })),
        send('RESET'),
      ],
    },
  },
  on: {
    RESET: {
      target: 'idle',
      actions: assign({ ...initialContext }),
    },
  },
});

export { boundingBoxMachine };

function createBoundingBox({ points, color, texts }: Context) {
  return {
    id: crypto.randomUUID(),
    type,
    color,
    texts,
    points,
    rotation: 0,
  };
}

export type BoundingBoxAnnotation = ReturnType<typeof createBoundingBox>;
