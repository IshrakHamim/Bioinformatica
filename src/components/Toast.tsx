import { useEffect, useState } from 'react';

let push: ((msg: string) => void) | null = null;

export function toast(msg: string) {
  push?.(msg);
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  useEffect(() => {
    let n = 0;
    push = (msg) => {
      const id = ++n;
      setItems((x) => [...x.slice(-2), { id, msg }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2200);
    };
    return () => {
      push = null;
    };
  }, []);
  return (
    <div aria-live="polite">
      {items.map((t, i) => (
        <div key={t.id} className="toast" style={{ bottom: 20 + i * 58 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
