import { FC, memo } from 'react';
import { BoundingBox } from '../BoundingBox';
import { Context as RootContext, UseMachineSend as RootMachineSend } from './machine';

type Props = {
  annotations: RootContext['annotations'];
  selectedIndex: RootContext['selectedIndex'];
  isIdle: boolean;
  send: RootMachineSend;
};

const Annotations: FC<Props> = memo(({ annotations, send, selectedIndex, isIdle }) => {
  return (
    <>
      {annotations.map((annotation, index) => {
        if (annotation.type === 'boundingBox') {
          return (
            <BoundingBox
              key={annotation.id}
              annotation={annotation}
              isDraggable={index === selectedIndex && isIdle}
              isSelected={index === selectedIndex && isIdle}
              isListening
              onSelect={(e) =>
                send({ type: 'UPDATE.SELECTED.INDEX', selectedIndex: index, button: e.evt.button })
              }
              onChange={(points, rotation) => send({ type: 'UPDATE.SELECTED.POINTS', points, rotation })}
            />
          );
        }
        return null;
      })}
    </>
  );
});

export { Annotations };
