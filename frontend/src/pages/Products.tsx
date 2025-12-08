"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../config/api"
import type { Product } from "../types"
import { useCartStore } from "../store/cartStore"
import { useToastContext } from "../App"
import { ShoppingCart, Heart, Search, Grid, List, SlidersHorizontal, X, TrendingUp, Star, Package } from "lucide-react"
import Button from "../components/ui/Button"
import StarRating from "../components/StarRating"

type SortOption = "featured" | "price-low" | "price-high" | "rating" | "newest"
type ViewMode = "grid" | "list"

export default function Products() {
  const navigate = useNavigate()
  const { showToast } = useToastContext()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000])
  const [maxPrice, setMaxPrice] = useState(1000)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("featured")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  const { addItem } = useCartStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get<Product[]>("/products")
        setProducts(data)
        const max = Math.max(...data.map((p) => p.price), 1000)
        setMaxPrice(max)
        setPriceRange([0, max])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))]

  const filteredProducts = products
    .filter((p) => {
      const categoryMatch = selectedCategory === "all" || p.category === selectedCategory
      const priceMatch = p.price >= priceRange[0] && p.price <= priceRange[1]
      const searchMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase())
      return categoryMatch && priceMatch && searchMatch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price
        case "price-high":
          return b.price - a.price
        case "rating":
          return (b.averageRating || 0) - (a.averageRating || 0)
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "featured":
        default:
          return b.featured ? 1 : -1
      }
    })

  const handleAddToCart = (product: Product) => {
    if (product.stock > 0) {
      addItem(product)
      showToast(`${product.name} added to cart!`, "success")
    }
  }

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
        showToast("Removed from wishlist", "success")
      } else {
        newSet.add(productId)
        showToast("Added to wishlist", "success")
      }
      return newSet
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Discover Products
          </h1>
          <p className="text-gray-600">Explore our curated collection of premium products</p>
        </div>

        {/* Search & Controls */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none bg-white cursor-pointer"
            >
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated</option>
              <option value="newest">Newest</option>
            </select>

            {/* View Toggle */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "grid" ? "bg-white shadow-md" : "hover:bg-gray-200"
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === "list" ? "bg-white shadow-md" : "hover:bg-gray-200"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Active Filters */}
          {(selectedCategory !== "all" || searchQuery) && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
              {selectedCategory !== "all" && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  {selectedCategory}
                  <X className="w-4 h-4 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                </span>
              )}
              {searchQuery && (
                <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  Search: {searchQuery}
                  <X className="w-4 h-4 cursor-pointer" onClick={() => setSearchQuery("")} />
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-96 space-y-6 ${showFilters ? "block" : "hidden lg:block"} lg:sticky lg:top-4 lg:self-start lg:max-h-screen lg:overflow-y-auto`}>
            {/* Categories */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                      selectedCategory === category
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Price Range
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between text-sm font-semibold text-gray-700">
                  <span>${priceRange[0]}</span>
                  <span>${priceRange[1]}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={maxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex gap-3">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:outline-none"
                    placeholder="Max"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-2">Products Found</h3>
              <p className="text-4xl font-bold">{filteredProducts.length}</p>
              <p className="text-sm opacity-90 mt-1">out of {products.length} total</p>
            </div>
          </aside>

          {/* Products Grid/List */}
          <main className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
                  <div className="w-20 h-20 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0"></div>
                </div>
              </div>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" 
                : "space-y-6"
              }>
                {filteredProducts.map((product) => (
                  viewMode === "grid" ? (
                    <div
                      key={product._id}
                      className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 flex flex-col h-full"
                    >
                      <div className="relative overflow-hidden">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name} 
                          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500 cursor-pointer"
                          onClick={() => navigate(`/products/${product._id}`)}
                        />
                        {product.featured && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Featured
                          </div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleWishlist(product._id)
                          }}
                          className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                        >
                          <Heart 
                            className={`w-5 h-5 ${wishlist.has(product._id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                          />
                        </button>
                        {product.stock < 10 && product.stock > 0 && (
                          <div className="absolute bottom-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Only {product.stock} left!
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                          {product.category}
                        </div>
                        <h3 
                          className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
                          onClick={() => navigate(`/products/${product._id}`)}
                        >
                          {product.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <StarRating rating={product.averageRating || 0} readonly size={18} />
                          <span className="text-sm font-semibold text-gray-600">
                            {product.averageRating?.toFixed(1) || "0.0"}
                          </span>
                          <span className="text-xs text-gray-400">
                            ({product.totalRatings || 0} reviews)
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
                          {product.description}
                        </p>

                        <div className="mt-auto space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                ${Number(product.price ?? 0).toFixed(2)}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              product.stock > 10 
                                ? "bg-green-100 text-green-700" 
                                : product.stock > 0 
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                            </span>
                          </div>

                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(product)
                            }}
                            disabled={product.stock === 0}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={product._id}
                      className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col sm:flex-row"
                    >
                      <div className="relative sm:w-64 h-48 sm:h-auto overflow-hidden flex-shrink-0">
                        <img 
                          src={product.imageUrl || "/placeholder.svg"} 
                          alt={product.name} 
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500 cursor-pointer"
                          onClick={() => navigate(`/products/${product._id}`)}
                        />
                        {product.featured && (
                          <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" fill="currentColor" />
                            Featured
                          </div>
                        )}
                      </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                              {product.category}
                            </div>
                            <h3 
                              className="text-2xl font-bold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                              onClick={() => navigate(`/products/${product._id}`)}
                            >
                              {product.name}
                            </h3>
                            <div className="flex items-center gap-2 mb-3">
                              <StarRating rating={product.averageRating || 0} readonly size={18} />
                              <span className="text-sm font-semibold text-gray-600">
                                {product.averageRating?.toFixed(1) || "0.0"}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({product.totalRatings || 0} reviews)
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleWishlist(product._id)
                            }}
                            className="p-2 hover:scale-110 transition-transform"
                          >
                            <Heart 
                              className={`w-6 h-6 ${wishlist.has(product._id) ? "fill-red-500 text-red-500" : "text-gray-400"}`}
                            />
                          </button>
                        </div>

                        <p className="text-gray-600 mb-4 flex-1">
                          {product.description}
                        </p>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              ${Number(product.price ?? 0).toFixed(2)}
                            </span>
                            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                              product.stock > 10 
                                ? "bg-green-100 text-green-700" 
                                : product.stock > 0 
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}>
                              {product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}
                            </span>
                          </div>

                          <Button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAddToCart(product)
                            }}
                            disabled={product.stock === 0}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                          >
                            <ShoppingCart className="w-5 h-5" />
                            {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                  <Package className="w-16 h-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
                <button
                  onClick={() => {
                    setSelectedCategory("all")
                    setSearchQuery("")
                    setPriceRange([0, maxPrice])
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
