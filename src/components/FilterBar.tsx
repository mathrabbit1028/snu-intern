import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const ROLE_GROUPS = [
  {
    title: '개발',
    roles: [
      { label: '전체', values: ['FRONT', 'BACKEND', 'APP', 'OTHERS'] },
      { label: '프론트엔드 개발', values: ['FRONT'] },
      { label: '서버 · 백엔드 개발', values: ['BACKEND'] },
      { label: '앱 개발', values: ['APP'] },
      { label: '기타 분야', values: ['OTHERS'] },
    ],
  },
  {
    title: '기획',
    roles: [{ label: '전체', values: ['PLANNER'] }],
  },
  {
    title: '디자인',
    roles: [{ label: '전체', values: ['DESIGN'] }],
  },
  {
    title: '마케팅',
    roles: [{ label: '전체', values: ['MARKETING'] }],
  },
];

const DOMAIN_LABELS: Record<string, string> = {
  FINTECH: '핀테크',
  HEALTHTECH: '헬스테크',
  EDUCATION: '교육',
  ECOMMERCE: '이커머스',
  FOODTECH: '푸드테크',
  MOBILITY: '모빌리티',
  CONTENTS: '컨텐츠',
  B2B: 'B2B',
  OTHERS: '기타',
};

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['개발'])
  );
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

  const toggleRoles = (values: string[]) => {
    apply((next) => {
      const current = new Set(next.getAll('roles'));
      const allSelected = values.every((v) => current.has(v));

      if (allSelected) {
        // 모두 선택되어 있으면 모두 해제
        values.forEach((v) => current.delete(v));
      } else {
        // 하나라도 선택되지 않았으면 모두 선택
        values.forEach((v) => current.add(v));
      }

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

  const toggleGroup = (title: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <div className="filter-bar-container">
      <div className="filter-bar">
        {/* Roles trigger */}
        <button
          className="filter-trigger"
          onClick={() => setOpenRoles((o) => !o)}
        >
          직군 필터 {openRoles ? '▲' : '▼'}
        </button>
        {/* Status trigger */}
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
        {/* Domains trigger */}
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
                  {DOMAIN_LABELS[d] || d}
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

      {/* Roles accordion content */}
      {openRoles && (
        <div className="filter-accordion-content">
          {ROLE_GROUPS.map((group) => (
            <div key={group.title} className="role-group">
              <h3 className="role-group-title">{group.title}</h3>
              <div className="role-group-items">
                {group.roles.map((role) => (
                  <label key={role.label} className="role-item">
                    <input
                      type="checkbox"
                      checked={role.values.every((v) => roles.includes(v))}
                      onChange={() => toggleRoles(role.values)}
                    />
                    {role.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
