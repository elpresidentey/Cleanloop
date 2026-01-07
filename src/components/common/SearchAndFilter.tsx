import { useState, useEffect } from 'react'
import { useDebounce } from '../../hooks/useDebounce'

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number'
  options?: FilterOption[]
  placeholder?: string
}

interface SearchAndFilterProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  filters?: FilterConfig[]
  filterValues?: Record<string, any>
  onFilterChange?: (key: string, value: any) => void
  onClearFilters?: () => void
  className?: string
  showClearButton?: boolean
}

export function SearchAndFilter({
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  className = '',
  showClearButton = true
}: SearchAndFilterProps) {
  const [localSearchValue, setLocalSearchValue] = useState(searchValue)
  const [showFilters, setShowFilters] = useState(false)
  const debouncedSearchValue = useDebounce(localSearchValue, 300)

  useEffect(() => {
    if (onSearchChange && debouncedSearchValue !== searchValue) {
      onSearchChange(debouncedSearchValue)
    }
  }, [debouncedSearchValue, onSearchChange, searchValue])

  useEffect(() => {
    setLocalSearchValue(searchValue)
  }, [searchValue])

  const handleFilterChange = (key: string, value: any) => {
    onFilterChange?.(key, value)
  }

  const hasActiveFilters = Object.values(filterValues).some(value => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== null && value !== ''
  })

  const renderFilter = (filter: FilterConfig) => {
    const value = filterValues[filter.key]

    switch (filter.type) {
      case 'select':
        return (
          <select
            key={filter.key}
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value || undefined)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          >
            <option value="">{filter.placeholder || `All ${filter.label}`}</option>
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        return (
          <div key={filter.key} className="relative">
            <select
              multiple
              value={value || []}
              onChange={(e) => {
                const selectedValues = Array.from(e.target.selectedOptions, option => option.value)
                handleFilterChange(filter.key, selectedValues.length > 0 ? selectedValues : undefined)
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              size={Math.min(4, filter.options?.length || 1)}
            >
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
          </div>
        )

      case 'date':
        return (
          <input
            key={filter.key}
            type="date"
            value={value ? new Date(value).toISOString().split('T')[0] : ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value ? new Date(e.target.value) : undefined)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        )

      case 'daterange': {
        const dateRange = value || {}
        return (
          <div key={filter.key} className="space-y-2">
            <input
              type="date"
              placeholder="Start date"
              value={dateRange.startDate ? new Date(dateRange.startDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange(filter.key, {
                ...dateRange,
                startDate: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <input
              type="date"
              placeholder="End date"
              value={dateRange.endDate ? new Date(dateRange.endDate).toISOString().split('T')[0] : ''}
              onChange={(e) => handleFilterChange(filter.key, {
                ...dateRange,
                endDate: e.target.value ? new Date(e.target.value) : undefined
              })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        )
      }

      case 'number':
        return (
          <input
            key={filter.key}
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(filter.key, e.target.value ? Number(e.target.value) : undefined)}
            placeholder={filter.placeholder}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        )

      default:
        return null
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {/* Search Bar */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
          <input
            type="text"
            value={localSearchValue}
            onChange={(e) => setLocalSearchValue(e.target.value)}
            placeholder={searchPlaceholder}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {filters.length > 0 && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${hasActiveFilters ? 'border-blue-500 text-blue-700' : ''
              }`}
          >
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="ml-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                {Object.values(filterValues).filter(value => {
                  if (Array.isArray(value)) return value.length > 0
                  return value !== undefined && value !== null && value !== ''
                }).length}
              </span>
            )}
          </button>
        )}

        {showClearButton && (hasActiveFilters || localSearchValue) && (
          <button
            onClick={() => {
              setLocalSearchValue('')
              onSearchChange?.('')
              onClearFilters?.()
            }}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filters */}
      {showFilters && filters.length > 0 && (
        <div className="border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {filter.label}
                </label>
                {renderFilter(filter)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}