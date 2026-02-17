import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterGroup {
  label: string;
  key: string;
  options: FilterOption[];
  type?: 'select' | 'checkbox' | 'radio';
}

interface FilterPanelProps {
  filters: FilterGroup[];
  onFilterChange: (filters: Record<string, string | string[]>) => void;
  className?: string;
}

export default function FilterPanel({ filters, onFilterChange, className }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

  const handleFilterChange = (key: string, value: string | string[]) => {
    const newFilters = { ...activeFilters, [key]: value };
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilter = (key: string) => {
    const newFilters = { ...activeFilters };
    delete newFilters[key];
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearAll = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const activeCount = Object.keys(activeFilters).length;

  return (
    <div className={clsx('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2 relative"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-0.5">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[300px] max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filters.map((group) => (
                <div key={group.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {group.label}
                  </label>
                  {group.type === 'checkbox' ? (
                    <div className="space-y-2">
                      {group.options.map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={(activeFilters[group.key] as string[])?.includes(option.value) || false}
                            onChange={(e) => {
                              const current = (activeFilters[group.key] as string[]) || [];
                              const newValue = e.target.checked
                                ? [...current, option.value]
                                : current.filter((v) => v !== option.value);
                              handleFilterChange(group.key, newValue);
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <select
                      value={(activeFilters[group.key] as string) || ''}
                      onChange={(e) => handleFilterChange(group.key, e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">All</option>
                      {group.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {activeFilters[group.key] && (
                    <button
                      onClick={() => clearFilter(group.key)}
                      className="mt-1 text-xs text-primary-600 hover:text-primary-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              ))}
            </div>

            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="mt-4 w-full btn btn-secondary text-sm"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}





