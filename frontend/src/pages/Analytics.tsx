"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts"
import { TrendingUp, DollarSign, ShoppingCart, Users, Package, ArrowUp, ArrowDown, AlertTriangle, UserCheck, Percent, Calendar } from "lucide-react"
import api from "../config/api"
import { useAuthStore } from "../store/authStore"

export default function Analytics() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [timeRange, setTimeRange] = useState("month")
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalUsers: 0,
    totalCustomers: 0,
    newCustomers: 0,
    averageOrderValue: 0,
    revenueGrowth: 0,
    ordersGrowth: 0,
    outOfStockCount: 0,
    retentionRate: 0
  })

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/")
      return
    }
    fetchAnalytics()
  }, [user, navigate, timeRange])

  const [revenueData, setRevenueData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [orderStatusData, setOrderStatusData] = useState<any[]>([])
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([])

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get(`/analytics?timeRange=${timeRange}`)
      
      setStats(data.stats)
      setRevenueData(data.revenueData)
      setCategoryData(data.categoryData)
      setTopProducts(data.topProducts)
      setOrderStatusData(data.orderStatusData || [])
      setLowStockProducts(data.lowStockProducts || [])
      setMonthlyRevenue(data.monthlyRevenue || [])
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex gap-2">
            {["day", "week", "month", "year", "all"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  timeRange === range
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className={`flex items-center text-sm font-medium ${
                stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.revenueGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(stats.revenueGrowth)}%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">Total Revenue</h3>
            <p className="text-2xl font-bold text-gray-900">${(stats.totalRevenue || 0).toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <span className={`flex items-center text-sm font-medium ${
                stats.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stats.ordersGrowth >= 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                {Math.abs(stats.ordersGrowth)}%
              </span>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">Total Orders</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">Avg Order Value</h3>
            <p className="text-2xl font-bold text-gray-900">${(stats.averageOrderValue || 0).toFixed(2)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm text-blue-600 font-medium">
                +{stats.newCustomers} new
              </span>
            </div>
            <h3 className="text-gray-500 text-sm mb-1">Total Customers</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Customer Retention</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.retentionRate}%</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${Math.min(stats.retentionRate, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Out of Stock</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.outOfStockCount}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Products need restocking</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-gray-500 text-sm">Total Products</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">Active in catalog</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Revenue Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Orders Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Orders Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="orders" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Trend */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Monthly Revenue Trend (2024)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Business Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Sales by Category */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Sales by Category</h2>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Order Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Status</h2>
            <div className="space-y-3">
              {orderStatusData.map((status, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      status._id === 'delivered' ? 'bg-green-500' :
                      status._id === 'processing' ? 'bg-blue-500' :
                      status._id === 'shipped' ? 'bg-purple-500' :
                      status._id === 'cancelled' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="capitalize font-medium">{status._id}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{status.count}</p>
                    <p className="text-sm text-gray-500">${status.revenue?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Low Stock Alert
            </h2>
            <div className="space-y-3">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((product, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={product.imageUrl || '/placeholder.svg'} alt={product.name} className="w-8 h-8 object-cover rounded" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      product.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {product.stock} left
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4 text-sm">All products well stocked</p>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Top Performing Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topProducts.length > 0 ? (
              topProducts.map((product, i) => (
                <div key={i} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <img src={product.imageUrl || '/placeholder.svg'} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 line-clamp-1">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.sales} sales</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-bold">${product.revenue.toLocaleString()}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">#{i + 1}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8 col-span-full">No sales data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
