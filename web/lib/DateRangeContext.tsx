import { createContext, useContext } from 'react';

export interface DateRangeContextValue {
  start: string;
  end: string;
  setRange: (start: string, end: string) => void;
}

export const DateRangeContext = createContext<DateRangeContextValue>({
  start: '',
  end: '',
  setRange: () => {},
});

export function useDateRange() {
  return useContext(DateRangeContext);
}
