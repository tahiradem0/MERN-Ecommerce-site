import mongoose from "mongoose"

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],
    imageUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    features: {
      type: [String],
      default: [],
    },
    ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        stars: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        review: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
)

// Pre-save middleware to calculate average rating
productSchema.pre("save", function () {
  if (this.ratings && this.ratings.length > 0) {
    const totalStars = this.ratings.reduce((sum, r) => sum + Number(r.stars), 0)
    this.averageRating = totalStars / this.ratings.length
    this.totalRatings = this.ratings.length
  } else {
    this.averageRating = 0
    this.totalRatings = 0
  }
})

const Product = mongoose.model("Product", productSchema)

export default Product
