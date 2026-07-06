import { useMemo } from "react";
import { useGetCategoriesQuery } from "./categoryAPI";

const normalize = (s: string) => s.trim().toLowerCase();

/**
 * Returns a lookup that maps a category name (default or custom) to its color
 * from the server Category list. Used so custom categories render with their
 * own color everywhere, just like the built-in ones.
 */
export function useCategoryColor() {
  const { data } = useGetCategoriesQuery();

  const colorByName = useMemo(() => {
    const map = new Map<string, string>();
    (data?.data ?? []).forEach((c) => {
      if (c.name && c.color) map.set(normalize(c.name), c.color);
    });
    return map;
  }, [data]);

  return (name?: string): string | undefined =>
    name ? colorByName.get(normalize(name)) : undefined;
}
