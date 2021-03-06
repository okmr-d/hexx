import { atom } from 'jotai';
import { atomFamily } from 'jotai/utils';
import { SetStateAction } from 'react';
import { BlockType, BlockComponent } from '../utils/blocks';
import { debounce } from '../utils/debounce';

export const _hexxScope = Symbol();

// editor id
export const editorIdAtom = atom('');
editorIdAtom.scope = _hexxScope;

export const editorWrapperAtom = atom<HTMLElement | null>(null);
editorWrapperAtom.scope = _hexxScope;

// TODO: put it to state
export const editorDefaultBlockAtom = atom<
  Pick<BlockType<any>, 'type' | 'data'>
>({
  type: 'paragraph',
  data: {
    text: '',
  },
});
editorDefaultBlockAtom.scope = _hexxScope;

// UI
type UIState = {
  isDragging: boolean;
  isSorting: boolean;
  sortingItemKey?: string;
  [x: string]: any;
};

export const uiStateAtom = atom<UIState>({
  isDragging: false,
  isSorting: false,
});

uiStateAtom.scope = _hexxScope;

export type ActiveBlock = {
  id: string;
  editable?: HTMLDivElement;
  blockEl: HTMLDivElement;
};

// active block id
export const activeBlockIdAtom = atom<ActiveBlock | null>(null);

activeBlockIdAtom.scope = _hexxScope;

export const isEditorSelectAllAtom = atom<boolean>(false);
isEditorSelectAllAtom.scope = _hexxScope;

export const blockSelectAtom = atom<Set<string>>(new Set<string>());

blockSelectAtom.scope = _hexxScope;

export const blockMapAtom = atom<
  Record<string, BlockComponent<any, any>>
>({});
blockMapAtom.scope = _hexxScope;

export const _blockIdListAtom = atom<string[]>([]);
_blockIdListAtom.scope = _hexxScope;
export const _blocksIdMapAtom = atom<Record<string, BlockType>>({});
_blocksIdMapAtom.scope = _hexxScope;

export const hoverBlockAtom = atom<{
  id: string;
  el: HTMLElement;
} | null>(null);
hoverBlockAtom.scope = _hexxScope;

export const dropBlockAtom = atom<string | null>(null);
dropBlockAtom.scope = _hexxScope;

export const isHoveringFamily = atomFamily(
  (id: string) => (get) => get(hoverBlockAtom)?.id === id,
  (id) => (
    get,
    set,
    arg: {
      id: string;
      el: HTMLElement;
    } | null,
  ) => {
    set(hoverBlockAtom, arg);
  },
);

// history
type EditorHistory = Array<{
  label: string;
  undo: () => void;
  redo: () => void;
}>;
export const history: EditorHistory = [];

export const undoHistory: EditorHistory = [];

export const undo = () => {
  const last = history.pop();
  if (last) {
    last.undo();
    undoHistory.push(last);
  }
};

export const redo = () => {
  const last = undoHistory.pop();
  if (last) {
    last.redo();
  }
};

const MAX_HISTORY_COUNT = 100;

function updateHistory(data) {
  history.push(data);
  if (history.length > MAX_HISTORY_COUNT) {
    history.shift();
  }
  canUpdate = true;
}

const debounceUpdateHistory = debounce(updateHistory, 200, false);
let firstOldValue: Record<string, any> | null = null;
let canUpdate = false;

export const blocksIdMapAtom = atom(
  (get) => get(_blocksIdMapAtom),
  (get, set, arg: SetStateAction<Record<string, any>>) => {
    const oldValue = get(_blocksIdMapAtom);
    if (canUpdate) {
      firstOldValue = oldValue;
      canUpdate = false;
    }
    if (!oldValue) {
      return;
    }
    set(_blocksIdMapAtom, arg);
    const newValue = get(_blocksIdMapAtom);
    const old = { ...firstOldValue };
    if (!firstOldValue) {
      return;
    }
    debounceUpdateHistory({
      label: `${JSON.stringify(old)} -> ${JSON.stringify(newValue)}`,
      undo: () => {
        set(_blocksIdMapAtom, old);
      },
      redo: () => {
        set(_blocksIdMapAtom, newValue);
      },
    });
  },
);
blocksIdMapAtom.scope = _hexxScope;

export const blockIdListAtom = atom(
  (get) => get(_blockIdListAtom),
  (get, set, arg: SetStateAction<string[]>) => {
    const oldValue = get(_blockIdListAtom);
    set(_blockIdListAtom, arg);
    const newValue = get(_blockIdListAtom);
    updateHistory({
      label: `${JSON.stringify(oldValue)} -> ${JSON.stringify(
        newValue,
      )}`,
      undo: () => {
        set(_blockIdListAtom, oldValue);
      },
      redo: () => {
        set(_blockIdListAtom, newValue);
      },
    });
  },
);

blockIdListAtom.scope = _hexxScope;

export const blockMapFamily = atomFamily<
  string,
  BlockType<unknown>,
  BlockType<unknown> | SetStateAction<Record<string, any>>
>(
  (id: string) => (get) => get(blocksIdMapAtom)[id],
  (id) => (get, set, arg) => {
    if (typeof arg === 'function') {
      set(blocksIdMapAtom, arg);
    } else {
      set(blocksIdMapAtom, (prev) => {
        return {
          ...prev,
          [id]: {
            ...prev[id],
            ...arg,
            data: {
              ...prev[id].data,
              ...arg.data,
            },
          },
        };
      });
    }
  },
);
