'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Printer, Download, Plus, Minus, X, Search,
  Tag, CheckSquare, Square, Barcode, ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
type Product = {
  id: string
  name: string
  sku: string | null
  price: number
  category_name: string | null
}

type LabelItem = {
  product: Product
  quantity: number
}

// ─── Label sizes ─────────────────────────────────────────────────────────────
const LABEL_SIZES = {
  small:  { label: 'Pequeña (50×25mm)', w: 189, h: 94,  fontSize: 8,  priceSize: 13 },
  medium: { label: 'Mediana (70×40mm)', w: 264, h: 151, fontSize: 10, priceSize: 16 },
  large:  { label: 'Grande (100×60mm)', w: 378, h: 227, fontSize: 11, priceSize: 20 },
}
type SizeKey = keyof typeof LABEL_SIZES

// ─── Barcode rendering (Code128 via canvas) ───────────────────────────────────
function drawCode128(canvas: HTMLCanvasElement, text: string, width: number, height: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width  = width
  canvas.height = height
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, width, height)

  // Simplified Code128B encoding
  const encode128B = (s: string): string => {
    const START_B = '11010010000'
    const STOP    = '1100011101011'
    const TABLE_B: Record<string, string> = {
      ' ':'11011001100','!':'11001101100','"':'11001100110','#':'10010011000',
      '$':'10010001100','%':'10001001100','&':'10011001000','\'':'10011000100',
      '(':'10001100100',')':'11001001000','*':'11001000100','+':'11000100100',
      ',':'10110011100','-':'10011011100','.':'10011001110','/':'10111001100',
      '0':'10011101100','1':'10011100110','2':'11001110010','3':'11001011100',
      '4':'11001001110','5':'11011100100','6':'11001110100','7':'11101101110',
      '8':'11101001100','9':'11100101100',':':'11100100110',';':'11101100100',
      '<':'11100110100','=':'11100110010','>':'11011011000','?':'11011000110',
      '@':'11000110110','A':'10100011000','B':'10001011000','C':'10001000110',
      'D':'10110001000','E':'10001101000','F':'10001100010','G':'11010001000',
      'H':'11000101000','I':'11000100010','J':'10110111000','K':'10110001110',
      'L':'10001101110','M':'10111011000','N':'10111000110','O':'10001110110',
      'P':'11101110110','Q':'11010001110','R':'11000101110','S':'11011101000',
      'T':'11011100010','U':'11011101110','V':'11101011000','W':'11101000110',
      'X':'11100010110','Y':'11011010000','Z':'11011001000','[':'11011010010',
      '\\':'11001010010',']':'11010010010','^':'11010000100','_':'11001001010',
      '`':'10110010100','a':'10110000010','b':'11001010000','c':'11110111010',
      'd':'11000010100','e':'10001111010','f':'10111100010','g':'10010001110',
      'h':'10011100010','i':'10011110100','j':'10111011110','k':'10011000010',
      'l':'11110100010','m':'10011110010','n':'11110010100','o':'11001111010',
      'p':'10100111100','q':'10010111100','r':'10010011110','s':'10111001110',
      't':'10111100100','u':'10001111100','v':'10110011110','w':'10110111100',
      'x':'11110100110','y':'11110110010','z':'11010111000','{':'11110101000',
      '|':'11110101110','}':'11011101110','~':'10110100010',
    }

    let bits = START_B
    let checksum = 104
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      const pattern = TABLE_B[ch] ?? TABLE_B['?']!
      bits += pattern
      checksum += (i + 1) * (32 + s.charCodeAt(i))
    }
    // Checksum symbol
    const CODES = Object.values(TABLE_B)
    bits += CODES[checksum % 103] ?? CODES[0]!
    bits += STOP

    return bits
  }

  const bits    = encode128B(text)
  const barW    = Math.floor(width / bits.length)
  const barH    = height
  ctx.fillStyle = '#000'
  for (let i = 0; i < bits.length; i++) {
    if (bits[i] === '1') {
      ctx.fillRect(i * barW, 0, barW, barH)
    }
  }
}

// ─── Single Label Component ───────────────────────────────────────────────────
function Label({
  item, size, showPrice, showSku, brandName,
}: {
  item: LabelItem
  size: SizeKey
  showPrice: boolean
  showSku: boolean
  brandName: string
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cfg       = LABEL_SIZES[size]
  const sku       = item.product.sku ?? item.product.id.slice(0, 8).toUpperCase()

  useEffect(() => {
    if (canvasRef.current) {
      drawCode128(canvasRef.current, sku, cfg.w - 16, Math.floor(cfg.h * 0.38))
    }
  }, [sku, cfg])

  const fmt = (n: number) =>
    new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

  return (
    <div
      className="label-item border border-zinc-300 bg-white flex flex-col items-center justify-between overflow-hidden"
      style={{ width: cfg.w, height: cfg.h, padding: '4px 8px', boxSizing: 'border-box' }}
    >
      {/* Brand */}
      <div className="w-full flex justify-between items-center" style={{ fontSize: cfg.fontSize - 1 }}>
        <span className="font-bold text-zinc-800 truncate">{brandName}</span>
        {showSku && <span className="text-zinc-500 ml-1 shrink-0">{sku}</span>}
      </div>

      {/* Product name */}
      <div
        className="w-full text-center font-semibold text-zinc-900 leading-tight"
        style={{ fontSize: cfg.fontSize, maxHeight: cfg.h * 0.22, overflow: 'hidden' }}
      >
        {item.product.name}
      </div>

      {/* Barcode */}
      <canvas ref={canvasRef} style={{ width: cfg.w - 16, height: Math.floor(cfg.h * 0.38) }} />

      {/* SKU text */}
      <div className="w-full text-center text-zinc-600" style={{ fontSize: cfg.fontSize - 2 }}>
        {sku}
      </div>

      {/* Price */}
      {showPrice && (
        <div
          className="w-full text-center font-black text-zinc-900"
          style={{ fontSize: cfg.priceSize }}
        >
          {fmt(item.product.price)}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LabelsPage() {
  const supabase = createClient()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<LabelItem[]>([])

  // Config
  const [size, setSize]           = useState<SizeKey>('medium')
  const [showPrice, setShowPrice] = useState(true)
  const [showSku, setShowSku]     = useState(true)
  const [brandName, setBrandName] = useState('ARM Merch')
  const [cols, setCols]           = useState(3)

  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, name, sku, price, category:categories(name)')
      .eq('active', true)
      .order('name')
    setProducts(
      (data ?? []).map((p: any) => ({
        id: p.id, name: p.name, sku: p.sku, price: p.price,
        category_name: Array.isArray(p.category) ? p.category[0]?.name : p.category?.name,
      }))
    )
    setLoading(false)
  }

  function toggleProduct(product: Product) {
    const exists = selected.find(s => s.product.id === product.id)
    if (exists) {
      setSelected(prev => prev.filter(s => s.product.id !== product.id))
    } else {
      setSelected(prev => [...prev, { product, quantity: 1 }])
    }
  }

  function updateQty(id: string, delta: number) {
    setSelected(prev => prev.map(s =>
      s.product.id === id
        ? { ...s, quantity: Math.max(1, Math.min(50, s.quantity + delta)) }
        : s
    ))
  }

  function handlePrint() {
    const printWin = window.open('', '_blank', 'width=900,height=700')
    if (!printWin || !printRef.current) return

    // Get all canvases and convert to data URLs
    const canvases = printRef.current.querySelectorAll('canvas')
    const canvasData: string[] = []
    canvases.forEach(c => canvasData.push(c.toDataURL()))

    const html = printRef.current.innerHTML
    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiquetas ARM Merch</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { background: white; font-family: Arial, sans-serif; }
            .print-grid {
              display: flex; flex-wrap: wrap; gap: 4px; padding: 8px;
            }
            .label-item {
              border: 1px dashed #ccc;
              display: flex; flex-direction: column;
              align-items: center; justify-content: space-between;
              overflow: hidden; page-break-inside: avoid;
              padding: 4px 8px;
            }
            @media print {
              .label-item { border: 1px dashed #ccc; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="print-grid">${html}</div>
          <script>
            // Replace canvases with img tags
            const imgs = document.querySelectorAll('canvas');
            const data = ${JSON.stringify(canvasData)};
            imgs.forEach((canvas, i) => {
              const img = document.createElement('img');
              img.src = data[i] || '';
              img.style.cssText = canvas.style.cssText;
              canvas.parentNode.replaceChild(img, canvas);
            });
            setTimeout(() => { window.print(); window.close(); }, 500);
          <\/script>
        </body>
      </html>
    `)
    printWin.document.close()
  }

  const filtered = products.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.sku ?? '').toLowerCase().includes(search.toLowerCase())
  )

  // Expand selected by quantity for print
  const expandedLabels = selected.flatMap(s =>
    Array.from({ length: s.quantity }, () => s)
  )

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href="/products" className="rounded-xl border border-zinc-700 p-2 text-zinc-400 hover:text-white transition">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              <Tag size={18} className="text-amber-400" />
              Generador de etiquetas
            </h1>
            <p className="text-xs text-zinc-500 mt-0.5">
              {selected.length} productos · {expandedLabels.length} etiquetas
            </p>
          </div>
        </div>

        {selected.length > 0 && (
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl px-5 py-2.5 text-sm transition"
          >
            <Printer size={16} /> Imprimir {expandedLabels.length} etiquetas
          </button>
        )}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">

        {/* LEFT: Product selector */}
        <div className="space-y-4">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto o SKU..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-600 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <div className="bg-zinc-800/60 px-4 py-2.5 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                Productos ({filtered.length})
              </p>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-[10px] text-zinc-600 hover:text-red-400 transition">
                  Limpiar selección
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/60 max-h-[480px] overflow-y-auto">
                {filtered.map(product => {
                  const isSelected = selected.some(s => s.product.id === product.id)
                  const item       = selected.find(s => s.product.id === product.id)
                  const fmt        = (n: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

                  return (
                    <div
                      key={product.id}
                      className={`flex items-center gap-3 px-4 py-3 transition ${isSelected ? 'bg-amber-500/5' : 'hover:bg-zinc-800/30'}`}
                    >
                      <button onClick={() => toggleProduct(product)} className="shrink-0">
                        {isSelected
                          ? <CheckSquare size={18} className="text-amber-400" />
                          : <Square size={18} className="text-zinc-600" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-200 truncate">{product.name}</p>
                        <div className="flex gap-2 text-[10px] text-zinc-600">
                          {product.sku && <span>{product.sku}</span>}
                          {product.category_name && <span>· {product.category_name}</span>}
                        </div>
                      </div>

                      <span className="text-sm font-bold text-white shrink-0">{fmt(product.price)}</span>

                      {isSelected && item && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateQty(product.id, -1)}
                            className="h-6 w-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition">
                            <Minus size={10} />
                          </button>
                          <span className="w-7 text-center text-sm font-bold text-white">{item.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)}
                            className="h-6 w-6 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white flex items-center justify-center transition">
                            <Plus size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Config + Preview */}
        <div className="space-y-4">

          {/* Config panel */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Configuración</p>

            {/* Brand name */}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Nombre de marca</label>
              <input
                value={brandName} onChange={e => setBrandName(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* Size */}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">Tamaño de etiqueta</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.entries(LABEL_SIZES) as [SizeKey, typeof LABEL_SIZES[SizeKey]][]).map(([k, v]) => (
                  <button
                    key={k} onClick={() => setSize(k)}
                    className={`rounded-xl border py-2 text-xs font-semibold transition ${
                      size === k ? 'border-amber-500/50 bg-amber-500/15 text-amber-400' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'
                    }`}
                  >
                    {k.charAt(0).toUpperCase() + k.slice(1)}
                    <div className="text-[9px] font-normal opacity-70">{v.label.split('(')[1]?.replace(')', '')}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Columns */}
            <div>
              <label className="block text-[10px] text-zinc-500 uppercase tracking-wider mb-1.5">
                Columnas por fila: {cols}
              </label>
              <input type="range" min={1} max={6} value={cols} onChange={e => setCols(Number(e.target.value))}
                className="w-full accent-amber-500" />
            </div>

            {/* Toggles */}
            <div className="space-y-2">
              {[
                { label: 'Mostrar precio', value: showPrice, set: setShowPrice },
                { label: 'Mostrar SKU',    value: showSku,   set: setShowSku },
              ].map(({ label, value, set }) => (
                <button key={label} onClick={() => set(!value)}
                  className="flex w-full items-center justify-between rounded-xl bg-zinc-800 px-3 py-2.5 transition hover:bg-zinc-700"
                >
                  <span className="text-sm text-zinc-300">{label}</span>
                  <div className={`relative flex h-5 w-9 items-center rounded-full transition ${value ? 'bg-amber-500' : 'bg-zinc-600'}`}>
                    <span className={`absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-all ${value ? 'left-[18px]' : 'left-[3px]'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selected.length > 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-500">Vista previa</p>
              <div
                ref={printRef}
                className="print-grid flex flex-wrap gap-1 bg-white rounded-lg p-2 overflow-auto max-h-[320px]"
              >
                {expandedLabels.map((item, i) => (
                  <Label key={i} item={item} size={size} showPrice={showPrice} showSku={showSku} brandName={brandName} />
                ))}
              </div>
              <p className="mt-2 text-center text-[10px] text-zinc-600">
                {expandedLabels.length} etiquetas · {cols} columnas por fila
              </p>
            </div>
          )}

          {selected.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-700 py-12 text-center">
              <Barcode size={36} className="text-zinc-700" />
              <p className="mt-3 text-sm text-zinc-600">Selecciona productos de la lista para generar etiquetas</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
