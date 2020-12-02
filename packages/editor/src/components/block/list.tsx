import * as React from 'react';
import { List, listStyle } from '@elliot/renderer';
import { BackspaceKey } from '../../constants/key';
import { useBlock } from '../../hooks/use-editor';
import { css, styled } from '@elliot/theme';
import {
  findContentEditable,
  lastCursor,
} from '../../utils/find-blocks';
import { extractFragmentFromPosition } from '../../utils/ranges';
import { Editable } from '../editable';
import { list as ListSvg } from '../icons';
import { BlockProps } from './block';

const Ul = styled('ul', listStyle.ul);
const Ol = styled('ol', listStyle.ol);

export function ListBlock({ index, block, config }: BlockProps) {
  const ref = React.useRef<HTMLElement>(null);
  const [
    activeListItemIndex,
    setActiveListItemIndex,
  ] = React.useState<number>(0);

  const { update } = useBlock(block.id, index);

  let listItems = React.Children.toArray(
    block.data.items.map((item, i) => (
      <ListItem
        index={i}
        blockId={block.id}
        blockIndex={index}
        placeholder={config.placeholder}
        onFocus={() => setActiveListItemIndex(i)}
        onEmpty={() => {
          const items = removeItemAtIndex(block.data.items, i);
          update({
            ...block.data,
            items,
          });
        }}
        onChange={(value) => {
          let items = block.data.items;
          items = replaceItemAtIndex(block.data.items, i, value);
          update({
            ...block.data,
            items,
          });
        }}
        data={item}
      />
    )),
  );
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!e.shiftKey && e.key === 'Enter') {
      if (!!block.data.items[activeListItemIndex]) {
        const fragments = extractFragmentFromPosition();
        if (!fragments) return;
        const { current, next } = fragments;
        let items = block.data.items;
        items = replaceItemAtIndex(
          items,
          activeListItemIndex,
          current,
        );
        items = insertItemAtIndex(
          items,
          activeListItemIndex + 1,
          next,
        );
        update({
          ...block.data,
          items,
        });
        e.stopPropagation();
        e.preventDefault();
      }
    } else if (e.key === BackspaceKey) {
      if (!block.data.items[activeListItemIndex]) {
        update({
          ...block.data,
          items: removeItemAtIndex(
            block.data.items,
            activeListItemIndex,
          ),
        });
      }
    }
  };

  React.useEffect(() => {
    requestAnimationFrame(() => {
      // @ts-ignore
      findContentEditable(ref.current)?.focus();
      lastCursor();
    });
  }, [block.data.items.length]);

  return (
    <Ul
      onKeyDown={handleKeyDown}
      ref={ref as any}
      css={{
        listStyle:
          block.data.style === 'unordered' ? 'disc' : 'decimal',
      }}
      as={block.data.style === 'unordered' ? Ul : Ol}
    >
      {listItems}
    </Ul>
  );
}

function ListItem(props: {
  data: string;
  onChange: (value: string) => void;
  onEmpty: () => void;
  onFocus: () => void;
  placeholder?: string;
  index: number;
  blockId: string;
  blockIndex: number;
}) {
  const { registerWithIndex } = useBlock(
    props.blockId,
    props.blockIndex,
  );
  return (
    <li className={css(listStyle.item)}>
      <Editable
        ref={registerWithIndex(props.index)}
        placeholder={props.placeholder}
        onFocus={props.onFocus}
        onChange={(e) => {
          props.onChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === BackspaceKey && props.data === '') {
            props.onEmpty();
          }
        }}
        html={props.data}
      />
    </li>
  );
}

ListBlock.block = {
  type: 'list',
  icon: {
    text: 'List',
    svg: ListSvg,
  },
  config: {
    placeholder: 'list',
  },
  defaultValue: {
    items: [''],
    style: 'unordered',
  },
  tune: [
    {
      icon: {
        text: 'Bullet',
        svg: ListSvg,
        isActive: (data) => data.style === 'unordered',
      },
      updater: (data) => ({ ...data, style: 'unordered' }),
    },
    {
      icon: {
        text: 'Number',
        svg: ListSvg,
        isActive: (data) => data.style === 'ordered',
      },
      updater: (data) => ({ ...data, style: 'ordered' }),
    },
  ],
  isEmpty: (data) => data.items.length === 0,
};

function insertItemAtIndex(arr, index, newValue) {
  return [...arr.slice(0, index), newValue, ...arr.slice(index)];
}

function replaceItemAtIndex(arr, index, newValue) {
  return [...arr.slice(0, index), newValue, ...arr.slice(index + 1)];
}
function removeItemAtIndex(arr, index) {
  return [...arr.slice(0, index), ...arr.slice(index + 1)];
}
