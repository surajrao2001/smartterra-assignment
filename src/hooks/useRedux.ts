 import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../redux/store';

export function useRedux() {
  const dispatch = useDispatch<AppDispatch>();
  const typedUseSelector: TypedUseSelectorHook<RootState> = useSelector;
  return { dispatch, useSelector: typedUseSelector };
}
