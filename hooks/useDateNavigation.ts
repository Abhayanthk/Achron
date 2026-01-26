// hooks/useDateNavigator.ts
import { useCallback, useState } from "react";

export type Range = "week" | "month" | "year";

export function useDateNavigator(
  range: Range,
  initialDate: Date = new Date()
) {
  const [date, setDate] = useState<string>(initialDate.toISOString());

  const shift = useCallback(
    (dir: -1 | 1) => {
      setDate(prev => {
        const d = new Date(prev);

        if (range === "week") d.setDate(d.getDate() + 7 * dir);
        if (range === "month") d.setMonth(d.getMonth() + dir);
        if (range === "year") d.setFullYear(d.getFullYear() + dir);

        return d.toISOString();
      });
    },
    [range]
  );

  const goPrev = useCallback(() => shift(-1), [shift]);
  const goNext = useCallback(() => shift(1), [shift]);
  const goToday = useCallback(
    () => setDate(new Date().toISOString()),
    []
  );

  return { date, goPrev, goNext, goToday };
}
