import { actions, assign, DoneInvokeEvent } from 'xstate';
import { fetcher } from '../../utils/fetcher';
import { Context as RootContext } from './machine';

const { choose } = actions;

type TData = {
  annotations: RootContext['annotations'];
};

export const fetchedSelectedIndex = -2;

export const fetchAnnotationsState = (url: string) => ({
  initial: 'loading',
  states: {
    loading: {
      invoke: {
        id: 'fetch-annotations',
        src: () => fetcher(url),
        onDone: {
          target: 'loaded',
          actions: [
            assign<RootContext, DoneInvokeEvent<TData>>({
              annotations: (context, event) => event.data.annotations || [],
              selectedIndex: fetchedSelectedIndex,
            }),
            choose<RootContext, DoneInvokeEvent<TData>>([
              {
                cond: (context) => context.annotations.length > 0,
                actions: ['snapshot'],
              },
            ]),
          ],
        },
        onError: {
          target: 'failure',
        },
      },
    },
    loaded: {
      type: 'final' as const,
    },
    failure: {
      on: {
        RETRY: 'loading',
      },
    },
  },
});
