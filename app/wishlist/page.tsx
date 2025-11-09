"use client"

import { useRouter } from "next/navigation"
import { Heart, ShoppingCart, Trash2 } from "lucide-react"
import { useWishlistStore, useCartStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

export default function WishlistPage() {
  const router = useRouter()
  const { items, removeFromWishlist } = useWishlistStore()
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const handleAddToCart = (product: any) => {
    if (product.stock === 0) {
      toast({
        title: "Out of stock",
        description: "This product is currently unavailable.",
        variant: "destructive",
      })
      return
    }
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  const handleRemove = (productId: string, productName: string) => {
    removeFromWishlist(productId)
    toast({
      title: "Removed from wishlist",
      description: `${productName} has been removed from your wishlist.`,
    })
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-muted p-6">
              <Heart className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Your wishlist is empty</h1>
          <p className="text-muted-foreground mb-6">Save items you love for later!</p>
          <Button asChild>
            <Link href="/products">Browse Products</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">{items.length} items saved</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((product) => (
          <Card key={product._id} className="group overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden bg-muted relative">
              <img
                src={
                  product.imageUrl ||
                  `/placeholder.svg?height=400&width=400&query=${encodeURIComponent(product.name) || "/placeholder.svg"}`
                }
                alt={product.name}
                className="h-full w-full object-cover"
              />
              {product.stock === 0 && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <span className="text-sm font-medium text-destructive">Out of Stock</span>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <div className="mb-2">
                <span className="text-xs font-medium text-primary uppercase tracking-wide">{product.category}</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl font-bold">${product.price.toFixed(2)}</span>
                  {product.stock > 0 && product.stock <= 10 && (
                    <span className="text-xs text-orange-600">Only {product.stock} left</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock === 0}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleRemove(product._id, product.name)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
