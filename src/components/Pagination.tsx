import { useSearchParams } from 'react-router-dom';

export default function Pagination({
  current,
  lastPage,
}: { current: number; lastPage: number }) {
  const [sp, setSp] = useSearchParams();
  const blockStart = Math.floor((current - 1) / 5) * 5 + 1;
  const blockEnd = Math.min(blockStart + 4, lastPage);
  const numbers = [];
  for (let p = blockStart; p <= blockEnd; p++) numbers.push(p);

  const go = (p: number) => {
    const next = new URLSearchParams(sp);
    next.set('page', String(p));
    setSp(next);
  };

  return (
    <div className="pagination">
      <button
        disabled={blockStart <= 1}
        onClick={() => go(Math.max(1, blockStart - 1))}
      >
        &laquo;
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => go(n)}
          className={n === current ? 'active' : undefined}
        >
          {n}
        </button>
      ))}
      <button disabled={blockEnd >= lastPage} onClick={() => go(blockEnd + 1)}>
        &raquo;
      </button>
    </div>
  );
}
