import mongoose from "mongoose"
import Product from "../models/Product.js"
import dotenv from "dotenv"

dotenv.config()

async function fixRatings() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("Connected to MongoDB")

    const products = await Product.find({})
    console.log(`Found ${products.length} products`)

    let fixed = 0
    for (const product of products) {
      if (product.ratings && product.ratings.length > 0) {
        const totalStars = product.ratings.reduce((sum, r) => sum + Number(r.stars), 0)
        const correctAverage = totalStars / product.ratings.length
        
        if (product.averageRating !== correctAverage || product.totalRatings !== product.ratings.length) {
          console.log(`\nFixing ${product.name}:`)
          console.log(`  Old average: ${product.averageRating}, New average: ${correctAverage}`)
          console.log(`  Old total: ${product.totalRatings}, New total: ${product.ratings.length}`)
          
          product.averageRating = correctAverage
          product.totalRatings = product.ratings.length
          await product.save()
          fixed++
        }
      }
    }

    console.log(`\n✅ Fixed ${fixed} products`)
    process.exit(0)
  } catch (error) {
    console.error("Error:", error)
    process.exit(1)
  }
}

fixRatings()
