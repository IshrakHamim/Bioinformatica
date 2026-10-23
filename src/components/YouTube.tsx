import { useState } from 'react';

/** Click-to-load YouTube embed (keeps pages light; uses the privacy-enhanced domain). */
export function YouTube({ id, title, channel }: { id: string; title: string; channel?: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="col" style={{ margin: '14px 0' }}>
      <div className="video">
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setOn(true)}
            aria-label={`Play ${title}`}
            style={{
              position: 'absolute', inset: 0, border: 0, cursor: 'pointer', padding: 0,
              background: `center / cover no-repeat url(https://i.ytimg.com/vi/${id}/hqdefault.jpg)`,
            }}
          >
            <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.25)' }}>
              <svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true">
                <path d="M66.5 7.7c-.8-2.9-3-5.2-5.9-6C55.3.3 34 .3 34 .3S12.7.3 7.4 1.7c-2.9.8-5.1 3.1-5.9 6C.1 13 .1 24 .1 24s0 11 1.4 16.3c.8 2.9 3 5.2 5.9 6C12.7 47.7 34 47.7 34 47.7s21.3 0 26.6-1.4c2.9-.8 5.1-3.1 5.9-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#f00" />
                <path d="M45 24 27 14v20" fill="#fff" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <div className="small">
        <b>{title}</b>
        {channel && <span className="muted"> · {channel}</span>}{' '}
        <a href={`https://www.youtube.com/watch?v=${id}`} target="_blank" rel="noopener noreferrer" className="tiny">open on YouTube ↗</a>
      </div>
    </div>
  );
}
