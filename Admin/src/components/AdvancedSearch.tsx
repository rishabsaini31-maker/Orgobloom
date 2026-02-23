"use client";

import { useState } from "react";
import axios from "axios";

// Inline SVG icons
const SearchIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const XIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

const FilterIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
    />
  </svg>
);

interface SearchFilter {
  field: string;
  operator: string;
  value: string;
}

interface AdvancedSearchProps {
  entityType: "products" | "orders" | "customers";
  onSearch: (results: any[]) => void;
  onLoading?: (loading: boolean) => void;
}

export default function AdvancedSearch({
  entityType,
  onSearch,
  onLoading,
}: AdvancedSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

  const filterOptions: Record<
    string,
    { label: string; type: string; options?: string[] }[]
  > = {
    products: [
      { label: "Name", type: "text" },
      { label: "Category", type: "select", options: ["cow", "chicken"] },
      { label: "Min Price", type: "number" },
      { label: "Max Price", type: "number" },
      { label: "Active", type: "boolean" },
      { label: "Featured", type: "boolean" },
    ],
    orders: [
      {
        label: "Status",
        type: "select",
        options: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "CANCELLED",
        ],
      },
      {
        label: "Payment Status",
        type: "select",
        options: ["PENDING", "COMPLETED", "FAILED", "REFUNDED"],
      },
      { label: "Min Total", type: "number" },
      { label: "Max Total", type: "number" },
      { label: "Start Date", type: "date" },
      { label: "End Date", type: "date" },
    ],
    customers: [
      { label: "Role", type: "select", options: ["CUSTOMER", "ADMIN"] },
      { label: "Blocked", type: "boolean" },
      {
        label: "Fraud Status",
        type: "select",
        options: ["SAFE", "MEDIUM_RISK", "HIGH_RISK"],
      },
      { label: "Start Date", type: "date" },
      { label: "End Date", type: "date" },
    ],
  };

  const executeSearch = async () => {
    setIsSearching(true);
    onLoading?.(true);

    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();

      if (searchQuery) {
        params.append("q", searchQuery);
      }

      // Add filters to params
      filters.forEach((filter) => {
        if (filter.value) {
          const paramName = filter.field.toLowerCase().replace(" ", "");
          params.append(paramName, filter.value);
        }
      });

      const response = await axios.get(
        `${apiUrl}/search/${entityType}?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      onSearch(response.data.results);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
      onLoading?.(false);
    }
  };

  const addFilter = () => {
    setFilters([...filters, { field: "", operator: "eq", value: "" }]);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: string, value: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    setFilters(newFilters);
  };

  const clearAll = () => {
    setSearchQuery("");
    setFilters([]);
    onSearch([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={`Search ${entityType}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && executeSearch()}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
            showFilters
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "border-gray-300 text-gray-700"
          }`}
        >
          <FilterIcon />
          Filters
          {filters.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {filters.length}
            </span>
          )}
        </button>

        <button
          onClick={executeSearch}
          disabled={isSearching}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isSearching ? "Searching..." : "Search"}
        </button>

        {(searchQuery || filters.length > 0) && (
          <button
            onClick={clearAll}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Clear
          </button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">
              Advanced Filters
            </h4>
            <button
              onClick={addFilter}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              + Add Filter
            </button>
          </div>

          {filters.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No filters applied. Click "Add Filter" to add search criteria.
            </p>
          ) : (
            <div className="space-y-3">
              {filters.map((filter, index) => {
                const fieldOptions = filterOptions[entityType] || [];
                const selectedField = fieldOptions.find(
                  (f) => f.label === filter.field,
                );
                const inputType = selectedField?.type || "text";

                return (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={filter.field}
                      onChange={(e) =>
                        updateFilter(index, "field", e.target.value)
                      }
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    >
                      <option value="">Select field...</option>
                      {fieldOptions.map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>

                    {inputType === "select" && selectedField?.options ? (
                      <select
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, "value", e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="">Select value...</option>
                        {selectedField.options.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : inputType === "boolean" ? (
                      <select
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, "value", e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="">Select...</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    ) : (
                      <input
                        type={inputType}
                        value={filter.value}
                        onChange={(e) =>
                          updateFilter(index, "value", e.target.value)
                        }
                        placeholder="Value"
                        className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                      />
                    )}

                    <button
                      onClick={() => removeFilter(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <XIcon />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
