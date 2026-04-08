interface Props {
  stock: number
  alert: number
}

export default function StockBadge({ stock, alert }: Props) {
  if (stock === 0) {
    return (
      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
        Sin stock
      </span>
    )
  }
  if (stock <= alert) {
    return (
      <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
        Stock bajo
      </span>
    )
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
      Normal
    </span>
  )
}
