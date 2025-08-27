import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function SearchableDropdown({
  items = [],
  selectedItem,
  onItemSelect,
  searchTerm,
  onSearchChange,
  placeholder = 'Search...',
  loadingPlaceholder = 'Loading...',
  isLoading = false,
  disabled = false,
  renderItem,
  noResultsText = 'No items found',
  noItemsText = 'No items available',
  className = '',
  dropdownClassName = '',
  itemClassName = '',
  getItemKey = (item, index) => item.key || item.id || item.name || index,
  filterItems,
  onKeyDown,
  selectedIndex = -1,
  onSelectedIndexChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  // Default filter function if none provided
  const defaultFilterItems = (items, searchTerm) => {
    if (!searchTerm) return items;
    return items.filter(item => {
      if (typeof item === 'string') {
        return item.toLowerCase().includes(searchTerm.toLowerCase());
      }
      if (item.name) {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (item.region && item.region.toLowerCase().includes(searchTerm.toLowerCase()));
      }
      return false;
    });
  };

  // Use internal search term when dropdown is open, otherwise show selected item
  const displayTerm = isOpen ? internalSearchTerm : (selectedItem || '');
  const filteredItems = filterItems ? filterItems(items, isOpen ? internalSearchTerm : '') : defaultFilterItems(items, isOpen ? internalSearchTerm : '');

  // Default render function if none provided
  const defaultRenderItem = (item) => {
    if (typeof item === 'string') return item;
    return item.name || item.label || String(item);
  };

  const renderItemContent = renderItem || defaultRenderItem;

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          dropdownMenuRef.current && !dropdownMenuRef.current.contains(event.target)) {
        setIsOpen(false);
        if (onSelectedIndexChange) onSelectedIndexChange(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onSelectedIndexChange, isOpen]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInternalSearchTerm(value);
    if (onSearchChange) onSearchChange(value);
    setIsOpen(true);
    if (onSelectedIndexChange) onSelectedIndexChange(-1);
  };

  const updateDropdownPosition = () => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  const handleInputFocus = () => {
    setInternalSearchTerm('');
    updateDropdownPosition();
    setIsOpen(true);
    if (onSelectedIndexChange) onSelectedIndexChange(-1);
  };

  const handleItemClick = (item) => {
    if (disabled || isLoading) return;
    onItemSelect(item);
    setInternalSearchTerm('');
    setIsOpen(false);
    if (onSelectedIndexChange) onSelectedIndexChange(-1);
  };

  const handleInputKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e, filteredItems, selectedIndex, handleItemClick);
    }

    // Handle ESC key
    if (e.key === 'Escape') {
      setInternalSearchTerm('');
      setIsOpen(false);
      if (onSelectedIndexChange) onSelectedIndexChange(-1);
    }
  };

  // Reset internal search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setInternalSearchTerm('');
    }
  }, [isOpen]);

  // Update dropdown position on scroll and resize
  useEffect(() => {
    if (!isOpen) return;

    const handlePositionUpdate = () => {
      updateDropdownPosition();
    };

    window.addEventListener('scroll', handlePositionUpdate, true);
    window.addEventListener('resize', handlePositionUpdate);

    return () => {
      window.removeEventListener('scroll', handlePositionUpdate, true);
      window.removeEventListener('resize', handlePositionUpdate);
    };
  }, [isOpen]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <input
        ref={inputRef}
        type="text"
        value={displayTerm}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        placeholder={isLoading ? loadingPlaceholder : placeholder}
        className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        autoComplete="off"
      />

      {/* Dropdown arrow */}
      <div
        className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
        onClick={() => {
          if (isOpen) {
            setInternalSearchTerm('');
            setIsOpen(false);
          } else {
            updateDropdownPosition();
            handleInputFocus();
          }
        }}
      >
        <svg
          className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown menu rendered in portal */}
      {isOpen && createPortal(
        <div
          ref={dropdownMenuRef}
          className={`fixed z-[60] bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto ${dropdownClassName}`}
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${dropdownPosition.width}px`,
            marginTop: '4px'
          }}
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const isKeyboardSelected = index === selectedIndex;
              const isCurrentlySelected = selectedItem && (
                (typeof selectedItem === 'string' && typeof item === 'string' && selectedItem === item) ||
                (typeof selectedItem === 'string' && typeof item === 'object' && selectedItem === item.name) ||
                (typeof selectedItem === 'object' && typeof item === 'string' && selectedItem.name === item) ||
                (typeof selectedItem === 'object' && typeof item === 'object' && selectedItem.name === item.name)
              );
              return (
                <button
                  key={getItemKey(item, index)}
                  type="button"
                  className={`w-full px-3 py-2 text-left focus:outline-none text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                    isKeyboardSelected
                      ? 'bg-blue-50 dark:bg-blue-900/50'
                      : isCurrentlySelected
                      ? 'bg-green-50 dark:bg-green-900/30 border-l-2 border-green-500'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-600'
                  } ${itemClassName}`}
                  onClick={() => handleItemClick(item)}
                  disabled={isLoading}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {renderItemContent(item, index)}
                    </div>
                    {isCurrentlySelected && (
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              {internalSearchTerm ? noResultsText : noItemsText}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
