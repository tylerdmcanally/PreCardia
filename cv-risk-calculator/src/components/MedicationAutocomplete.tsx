import { useState, useRef, useEffect } from 'react';
import { MEDICATION_SEARCH_LIST } from '../data/medications';

interface MedicationAutocompleteProps {
  value: string;
  onSelect: (medication: { name: string; dose: string; category: string }) => void;
  placeholder?: string;
}

export function MedicationAutocomplete({ value, onSelect, placeholder }: MedicationAutocompleteProps) {
  const [searchTerm, setSearchTerm] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredMeds = searchTerm.length > 0
    ? MEDICATION_SEARCH_LIST.filter((med) =>
        med.label.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 10) // Show max 10 suggestions
    : [];

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (med: typeof MEDICATION_SEARCH_LIST[0]) => {
    onSelect({
      name: med.genericName,
      dose: med.dose,
      category: med.category,
    });
    setSearchTerm(med.label);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredMeds.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(filteredMeds[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setShowSuggestions(true);
          setSelectedIndex(-1);
        }}
        onFocus={() => {
          if (searchTerm.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Start typing medication name...'}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {showSuggestions && filteredMeds.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredMeds.map((med, index) => (
            <button
              key={`${med.value}-${index}`}
              type="button"
              onClick={() => handleSelect(med)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer ${
                index === selectedIndex ? 'bg-blue-100' : ''
              }`}
            >
              <div className="font-medium text-gray-900">{med.label}</div>
              <div className="text-xs text-gray-500">{med.category}</div>
            </button>
          ))}
        </div>
      )}

      {showSuggestions && searchTerm.length > 0 && filteredMeds.length === 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3"
        >
          <p className="text-sm text-gray-500">No medications found</p>
        </div>
      )}
    </div>
  );
}
