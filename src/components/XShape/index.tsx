import {
  type FC,
  type MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type ChangeEvent,
} from 'react';
import { useMachine } from '@xstate/react';
import type Konva from 'konva';
import { Layer, Stage, type StageProps } from 'react-konva';
import type { Cursor, FinishCond } from '../../utils/types';
import { Annotations } from '../Annotations';
import { CreatingBoundingBox } from '../BoundingBox/creating.index';
import {
  createRootMachine,
  type UseMachineSend as RootMachineSend,
  type UseMachineState as RootMachineState,
} from '../Annotations/machine';
import { type KonvaEventObject } from 'konva/lib/Node';
import { defaultColor } from '../../utils/constants';
import { fetcher } from '../../utils/fetcher';

type Props = {
  stageWidth?: number;
  stageHeight?: number;
  stageRef: MutableRefObject<Konva.Stage | null>;
  handleMouseDown: StageProps['onMouseDown'];
  handleMouseMove: StageProps['onMouseMove'];
  handleContextMenu: StageProps['onContextMenu'];
  cursorX: Cursor['x'];
  cursorY: Cursor['y'];
  state: RootMachineState;
  send: RootMachineSend;
};

const XShapeStage: FC<PropsWithChildren<Props>> = ({
  stageWidth = window.innerWidth,
  stageHeight = window.innerHeight,
  stageRef,
  handleMouseDown,
  handleMouseMove,
  handleContextMenu,
  cursorX,
  cursorY,
  state,
  send,
  children,
}) => {
  const {
    context: { annotations, selectedIndex },
  } = state;

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
    >
      <Layer>
        {children}
        {state.matches('boundingBox') && (
          <CreatingBoundingBox service={state.children.boundingBox} cursorX={cursorX} cursorY={cursorY} />
        )}
        <Annotations
          annotations={annotations}
          selectedIndex={selectedIndex}
          send={send}
          isIdle={state.matches('idle')}
        />
      </Layer>
    </Stage>
  );
};

const localStorageKey = 'persisted-context';
const persistedContext = localStorage.getItem(localStorageKey);

const useXShape = (rootMachine: ReturnType<typeof createRootMachine>) => {
  const [color, setColor] = useState(defaultColor);
  const [texts, setTexts] = useState<string[]>([]);
  const [cursor, setCursor] = useState<Cursor>({ x: null, y: null });

  const stageRef = useRef<Konva.Stage | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [state, send] = useMachine(rootMachine, {
    context: persistedContext ? JSON.parse(persistedContext) : rootMachine.initialState.context,
  });

  const { context } = state;
  const { annotations, selectedIndex } = context;

  const resolvedState = rootMachine.resolveState(state);

  const handleMouseDown = useCallback(
    (e: KonvaEventObject<MouseEvent>, finishCond: FinishCond = 'right-click') => {
      const { x, y } = e.target?.getStage()?.getPointerPosition() ?? {};
      if (x === undefined || y === undefined) return;

      const { button, altKey, ctrlKey, metaKey, shiftKey } = e.evt;

      const isFinishedConds: Record<FinishCond, boolean> = {
        'middle-click': button === 1,
        'right-click': button === 2,
        'alt+click': altKey,
        'ctrl+click': ctrlKey,
        'meta+click': metaKey,
        'shift+click': shiftKey,
      };

      const isFinished = isFinishedConds[finishCond];

      send({
        type: 'ADD.POINT',
        point: { x, y },
        color,
        texts,
        isAdded: isFinished ? false : e.evt.button === 0,
        isFinished,
      });

      if (e.target === e.target.getStage()) {
        send({ type: 'UPDATE.SELECTED.INDEX', selectedIndex: -1, button });
      }

      const menuNode = menuRef.current;
      if (menuNode === null) return;
      menuNode.style.display = 'none';
    },
    [color, send, texts],
  );

  const handleMouseMove = useCallback(
    (e: KonvaEventObject<MouseEvent>) => {
      const { x, y } = e.target?.getStage()?.getPointerPosition() ?? {};
      if (x === undefined || y === undefined || state.matches('idle')) {
        return;
      }
      setCursor({ x, y });
    },
    [state],
  );

  const handleContextMenu = useCallback((e: KonvaEventObject<MouseEvent>) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    if (e.target === stage) return;

    const menuNode = menuRef.current;
    if (menuNode === null || stage === null) return;

    menuNode.style.display = 'initial';
    const containerRect = stage.container().getBoundingClientRect();

    const { x, y } = e.target?.getStage()?.getPointerPosition() ?? {};
    if (x === undefined || y === undefined) {
      return;
    }

    menuNode.style.top = containerRect.top + y + 4 + 'px';
    menuNode.style.left = containerRect.left + x + 4 + 'px';
  }, []);

  const handleDeleteMenu = useCallback(() => {
    const menuNode = menuRef.current;
    if (menuNode === null) return;
    menuNode.style.display = 'none';
    send('REMOVE.SELECTED.ANNOTATION');
  }, [send]);

  const updateAnnotations = useCallback(
    (newAnnotations: typeof annotations) => {
      send({
        type: 'UPDATE.ANNOTATIONS',
        annotations: newAnnotations,
        prevAnnotations: annotations,
      });
    },
    [annotations, send],
  );

  const fetchAnnotations = useCallback(
    async (url: string) => {
      const { annotations: fetchedAnnotations } = await fetcher(url);
      updateAnnotations(fetchedAnnotations);
    },
    [updateAnnotations],
  );

  const onChangeColor = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setColor(newColor);
      send({ type: 'UPDATE.SELECTED.COLOR', color: newColor });
    },
    [send],
  );

  const onChangeTexts = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newTexts = e.target.value.split(',');
      setTexts(newTexts);
      send({ type: 'UPDATE.SELECTED.TEXTS', texts: newTexts });
    },
    [send],
  );

  const selectedColor = annotations[selectedIndex]?.color;
  useEffect(() => {
    setColor((prevColor) => selectedColor || prevColor);
  }, [selectedColor]);

  const selectedTexts = annotations[selectedIndex]?.texts;
  useEffect(() => {
    setTexts((prevTexts) => selectedTexts || prevTexts);
  }, [selectedTexts]);

  const hasCreatingAnnotation = stageRef.current?.find(`.creating`)[0] !== undefined;

  const can = useMemo(
    () => ({
      undo: !hasCreatingAnnotation,
      redo: !hasCreatingAnnotation,
      save: !hasCreatingAnnotation,
      reset: !hasCreatingAnnotation,
      remove: resolvedState.can('REMOVE.SELECTED.ANNOTATION'),
      fetch: resolvedState.can({ type: 'UPDATE.ANNOTATIONS', annotations, prevAnnotations: annotations }),
      retry: resolvedState.can('RETRY'),
    }),
    [annotations, hasCreatingAnnotation, resolvedState],
  );

  const componentProps = useMemo(
    () => ({
      stageRef,
      handleMouseDown,
      handleMouseMove,
      handleContextMenu,
      cursorX: cursor.x,
      cursorY: cursor.y,
      state,
      send,
    }),
    [cursor.x, cursor.y, handleContextMenu, handleMouseDown, handleMouseMove, send, state],
  );

  return {
    menuRef,
    color,
    onChangeColor,
    texts,
    onChangeTexts,
    state,
    send,
    can,
    handleDeleteMenu,
    fetchAnnotations,
    componentProps,
    localStorageKey,
  };
};

export { XShapeStage, useXShape };
