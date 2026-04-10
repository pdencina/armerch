import { create } from 'zustand'

interface CartProduct {
  id: string
  name: string
  price: number
  image_url: string | null
  stock: number
}

interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartStore {
  items: CartItem[]
  paymentMethod: string
  discount: number
  addItem: (product: CartProduct) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setPaymentMethod: (method: string) => void
  setDiscount: (amount: number) => void
  clearCart: () => void
  subtotal: () => number
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  paymentMethod: 'efectivo',
  discount: 0,

  addItem: (product) => set(state => {
    const existing = state.items.find(i => i.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) return state
      return { items: state.items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) }
    }
    return { items: [...state.items, { product, quantity: 1 }] }
  }),

  removeItem: (productId) => set(state => ({
    items: state.items.filter(i => i.product.id !== productId)
  })),

  updateQuantity: (productId, quantity) => set(state => {
    if (quantity <= 0) return { items: state.items.filter(i => i.product.id !== productId) }
    return { items: state.items.map(i => i.product.id === productId ? { ...i, quantity } : i) }
  }),

  setPaymentMethod: (method) => set({ paymentMethod: method }),

  setDiscount: (amount) => set({ discount: amount }),

  clearCart: () => set({ items: [], discount: 0 }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),

  total: () => {
    const sub = get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0)
    return Math.max(0, sub - get().discount)
  },

  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
