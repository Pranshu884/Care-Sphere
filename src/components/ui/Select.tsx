import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export default function Select({ options, value, onChange, placeholder = 'Select...', className = '', disabled = false, required = false }: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(!isOpen);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      const currentIndex = options.findIndex(opt => String(opt.value) === String(value));
      let nextIndex = currentIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
      }
      onChange(String(options[nextIndex].value));
    }
  };

  const handleOptionClick = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Hidden native select for form submission/validation if needed */}
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required}
        disabled={disabled}
        className="sr-only"
        tabIndex={-1}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`w-full bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-2 text-sm flex items-center justify-between cursor-pointer transition-colors focus:outline-none focus:border-[#58d9b0] ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#58d9b0]/50'} ${isOpen ? 'border-[#58d9b0]' : ''}`}
      >
        <span className={`${!selectedOption ? 'text-gray-500' : 'text-[#e6edf3]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-[#161b22] border border-[#21262d] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.8)] overflow-hidden max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <ul className="py-1">
            {options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <li
                  key={opt.value}
                  onClick={() => handleOptionClick(String(opt.value))}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center justify-between transition-colors
                    ${isSelected 
                      ? 'bg-[#58d9b0]/10 text-[#58d9b0] font-medium' 
                      : 'text-[#e6edf3] hover:bg-[#1f2937] hover:text-white'
                    }`}
                >
                  {opt.label}
                  {isSelected && <Check className="w-4 h-4 text-[#58d9b0]" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
