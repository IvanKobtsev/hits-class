export interface HotkeyOptions {
  preventDefault?: boolean;
  stopPropagation?: boolean;
  enabled?: boolean;
  target?: HTMLElement | null;
}

export interface KeyCombination {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  key: string;
}

export type HotkeyCallback = (event: KeyboardEvent) => void;

const keyMap: Record<string, string> = {
  ' ': 'space',
  Escape: 'escape',
  Enter: 'enter',
  Tab: 'tab',
  Backspace: 'backspace',
  Delete: 'delete',
  ArrowUp: 'arrowup',
  ArrowDown: 'arrowdown',
  ArrowLeft: 'arrowleft',
  ArrowRight: 'arrowright',
  Up: 'arrowup',
  Down: 'arrowdown',
  Left: 'arrowleft',
  Right: 'arrowright',
};

export const normalizeKey = (keyCode: string): string => {
  let normalized = keyCode.toLowerCase();

  if (keyCode.startsWith('Key')) {
    normalized = keyCode.charAt(3).toLowerCase();
  } else if (keyCode.startsWith('Digit')) {
    normalized = keyCode.slice(5);
  }

  return keyMap[keyCode] || keyMap[normalized] || normalized;
};

const parseHotkey = (hotkey: string) => {
  const keys = hotkey
    .toLowerCase()
    .split('+')
    .map((k) => k.trim());
  const modifiers = {
    ctrl: keys.includes('ctrl') || keys.includes('control'),
    alt: keys.includes('alt'),
    shift: keys.includes('shift'),
    meta:
      keys.includes('meta') || keys.includes('cmd') || keys.includes('command'),
  };

  const key = keys.find(
    (k) =>
      !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd', 'command'].includes(
        k,
      ),
  );

  return { modifiers, key: key || '' };
};

export const matchesHotkey = (
  event: KeyboardEvent,
  hotkey: string,
): boolean => {
  const { modifiers, key } = parseHotkey(hotkey);
  const eventKey = normalizeKey(event.code);

  return (
    modifiers.ctrl === event.ctrlKey &&
    modifiers.alt === event.altKey &&
    modifiers.shift === event.shiftKey &&
    modifiers.meta === event.metaKey &&
    normalizeKey(key) === eventKey
  );
};

export function parseKeyCombination(combination: string): KeyCombination {
  const parts = combination.toLowerCase().split('+');
  const result: KeyCombination = {
    key: '',
  };

  for (const part of parts) {
    if (part === 'ctrl') result.ctrlKey = true;
    else if (part === 'shift') result.shiftKey = true;
    else if (part === 'alt') result.altKey = true;
    else result.key = part.toLowerCase();
  }

  return result;
}

type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'meta' | 'cmd' | 'win';

type RegularKey =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z'
  | '0'
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | 'f1'
  | 'f2'
  | 'f3'
  | 'f4'
  | 'f5'
  | 'f6'
  | 'f7'
  | 'f8'
  | 'f9'
  | 'f10'
  | 'f11'
  | 'f12'
  | 'arrowup'
  | 'arrowdown'
  | 'arrowleft'
  | 'arrowright'
  | 'enter'
  | 'space'
  | 'tab'
  | 'escape'
  | 'backspace'
  | 'delete'
  | 'home'
  | 'end'
  | 'pageup'
  | 'pagedown'
  | 'insert'
  | '='
  | '-'
  | '['
  | ']'
  | '\\'
  | ';'
  | "'"
  | ','
  | '.'
  | '/'
  | '`';

type SingleKey = RegularKey;
type ModifierCombination = `${ModifierKey}+${RegularKey}`;
export type KeyboardShortcut = SingleKey | ModifierCombination;
