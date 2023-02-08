import { Context as RootContext } from './components/Annotations/machine';
import { URLImage } from './components/URLImage';
import { useXShape, XShapeStage } from './components/XShape';
// import { useXShape, XShapeStage, URLImage, type RootContext } from 'xshape';

function App() {
  const {
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
  } = useXShape();

  const customSave = async (_context: RootContext) => {
    return new Promise<void>((res) => {
      localStorage.setItem(localStorageKey, JSON.stringify(_context));
      res();
    });
  };

  const customReset = async () => {
    return new Promise<void>((res) => {
      localStorage.removeItem(localStorageKey);
      res(undefined);
    });
  };

  return (
    <>
      <div id="panel">
        <button type="button" id="undo" onClick={() => send('UNDO')} disabled={!can.undo}>
          Undo
        </button>
        <button type="button" id="redo" onClick={() => send('REDO')} disabled={!can.redo}>
          Redo
        </button>
        <button
          type="button"
          id="save"
          onClick={() => send({ type: 'SAVE', callback: customSave })}
          disabled={!can.save}
        >
          Save
        </button>
        <button
          type="reset"
          id="reset"
          onClick={() => send({ type: 'RESET', callback: customReset })}
          disabled={!can.reset}
        >
          Reset
        </button>
        <button
          type="button"
          id="remove"
          onClick={() => send('REMOVE.SELECTED.ANNOTATION')}
          disabled={!can.remove}
        >
          Remove
        </button>
        <button
          type="button"
          id="fetch"
          onClick={() => fetchAnnotations('/mockAnnotations.json')}
          disabled={!can.fetch}
        >
          Fetch
        </button>
        <button
          type="button"
          id="bbox"
          onClick={() => (state.matches('boundingBox') ? send('CHANGE.TOOL.IDLE') : send('CHANGE.TOOL.BBOX'))}
        >
          {state.matches('boundingBox') ? 'B-Boxing' : 'B-Box'}
        </button>
        <input type="color" value={color} onChange={onChangeColor} />
        <input type="text" value={texts} onChange={onChangeTexts} />
      </div>
      <dialog open={can.retry}>
        <p>Initial fetch failed</p>
        <button onClick={() => send('RETRY')}>Retry</button>
        <button onClick={() => send('CHANGE.TOOL.IDLE')}>Cancel</button>
      </dialog>
      <div id="menu" ref={menuRef}>
        <button onClick={handleDeleteMenu}>Delete</button>
      </div>
      <XShapeStage {...componentProps}>
        <URLImage url="https://konvajs.org/assets/lion.png" />
      </XShapeStage>
    </>
  );
}

export default App;
