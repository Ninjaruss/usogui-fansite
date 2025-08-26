"use client";
import { useEffect } from 'react';
export default function InitJQ() {
  useEffect(() => {
    // Dynamically import jquery and expose globally for legacy libs
    import('jquery').then(($) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.jQuery = $;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        window.$ = $;
      }
    }).catch(() => {});
  }, []);
  return null;
}
