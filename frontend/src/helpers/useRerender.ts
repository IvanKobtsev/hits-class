import { useReducer } from 'react';

export function useRerender() {
  const [dependency, rerender] = useReducer((s) => s + 1, 0);

  return { rerender, dependency };
}
