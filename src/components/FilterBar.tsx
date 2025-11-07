import { useState, useRef, useEffect } from 'react';
import type { Position, Domain } from '../types/post';
import { POSITION_NAMES, DOMAIN_NAMES, POSITION_GROUPS } from '../types/post';
import './FilterBar.css';

interface FilterBarProps {
  selectedPositions: Position[];
  selectedDomains: Domain[];
  isActive: boolean;
  order: number;
  onPositionsChange: (positions: Position[]) => void;
  onDomainsChange: (domains: Domain[]) => void;
  onIsActiveChange: (isActive: boolean) => void;
  onOrderChange: (order: number) => void;
  onReset: () => void;
}

const FilterBar = ({
  selectedPositions,
  selectedDomains,
  isActive,
  order,
  onPositionsChange,
  onDomainsChange,
  onIsActiveChange,
  onOrderChange,
  onReset,
}: FilterBarProps) => {
  const [showPositionDropdown, setShowPositionDropdown] = useState(false);
  const [showDomainDropdown, setShowDomainDropdown] = useState(false);
  const positionRef = useRef<HTMLDivElement>(null);
  const domainRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (positionRef.current && !positionRef.current.contains(event.target as Node)) {
        setShowPositionDropdown(false);
      }
      if (domainRef.current && !domainRef.current.contains(event.target as Node)) {
        setShowDomainDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePositionToggle = (position: Position) => {
    if (selectedPositions.includes(position)) {
      onPositionsChange(selectedPositions.filter(p => p !== position));
    } else {
      onPositionsChange([...selectedPositions, position]);
    }
  };

  const handleDomainToggle = (domain: Domain) => {
    if (selectedDomains.includes(domain)) {
      onDomainsChange(selectedDomains.filter(d => d !== domain));
    } else {
      onDomainsChange([...selectedDomains, domain]);
    }
  };

  const handleGroupToggle = (groupName: string) => {
    const groupPositions = POSITION_GROUPS[groupName as keyof typeof POSITION_GROUPS];
    const allSelected = groupPositions.every(p => selectedPositions.includes(p));
    
    if (allSelected) {
      // Deselect all in group
      onPositionsChange(selectedPositions.filter(p => !groupPositions.includes(p)));
    } else {
      // Select all in group
      const newPositions = [...selectedPositions];
      groupPositions.forEach(p => {
        if (!newPositions.includes(p)) {
          newPositions.push(p);
        }
      });
      onPositionsChange(newPositions);
    }
  };

  return (
    <div className="filter-bar">
      {/* Position Filter */}
      <div className="filter-item" ref={positionRef}>
        <button
          className={`filter-button ${selectedPositions.length > 0 ? 'active' : ''}`}
          onClick={() => setShowPositionDropdown(!showPositionDropdown)}
        >
          직군 필터
        </button>
        {showPositionDropdown && (
          <div className="filter-dropdown">
            {Object.entries(POSITION_GROUPS).map(([groupName, positions]) => (
              <div key={groupName} className="filter-group">
                <label className="filter-group-label">
                  <input
                    type="checkbox"
                    checked={positions.every(p => selectedPositions.includes(p))}
                    onChange={() => handleGroupToggle(groupName)}
                  />
                  <span>{groupName}</span>
                </label>
                <div className="filter-group-items">
                  {positions.map(position => (
                    <label key={position} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedPositions.includes(position)}
                        onChange={() => handlePositionToggle(position)}
                      />
                      <span>{POSITION_NAMES[position]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Status Filter */}
      <button
        className={`filter-button ${isActive ? 'active' : ''}`}
        onClick={() => onIsActiveChange(!isActive)}
      >
        {isActive ? '모집중' : '모집상태'}
      </button>

      {/* Domain Filter */}
      <div className="filter-item" ref={domainRef}>
        <button
          className={`filter-button ${selectedDomains.length > 0 ? 'active' : ''}`}
          onClick={() => setShowDomainDropdown(!showDomainDropdown)}
        >
          업종
        </button>
        {showDomainDropdown && (
          <div className="filter-dropdown">
            {(Object.keys(DOMAIN_NAMES) as Domain[]).map(domain => (
              <label key={domain} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={selectedDomains.includes(domain)}
                  onChange={() => handleDomainToggle(domain)}
                />
                <span>{DOMAIN_NAMES[domain]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Order Filter */}
      <button
        className={`filter-button ${order !== 0 ? 'active' : ''}`}
        onClick={() => onOrderChange(order === 0 ? 1 : 0)}
      >
        {order === 0 ? '최신순' : '마감순'}
      </button>

      {/* Reset Button */}
      <button className="filter-button filter-reset" onClick={onReset}>
        초기화
      </button>
    </div>
  );
};

export default FilterBar;
