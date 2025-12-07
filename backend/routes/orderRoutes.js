import express from "express"
const router = express.Router()
import Order from "../models/Order.js"
import Product from "../models/Product.js"
import { protect, admin } from "../middleware/auth.js"

// @route   POST /api/orders
// @desc    Create new order
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" })
    }

    // Basic request validation to provide clearer 400 responses instead of generic 500
    // Accept either shippingAddress.fullName or shippingAddress.name and
    // fall back to the authenticated user's name when available. The
    // frontend may send a slightly different shape (e.g. no fullName),
    // so be forgiving here and normalize the value.
    const nameFromBody = shippingAddress && (shippingAddress.fullName || shippingAddress.name)
    const fallbackName = req.user && req.user.name
    const effectiveFullName = nameFromBody || fallbackName

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
      return res.status(400).json({ message: "Incomplete shipping address" })
    }

    // Ensure there's a fullName field available for downstream storage
    // (either provided by client or filled from user profile)
    if (!shippingAddress.fullName) shippingAddress.fullName = effectiveFullName || ""

    // Accept cash_on_delivery since the frontend exposes that option
    const allowedPaymentMethods = ["credit_card", "debit_card", "paypal", "cash_on_delivery"]
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid or missing payment method" })
    }

    // Verify products exist and have sufficient stock
    const productIds = items.map((item) => item.product)
    const products = await Product.find({ _id: { $in: productIds } })

    if (products.length !== items.length) {
      return res.status(400).json({ message: "Some products not found" })
    }

    // Check stock and calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const product = products.find((p) => p._id.toString() === item.product)

      if (!product) {
        return res.status(400).json({ message: `Product ${item.product} not found` })
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` })
      }

      subtotal += product.price * item.quantity

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        imageUrl: product.imageUrl,
      })

      // Update product stock
      product.stock -= item.quantity
      await product.save()
    }

    const shippingCost = subtotal >= 50 ? 0 : 10
    const total = subtotal + shippingCost

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      subtotal,
      shippingCost,
      total,
      isPaid: true, // Simulating payment success
      paidAt: Date.now(),
    })

    res.status(201).json(order)
  } catch (error) {
    // If validation error from Mongoose, return 400 with details
    console.error("Error creating order:", error)
    if (error && error.name === "ValidationError") {
      // Collect field errors if available
      const errors = {}
      if (error.errors) {
        Object.keys(error.errors).forEach((key) => {
          errors[key] = error.errors[key].message
        })
      }
      return res.status(400).json({ message: error.message || "Validation error", errors })
    }

    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/orders/myorders
// @desc    Get logged in user orders
// @access  Private
router.get("/myorders", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product")
      .sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email")

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if user owns the order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" })
    }

    res.json(order)
  } catch (error) {
    console.error("Error fetching order:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   GET /api/orders
// @desc    Get all orders (admin only)
// @access  Private/Admin
router.get("/", protect, admin, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email").sort({ createdAt: -1 })
    res.json(orders)
  } catch (error) {
    console.error("Error fetching orders:", error)
    res.status(500).json({ message: "Server error" })
  }
})

// @route   PUT /api/orders/:id/status
// @desc    Update order status (admin only)
// @access  Private/Admin
router.put("/:id/status", protect, admin, async (req, res) => {
  try {
    const { status } = req.body
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.status = status

    if (status === "delivered") {
      order.deliveredAt = Date.now()
    }

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (error) {
    console.error("Error updating order:", error)
    res.status(500).json({ message: "Server error" })
  }
})

export default router
