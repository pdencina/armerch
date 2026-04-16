export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { id: string; name: string; description: string | null; active: boolean; created_at: string }
        Insert: { id?: string; name: string; description?: string | null; active?: boolean; created_at?: string }
        Update: { id?: string; name?: string; description?: string | null; active?: boolean; created_at?: string }
      }
      profiles: {
        Row: { id: string; full_name: string; email: string; role: 'super_admin' | 'admin' | 'voluntario'; avatar_url: string | null; active: boolean; created_at: string; updated_at: string }
        Insert: { id: string; full_name: string; email: string; role?: 'super_admin' | 'admin' | 'voluntario'; avatar_url?: string | null; active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; full_name?: string; email?: string; role?: 'super_admin' | 'admin' | 'voluntario'; avatar_url?: string | null; active?: boolean; created_at?: string; updated_at?: string }
      }
      products: {
        Row: { id: string; name: string; description: string | null; price: number; sku: string | null; category_id: string | null; image_url: string | null; active: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; name: string; description?: string | null; price: number; sku?: string | null; category_id?: string | null; image_url?: string | null; active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; name?: string; description?: string | null; price?: number; sku?: string | null; category_id?: string | null; image_url?: string | null; active?: boolean; created_by?: string | null; created_at?: string; updated_at?: string }
      }
      inventory: {
        Row: { id: string; product_id: string; stock: number; low_stock_alert: number; updated_at: string; updated_by: string | null }
        Insert: { id?: string; product_id: string; stock?: number; low_stock_alert?: number; updated_at?: string; updated_by?: string | null }
        Update: { id?: string; product_id?: string; stock?: number; low_stock_alert?: number; updated_at?: string; updated_by?: string | null }
      }
      inventory_movements: {
        Row: { id: string; product_id: string; type: 'entrada' | 'salida' | 'ajuste'; quantity: number; notes: string | null; created_by: string | null; created_at: string }
        Insert: { id?: string; product_id: string; type: 'entrada' | 'salida' | 'ajuste'; quantity: number; notes?: string | null; created_by?: string | null; created_at?: string }
        Update: { id?: string; product_id?: string; type?: 'entrada' | 'salida' | 'ajuste'; quantity?: number; notes?: string | null; created_by?: string | null; created_at?: string }
      }
      orders: {
        Row: { id: string; order_number: number; status: 'pendiente' | 'completada' | 'cancelada'; payment_method: 'efectivo' | 'transferencia' | 'debito' | 'credito'; subtotal: number; discount: number; total: number; notes: string | null; seller_id: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; order_number?: number; status?: 'pendiente' | 'completada' | 'cancelada'; payment_method?: 'efectivo' | 'transferencia' | 'debito' | 'credito'; subtotal?: number; discount?: number; total?: number; notes?: string | null; seller_id?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; order_number?: number; status?: 'pendiente' | 'completada' | 'cancelada'; payment_method?: 'efectivo' | 'transferencia' | 'debito' | 'credito'; subtotal?: number; discount?: number; total?: number; notes?: string | null; seller_id?: string | null; created_at?: string; updated_at?: string }
      }
      order_items: {
        Row: { id: string; order_id: string; product_id: string; quantity: number; unit_price: number; subtotal: number }
        Insert: { id?: string; order_id: string; product_id: string; quantity: number; unit_price: number }
        Update: { id?: string; order_id?: string; product_id?: string; quantity?: number; unit_price?: number }
      }
    }
    Views: {
      products_with_stock: {
        Row: { id: string; name: string; description: string | null; price: number; sku: string | null; category_id: string | null; category_name: string | null; image_url: string | null; active: boolean; created_by: string | null; created_at: string; updated_at: string; stock: number | null; low_stock_alert: number | null; low_stock: boolean | null }
      }
    }
    Enums: {
      user_role: 'super_admin' | 'admin' | 'voluntario'
      movement_type: 'entrada' | 'salida' | 'ajuste'
      order_status: 'pendiente' | 'completada' | 'cancelada'
      payment_method: 'efectivo' | 'transferencia' | 'debito' | 'credito'
    }
  }
}
