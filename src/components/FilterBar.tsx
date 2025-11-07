import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const POSITIONS = [
  { label: '개발 전체', values: ['FRONT', 'APP', 'BACKEND', 'DATA', 'OTHERS'] },
  { label: 'FRONT', values: ['FRONT'] },
  { label: 'APP', values: ['APP'] },
  { label: 'BACKEND', values: ['BACKEND'] },
  { label: 'DATA', values: ['DATA'] },
  { label: '기타개발', values: ['OTHERS'] },
  { label: 'DESIGN', values: ['DESIGN'] },
  { label: 'PLANNER', values: ['PLANNER'] },
  { label: 'MARKETING', values: ['MARKETING'] },
];

const DOMAINS = [
  'FINTECH',
  'HEALTHTECH',
  'EDUCATION',
  'ECOMMERCE',
  'FOODTECH',
  'MOBILITY',
  'CONTENTS',
  'B2B',
  'OTHERS',
];

export default function FilterBar() {
  const [sp, setSp] = useSearchParams();
  const [openRoles, setOpenRoles] = useState(false);
  const [openDomains, setOpenDomains] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const roles = sp.getAll('roles');
  const domains = sp.getAll('domains');
  const isActive = sp.get('isActive') ?? 'false';
  const order = sp.get('order') ?? '0';

  const apply = (mutate: (next: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp);
    mutate(next);
    next.set('page', '1');
    setSp(next);
  };

  const toggleRole = (value: string) => {
    apply((next) => {
      const current = new Set(next.getAll('roles'));
      if (current.has(value)) current.delete(value);
      else current.add(value);
      next.delete('roles');
      Array.from(current).forEach((v) => next.append('roles', v));
    });
  };
  const toggleDomain = (value: string) => {
    apply((next) => {
      const current = new Set(next.getAll('domains'));
      if (current.has(value)) current.delete(value);
      else current.add(value);
      next.delete('domains');
      Array.from(current).forEach((v) => next.append('domains', v));
    });
  };
  const setStatus = (v: 'true' | 'false') =>
    apply((next) => next.set('isActive', v));
  const setOrder = (v: '0' | '1') => apply((next) => next.set('order', v));
  const resetAll = () => setSp(new URLSearchParams());

  return (
    <div className="filter-bar">
      {/* Roles trigger */}
      <div style={{ position: 'relative' }}>
        <button
          className="filter-trigger"
          onClick={() => setOpenRoles((o) => !o)}
        >
          직군 필터
        </button>
        {openRoles && (
          <div className="popover">
            <div className="popover-section-title">개발</div>
            <div className="checkbox-list">
              {POSITIONS.filter((p) => p.label !== '개발 전체').map((p) => (
                <label key={p.label}>
                  <input
                    type="checkbox"
                    checked={p.values.every((v) => roles.includes(v))}
                    onChange={() => p.values.forEach((v) => toggleRole(v))}
                  />
                  {p.label}
                </label>
              ))}
            </div>
            <div className="actions-row">
              <button
                className="btn-secondary"
                onClick={() => {
                  resetAll();
                  setOpenRoles(false);
                }}
              >
                초기화
              </button>
              <button
                className="btn-primary"
                onClick={() => setOpenRoles(false)}
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Status trigger */}
      <div style={{ position: 'relative' }}>
        <button
          className="filter-trigger"
          onClick={() => setOpenStatus((o) => !o)}
        >
          모집상태 ▾
        </button>
        {openStatus && (
          <div className="popover">
            <div className="checkbox-list">
              <label>
                <input
                  type="radio"
                  name="active"
                  checked={isActive === 'false'}
                  onChange={() => setStatus('false')}
                />{' '}
                전체
              </label>
              <label>
                <input
                  type="radio"
                  name="active"
                  checked={isActive === 'true'}
                  onChange={() => setStatus('true')}
                />{' '}
                모집중
              </label>
            </div>
            <div className="actions-row">
              <button
                className="btn-secondary"
                onClick={() => {
                  setStatus('false');
                  setOpenStatus(false);
                }}
              >
                초기화
              </button>
              <button
                className="btn-primary"
                onClick={() => setOpenStatus(false)}
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Domains trigger */}
      <div style={{ position: 'relative' }}>
        <button
          className="filter-trigger"
          onClick={() => setOpenDomains((o) => !o)}
        >
          업종 ▾
        </button>
        {openDomains && (
          <div className="popover">
            <div className="checkbox-list">
              {DOMAINS.map((d) => (
                <label key={d}>
                  <input
                    type="checkbox"
                    checked={domains.includes(d)}
                    onChange={() => toggleDomain(d)}
                  />{' '}
                  {d}
                </label>
              ))}
            </div>
            <div className="actions-row">
              <button
                className="btn-secondary"
                onClick={() => {
                  resetAll();
                  setOpenDomains(false);
                }}
              >
                초기화
              </button>
              <button
                className="btn-primary"
                onClick={() => setOpenDomains(false)}
              >
                적용
              </button>
            </div>
          </div>
        )}
      </div>
      {/* Order buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="filter-trigger"
          style={order === '0' ? { borderColor: 'var(--primary-600)' } : {}}
          onClick={() => setOrder('0')}
        >
          최신순
        </button>
        <button
          className="filter-trigger"
          style={order === '1' ? { borderColor: 'var(--primary-600)' } : {}}
          onClick={() => setOrder('1')}
        >
          마감순
        </button>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <button className="btn-secondary" onClick={resetAll}>
          전체 초기화
        </button>
      </div>
    </div>
  );
}
