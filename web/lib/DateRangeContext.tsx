import { createContext, useContext } from "react";

interface DateRangeContextType {
  startDate: string;
  endDate: string;
  setStartDate: (d: string) => void;
  setEndDate: (d: string) => void;
}

export const DateRangeContext = createContext<DateRangeContextType>({
  startDate: "",
  endDate: "",
  setStartDate: () => {},
  setEndDate: () => {},
});

export const useDateRange = () => useContext(DateRangeContext);

