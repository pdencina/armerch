import { create } from 'zustand'

export interface CartProduct {
  id: string
  name: string
  price: number
  image_url: string | null
  stock: number
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartStore {
  items: CartItem[]
  paymentMethod: 'efectivo' | 'transferencia' | 'debito' | 'credito'
  discount: number

  // Actions
  addItem: (product: CartProduct) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setPaymentMethod: (method: CartStore['paymentMethod']) => void
  setDiscount: (discount: number) => void
  clearCart: () => void

  // Computed
  subtotal: () => number
  total: () => number
  itemCount: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  paymentMethod: 'efectivo',
  discount: 0,

  addItem: (product) => {
    const existing = get().items.find(i => i.product.id === product.id)
    if (existing) {
      if (existing.quantity >= product.stock) return // no exceder stock
      set(state => ({
        items: state.items.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }))
    } else {
      set(state => ({ items: [...state.items, { product, quantity: 1 }] }))
    }
  },

  removeItem: (productId) =>
    set(state => ({ items: state.items.filter(i => i.product.id !== productId) })),

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) { get().removeItem(productId); return }
    set(state => ({
      items: state.items.map(i =>
        i.product.id === productId ? { ...i, quantity } : i
      )
    }))
  },

  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setDiscount: (discount) => set({ discount }),
  clearCart: () => set({ items: [], discount: 0, paymentMethod: 'efectivo' }),

  subtotal: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
  total: () => get().subtotal() - get().discount,
  itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
}))
