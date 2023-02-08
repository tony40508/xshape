import {
  actions,
  type ActorRef,
  assign,
  createMachine,
  send,
  type Sender,
  type State as XState,
  type ResolveTypegenMeta,
  type TypegenDisabled,
  type BaseActionObject,
  type ServiceMap,
} from 'xstate';
import { dequal } from 'dequal';
import type { Point } from '../../utils/types';
import { BoundingBoxAnnotation, boundingBoxMachine } from '../BoundingBox/machine';
import { fetchAnnotationsState, fetchedSelectedIndex } from './compoundStates';

const { choose } = actions;

export type Context = {
  annotations: BoundingBoxAnnotation[];
  selectedIndex: number;
  snapshots: Context['annotations'][];
  redo: Context['annotations'][];
};

type Event =
  | { type: 'CHANGE.TOOL.BBOX' }
  | { type: 'COMMIT.ANNOTATION'; annotation: Context['annotations'][number] }
  | { type: 'REMOVE.SELECTED.ANNOTATION' }
  | { type: 'ADD.POINT'; point: Point; color: string; texts: string[]; isAdded: boolean; isFinished: boolean }
  | { type: 'CHANGE.TOOL.IDLE' }
  | { type: 'UPDATE.SELECTED.INDEX'; selectedIndex: number; button: MouseEvent['button'] }
  | { type: 'UPDATE.SELECTED.POINTS'; points: Point[]; rotation: number }
  | { type: 'UPDATE.SELECTED.COLOR'; color: string }
  | { type: 'UPDATE.SELECTED.TEXTS'; texts: string[] }
  | {
      type: 'UPDATE.ANNOTATIONS';
      annotations: Context['annotations'];
      prevAnnotations: Context['annotations'];
    }
  | { type: 'SAVE'; callback: (context: Context) => Promise<void> }
  | { type: 'RESET'; callback: () => Promise<void> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RETRY' };

type State =
  | {
      value: 'initial' | { initial: 'loading' } | { initial: 'loaded' } | { initial: 'failure' };
      context: Context;
    }
  | { value: 'idle'; context: Context }
  | { value: 'boundingBox'; context: Context };

export type ActorService = ActorRef<Event>;

export type UseMachineSend = Sender<Event>;

export type UseMachineState = XState<
  Context,
  Event,
  any,
  State,
  ResolveTypegenMeta<TypegenDisabled, Event, BaseActionObject, ServiceMap>
>;

const initialContext: Context = {
  annotations: [],
  selectedIndex: -1,
  snapshots: [],
  redo: [],
};

const createRootMachine = (url = '') =>
  createMachine<Context, Event, State>(
    {
      id: 'root',
      predictableActionArguments: true,
      context: initialContext,
      initial: 'initial',
      states: {
        initial: {
          ...fetchAnnotationsState(url),
          always: [
            {
              target: 'idle',
              cond: (context) =>
                url.length === 0 ||
                context.annotations.length > 0 ||
                context.selectedIndex === fetchedSelectedIndex,
            },
          ],
        },
        idle: {
          on: {
            'CHANGE.TOOL.BBOX': {
              target: 'boundingBox',
            },
            'UPDATE.SELECTED.INDEX': {
              cond: (context, event) => event.button === 0 || event.button === 2,
              actions: assign({
                selectedIndex: (context, event) => event.selectedIndex,
              }),
            },
            'UPDATE.SELECTED.POINTS': {
              cond: (context) => Boolean(context.annotations[context.selectedIndex]),
              actions: [
                assign({
                  annotations: (context, event) => {
                    const clonedAnnotations: Context['annotations'] = structuredClone(context.annotations);
                    const selectedAnnotation = clonedAnnotations[context.selectedIndex];
                    if (selectedAnnotation) {
                      selectedAnnotation.points = event.points;
                      selectedAnnotation.rotation = event.rotation;
                    }
                    return clonedAnnotations;
                  },
                }),
                'snapshot',
              ],
            },
            'UPDATE.SELECTED.COLOR': {
              cond: (context) => Boolean(context.annotations[context.selectedIndex]),
              actions: [
                assign({
                  annotations: (context, event) => {
                    const clonedAnnotations: Context['annotations'] = structuredClone(context.annotations);
                    const selectedAnnotation = clonedAnnotations[context.selectedIndex];
                    if (selectedAnnotation) {
                      selectedAnnotation.color = event.color;
                    }
                    return clonedAnnotations;
                  },
                }),
                'snapshot',
              ],
            },
            'UPDATE.SELECTED.TEXTS': {
              cond: (context) => Boolean(context.annotations[context.selectedIndex]),
              actions: [
                assign({
                  annotations: (context, event) => {
                    const clonedAnnotations: Context['annotations'] = structuredClone(context.annotations);
                    const selectedAnnotation = clonedAnnotations[context.selectedIndex];
                    if (selectedAnnotation) {
                      selectedAnnotation.texts = event.texts;
                    }
                    return clonedAnnotations;
                  },
                }),
                'snapshot',
              ],
            },
            'REMOVE.SELECTED.ANNOTATION': {
              cond: (context) => Boolean(context.annotations[context.selectedIndex]),
              actions: [
                assign({
                  annotations: (context) => {
                    const selectedAnnotation = context.annotations[context.selectedIndex];
                    if (selectedAnnotation) {
                      return context.annotations.filter((_, i) => i !== context.selectedIndex);
                    }
                    return context.annotations;
                  },
                }),
                'snapshot',
                'resetSelectedIndex',
              ],
            },
            'UPDATE.ANNOTATIONS': {
              cond: (context, event) => Array.isArray(event.annotations),
              actions: [
                assign({
                  annotations: (context, event) => event.annotations,
                }),
                choose([
                  {
                    cond: (context, event) => !dequal(event.prevAnnotations, event.annotations),
                    actions: ['snapshot'],
                  },
                ]),
              ],
            },
          },
          exit: ['resetSelectedIndex'],
        },
        boundingBox: {
          invoke: {
            id: 'boundingBox',
            src: 'boundingBoxMachine',
          },
          on: {
            'COMMIT.ANNOTATION': {
              actions: [
                assign({
                  annotations: (context, event) => {
                    return context.annotations.concat(event.annotation);
                  },
                }),
                'snapshot',
              ],
            },
            'ADD.POINT': {
              actions: send((context, event) => ({ ...event, type: 'ADD.POINT' }), { to: 'boundingBox' }),
            },
          },
        },
      },
      on: {
        'CHANGE.TOOL.IDLE': {
          target: 'idle',
        },
        UNDO: {
          cond: (context) => context.snapshots.length > 0,
          actions: assign((context) => {
            const lastAnnotations = context.snapshots.pop();
            const newAnnotations = context.snapshots.at(-1) || [];

            const selectedId = context.annotations[context.selectedIndex]?.id;
            const newSelectedIndex = newAnnotations.findIndex(({ id }) => id === selectedId);

            return {
              annotations: newAnnotations,
              snapshots: [...context.snapshots],
              redo: lastAnnotations ? [...context.redo, lastAnnotations] : context.redo,
              selectedIndex: newSelectedIndex,
            };
          }),
        },
        REDO: {
          cond: (context) => context.redo.length > 0,
          actions: assign((context) => {
            const redoAnnotations = context.redo.pop();
            const newAnnotations = redoAnnotations || [];

            const selectedId = context.annotations[context.selectedIndex]?.id;
            const newSelectedIndex = newAnnotations.findIndex(({ id }) => id === selectedId);

            return {
              annotations: newAnnotations,
              snapshots: redoAnnotations ? [...context.snapshots, redoAnnotations] : context.snapshots,
              redo: [...context.redo],
              selectedIndex: newSelectedIndex,
            };
          }),
        },
        SAVE: {
          actions: async (context, event) => {
            await event.callback(context);
          },
        },
        RESET: {
          actions: [
            async (context, event) => {
              await event.callback();
            },
            assign({ ...initialContext }),
          ],
        },
      },
    },
    {
      actions: {
        snapshot: assign<Context, Event>({
          snapshots: (context) => {
            return [...context.snapshots, context.annotations];
          },
          redo: [],
        }),
        resetSelectedIndex: assign({
          selectedIndex: (context) => initialContext.selectedIndex,
        }),
      },
      services: {
        boundingBoxMachine,
      },
    },
  );

export { createRootMachine };
