import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface TransactionFilterDropdownProps {
  value: string;
  onChange: (value: string) => void;
  pools: { id: string; name: string }[];
}

export function TransactionFilterDropdown({ value, onChange, pools }: TransactionFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    { id: 'all', label: 'All Transactions' },
    ...pools.map(pool => ({ id: pool.id, label: pool.name }))
  ];

  const selectedLabel = options.find(opt => opt.id === value)?.label || 'All Transactions';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all"
        style={{
          background: '#0055D6',
          border: 'none'
        }}
      >
        <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>{selectedLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: '#FFFFFF' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 py-2 z-50"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            border: '1px solid #EEF2F7'
          }}
        >
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                onChange(option.id);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left transition-all flex items-center justify-between hover:bg-opacity-50"
              style={{
                background: value === option.id ? '#EFF6FF' : 'transparent'
              }}
            >
              <span
                className="text-sm"
                style={{
                  color: value === option.id ? '#005AFF' : '#1A1A1A',
                  fontWeight: value === option.id ? '600' : '500'
                }}
              >
                {option.label}
              </span>
              {value === option.id && (
                <Check className="w-4 h-4" style={{ color: '#005AFF' }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
