'use client';

import { useState, KeyboardEvent } from 'react';

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
          background: '#1a1a1a',
          color: '#ffffff',
          border: `1px solid ${focused ? '#00ff88' : '#333333'}`,
          borderRadius: '6px',
          padding: '12px 16px',
          fontSize: '0.95rem',
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
          background: '#000000',
          color: '#00ff88',
          border: '1px solid #00ff88',
          borderRadius: '6px',
          padding: '12px 24px',
          fontSize: '0.9rem',
          fontWeight: 600,
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
