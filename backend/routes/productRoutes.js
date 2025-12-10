import express from "express"
import Product from "../models/Product.js"
import { protect, admin } from "../middleware/auth.js"
import upload from "../middleware/upload.js"
import cloudinary from "../config/cloudinary.js"

const router = express.Router()

// Get all products
router.get("/", async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: "Product not found" })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Create product (Admin only)
router.post("/", protect, admin, upload.array("images", 5), async (req, res) => {
  try {
    const { name, description, price, category, stock, featured } = req.body

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Please upload at least one image" })
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "ecommerce-products",
            resource_type: "image",
          },
          (error, uploadResult) => {
            if (error) reject(error)
            else resolve(uploadResult)
          },
        )
        uploadStream.end(file.buffer)
      })
    })

    let uploadResults
    try {
      uploadResults = await Promise.all(uploadPromises)
    } catch (uploadError) {
      console.error("Cloudinary upload failed:", uploadError)
      return res.status(502).json({ message: "Image upload failed", detail: uploadError.message || uploadError.toString() })
    }

    const images = uploadResults.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
    }))

    try {
      const product = await Product.create({
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        featured: featured === "true",
        discount: Number(req.body.discount || 0),
        features: req.body.features ? JSON.parse(req.body.features) : [],
        images,
        imageUrl: images[0].url, // Keep first image as main for backward compatibility
        cloudinaryPublicId: images[0].publicId,
      })

      return res.status(201).json(product)
    } catch (dbError) {
      console.error("Product creation failed:", dbError)
      // Cleanup uploaded images if product creation fails
      try {
        await Promise.all(uploadResults.map((result) => cloudinary.uploader.destroy(result.public_id)))
      } catch (cleanupErr) {
        console.error("Failed to cleanup Cloudinary assets:", cleanupErr)
      }
      return res.status(500).json({ message: "Failed to create product", detail: dbError.message || dbError.toString() })
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/products:", error)
    return res.status(500).json({ message: "Internal server error", detail: error.message || error.toString() })
  }
})

// Update product (Admin only)
router.put("/:id", protect, admin, upload.array("images", 5), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    const { name, description, price, category, stock, featured } = req.body

    product.name = name || product.name
    product.description = description || product.description
    product.price = price ? Number(price) : product.price
    product.category = category || product.category
    product.stock = stock ? Number(stock) : product.stock
    product.featured = featured !== undefined ? featured === "true" : product.featured
    product.discount = req.body.discount !== undefined ? Number(req.body.discount) : product.discount
    product.features = req.body.features ? JSON.parse(req.body.features) : product.features

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      // Delete old images from Cloudinary
      if (product.images && product.images.length > 0) {
        await Promise.all(product.images.map((img) => cloudinary.uploader.destroy(img.publicId)))
      } else if (product.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(product.cloudinaryPublicId)
      }

      // Upload new images
      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "ecommerce-products",
              resource_type: "image",
            },
            (error, result) => {
              if (error) reject(error)
              else resolve(result)
            },
          )
          uploadStream.end(file.buffer)
        })
      })

      const uploadResults = await Promise.all(uploadPromises)
      const images = uploadResults.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
      }))

      product.images = images
      product.imageUrl = images[0].url // Update main image for backward compatibility
      product.cloudinaryPublicId = images[0].publicId
    }

    const updatedProduct = await product.save()
    res.json(updatedProduct)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Delete product (Admin only)
router.delete("/:id", protect, admin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Delete images from Cloudinary
    if (product.images && product.images.length > 0) {
      await Promise.all(product.images.map((img) => cloudinary.uploader.destroy(img.publicId)))
    } else if (product.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(product.cloudinaryPublicId)
    }

    await product.deleteOne()
    res.json({ message: "Product removed" })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// Add or update rating
router.post("/:id/rating", protect, async (req, res) => {
  try {
    const { stars, review } = req.body
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    if (!stars || stars < 1 || stars > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" })
    }

    // Check if user has purchased this product and hasn't rated it yet
    const Order = (await import("../models/Order.js")).default
    const userOrders = await Order.find({
      user: req.user._id,
      status: "delivered",
    })

    let orderWithProduct = null
    let itemIndex = -1

    for (const order of userOrders) {
      const index = order.items.findIndex((item) => item.product.toString() === req.params.id)
      if (index !== -1) {
        if (order.items[index].rated) {
          return res.status(403).json({ message: "You have already rated this product" })
        }
        orderWithProduct = order
        itemIndex = index
        break
      }
    }

    if (!orderWithProduct) {
      return res.status(403).json({ message: "You can only rate products you have purchased and received" })
    }

    // Check if user already rated
    const existingRatingIndex = product.ratings.findIndex(
      (r) => r.userId.toString() === req.user._id.toString()
    )

    if (existingRatingIndex > -1) {
      // Update existing rating
      product.ratings[existingRatingIndex].stars = Number(stars)
      product.ratings[existingRatingIndex].review = review || ""
      product.ratings[existingRatingIndex].createdAt = Date.now()
    } else {
      // Add new rating
      product.ratings.push({
        userId: req.user._id,
        stars: Number(stars),
        review: review || "",
      })
    }

    // Save product (pre-save hook will calculate averageRating)
    const savedProduct = await product.save()

    // Mark product as rated in the order
    orderWithProduct.items[itemIndex].rated = true
    await orderWithProduct.save()

    res.json({
      averageRating: savedProduct.averageRating,
      totalRatings: savedProduct.totalRatings,
      userRating: stars,
    })
  } catch (error) {
    console.error("Rating error:", error)
    res.status(500).json({ message: error.message })
  }
})

// Get product ratings
router.get("/:id/ratings", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "ratings.userId",
      "name"
    )

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    res.json({
      averageRating: product.averageRating || 0,
      totalRatings: product.totalRatings || 0,
      ratings: product.ratings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

export default router
