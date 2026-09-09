'use client';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { CacheProvider } from '@emotion/react';
import { useState } from 'react';

export default function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const cache = createCache({ key: 'css', prepend: true });
    cache.compat = true;

    // Intercept inserts so we know which class names were added during this render
    const prevInsert = cache.insert.bind(cache);
    let inserted: string[] = [];

    cache.insert = (...args: Parameters<typeof prevInsert>) => {
      const serialized = args[1];
      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }
      return prevInsert(...args);
    };

    const flush = () => {
      const prev = inserted;
      inserted = [];
      return prev;
    };

    return { cache, flush };
  });

  // On the server: collect generated styles and push them into <head>
  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;

    let styles = '';
    for (const name of names) {
      const inserted = cache.inserted[name];
      if (inserted && typeof inserted === 'string') {
        styles += inserted;
      }
    }
    if (!styles) return null;

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
