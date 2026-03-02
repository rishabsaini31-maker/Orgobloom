"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { Search, Loader2, Filter, X } from "lucide-react";
import toast from "react-hot-toast";

interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  reviewCount: number;
}

interface Facet {
  categories: Array<{ name: string; count: number }>;
  priceRanges: Array<{
    label: string;
    min: number;
    max: number;
    count: number;
  }>;
}

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sortBy = searchParams.get("sort") || "relevance";
  const page = parseInt(searchParams.get("page") || "1");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [facets, setFacets] = useState<Facet | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalResults, setTotalResults] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    category: category || "",
    priceRange: { min: 0, max: 100000 },
    sort: sortBy,
  });

  useEffect(() => {
    if (query) {
      fetchResults();
      fetchFacets();
    }
  }, [query, category, sortBy, page]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/search/products", {
        params: {
          q: query,
          category,
          sort: sortBy,
          page,
          limit: 12,
        },
      });
      setResults(response.data.results);
      setTotalResults(response.data.pagination.total);
    } catch (error) {
      toast.error("Failed to fetch search results");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacets = async () => {
    try {
      const response = await axios.get("/api/search/facets");
      setFacets(response.data.facets);
    } catch (error) {
      console.error("Error fetching facets:", error);
    }
  };

  const handleFilterChange = (type: string, value: any) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedFilters.category)
      params.set("category", selectedFilters.category);
    if (selectedFilters.sort) params.set("sort", selectedFilters.sort);
    router.push(`/search?${params.toString()}`);
  };

  const clearFilters = () => {
    setSelectedFilters({
      category: "",
      priceRange: { min: 0, max: 100000 },
      sort: "relevance",
    });
    router.push(`/search?q=${query}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => router.push(`/search?q=${e.target.value}`)}
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Search Results Summary */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-gray-600">
              Found <strong>{totalResults}</strong> results for{" "}
              <strong>&quot;{query}&quot;</strong>
            </p>
            <select
              value={selectedFilters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="relevance">Relevance</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <aside
            className={`lg:block ${showFilters ? "block" : "hidden"} lg:col-span-1`}
          >
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <h3 className="font-semibold text-gray-900 flex items-center justify-between">
                Filters
                {selectedFilters.category && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    Clear All
                  </button>
                )}
              </h3>

              {/* Category Filter */}
              {facets?.categories && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Category</h4>
                  <div className="space-y-2">
                    {facets.categories.slice(0, 8).map((cat) => (
                      <label key={cat.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedFilters.category === cat.name}
                          onChange={(e) =>
                            handleFilterChange(
                              "category",
                              e.target.checked ? cat.name : "",
                            )
                          }
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-gray-700 text-sm">
                          {cat.name}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          ({cat.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              {facets?.priceRanges && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Price</h4>
                  <div className="space-y-2">
                    {facets.priceRanges.map((range) => (
                      <label
                        key={range.label}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-primary-600 rounded"
                        />
                        <span className="text-gray-700 text-sm">
                          {range.label}
                        </span>
                        <span className="text-gray-500 text-xs ml-auto">
                          ({range.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex items-center justify-center min-h-96">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
              </div>
            ) : results.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((product) => (
                    <div
                      key={product.id}
                      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                      onClick={() => router.push(`/products/${product.id}`)}
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="p-4">
                        <p className="text-xs text-gray-500 mb-1">
                          {product.category}
                        </p>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                          {product.name}
                        </h3>

                        {/* Rating */}
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < Math.floor(product.rating) ? "★" : "☆"
                                }
                              ></span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600">
                            ({product.reviewCount})
                          </span>
                        </div>

                        {/* Price */}
                        <p className="text-lg font-bold text-primary-600">
                          ₹{product.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-8 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <button
                      onClick={() =>
                        router.push(`/search?q=${query}&page=${page - 1}`)
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </button>
                  )}
                  <span className="text-gray-600">Page {page}</span>
                  <button
                    onClick={() =>
                      router.push(`/search?q=${query}&page=${page + 1}`)
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">
                  No products found matching your search
                </p>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
