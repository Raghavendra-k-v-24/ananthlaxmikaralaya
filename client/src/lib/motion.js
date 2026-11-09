import { useEffect, useState } from "react";

// Strong ease-out (Emil Kowalski) for entrances, used everywhere on the page
export const EASE_OUT = [0.23, 1, 0.32, 1];
export const EASE_IN_OUT = [0.77, 0, 0.175, 1];

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}
