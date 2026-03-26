export function naturalSortKey(filename: string): (string | number)[] {
  return filename.split(/([0-9]+)/).map((part) =>
    /^[0-9]+$/.test(part) ? parseInt(part, 10) : part.toLowerCase()
  );
}

export function naturalSort<T>(items: T[], keyFn: (item: T) => string): T[] {
  return [...items].sort((a, b) => {
    const ka = naturalSortKey(keyFn(a));
    const kb = naturalSortKey(keyFn(b));
    for (let i = 0; i < Math.min(ka.length, kb.length); i++) {
      const va = ka[i];
      const vb = kb[i];
      if (typeof va === "number" && typeof vb === "number") {
        if (va !== vb) return va - vb;
      } else {
        const sa = String(va);
        const sb = String(vb);
        if (sa !== sb) return sa < sb ? -1 : 1;
      }
    }
    return ka.length - kb.length;
  });
}
