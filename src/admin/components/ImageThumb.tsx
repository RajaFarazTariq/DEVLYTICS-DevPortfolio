import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';

/** Image preview that falls back to the site path, then to a placeholder. */
export function ImageThumb({
  src,
  fallback,
  alt,
  background,
  className,
}: {
  src: string;
  fallback?: string;
  alt: string;
  background?: string;
  className?: string;
}) {
  const [current, setCurrent] = useState(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrent(src);
    setFailed(false);
  }, [src]);

  return (
    <div
      className={cn('relative grid place-items-center overflow-hidden bg-ink-950', className)}
      style={background ? { backgroundColor: background } : undefined}
    >
      {src && !failed ? (
        <img
          src={current}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => {
            if (fallback && current !== fallback) setCurrent(fallback);
            else setFailed(true);
          }}
        />
      ) : (
        <ImageOff className="h-6 w-6 text-ink-600" aria-label="No image" />
      )}
    </div>
  );
}
