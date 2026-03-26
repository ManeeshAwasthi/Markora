'use client';

import { useState, KeyboardEvent } from 'react';
import { C, T } from '@/lib/designTokens';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div style={{ display: 'flex', gap: '10px' }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={isLoading}
        placeholder="Search ticker or company (e.g. AAPL, Tesla)"
        style={{
          flex: 1,
          background: C.SURFACE,
          color: C.TEXT,
          border: `1px solid ${focused ? C.CYAN : C.BORDER}`,
          padding: '0 16px',
          height: '40px',
          fontFamily: T.MONO,
          fontSize: '12px',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          opacity: isLoading ? 0.6 : 1,
          cursor: isLoading ? 'not-allowed' : 'text',
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        style={{
          background: C.TEXT,
          color: C.BG,
          border: 'none',
          padding: '0 24px',
          height: '40px',
          fontFamily: T.MONO,
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.6 : 1,
          whiteSpace: 'nowrap',
          transition: 'opacity 0.15s ease',
        }}
      >
        {isLoading ? 'Analyzing…' : 'Analyze'}
      </button>
    </div>
  );
}
