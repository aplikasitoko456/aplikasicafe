import React, { useState, useEffect } from 'react';
import { cn } from '../../lib/utils';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
}

export const CurrencyInput = ({ value, onChange, placeholder, className }: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    setDisplayValue(value === 0 ? '' : new Intl.NumberFormat('id-ID').format(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numericValue = parseInt(rawValue) || 0;
    onChange(numericValue);
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      className={cn(
        "border rounded px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none",
        className
      )}
    />
  );
};
