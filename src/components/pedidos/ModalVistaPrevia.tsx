import {
  AlertCircle,
  Download,
  Loader2,
  Printer,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { PedidoCompleto } from '../../lib/types'
import HojaPedido from './HojaPedido'

interface Props {
  pedido: PedidoCompleto
  isOpen: boolean
  onCerrar: () => void
}

const A4_ANCHO_PX = 794 // 210mm a 96 DPI
const A4_ALTO_PX = 1123 // 297mm a 96 DPI

export default function ModalVistaPrevia({ pedido, isOpen, onCerrar }: Props) {
  const hojaRef = useRef<HTMLElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [escala, setEscala] = useState(1)
  const [altoHoja, setAltoHoja] = useState(A4_ALTO_PX)

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !generando) {
        onCerrar()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, generando, onCerrar])

  // Ajuste responsivo de escala en pantallas chicas (móvil)
  useEffect(() => {
    if (!isOpen) return

    function actualizarEscala() {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth
      // Padding horizontal del contenedor: p-3 en móvil (24px total), p-8 en md+ (64px total)
      const padding = window.innerWidth < 768 ? 24 : 64
      const disponible = containerWidth - padding

      if (sheetRef.current) {
        setAltoHoja(sheetRef.current.offsetHeight || A4_ALTO_PX)
      }

      if (disponible > 0 && disponible < A4_ANCHO_PX) {
        setEscala(disponible / A4_ANCHO_PX)
      } else {
        setEscala(1)
      }
    }

    actualizarEscala()
    const timer = setTimeout(actualizarEscala, 50)

    const observer = new ResizeObserver(() => {
      actualizarEscala()
    })

    if (containerRef.current) observer.observe(containerRef.current)
    if (sheetRef.current) observer.observe(sheetRef.current)

    window.addEventListener('resize', actualizarEscala)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
      window.removeEventListener('resize', actualizarEscala)
    }
  }, [isOpen, pedido])

  if (!isOpen) return null

  async function handleDescargarPdf() {
    if (!hojaRef.current || generando) return
    setGenerando(true)
    setError(null)

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas-pro'),
        import('jspdf'),
      ])

      const element = hojaRef.current

      // Captura con html2canvas-pro a tamaño real (compatible con oklch/oklab de Tailwind v4)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1200,
        onclone: (_clonedDoc, clonedEl) => {
          // Asegura que en el clon (iframe) no haya escala reducida de visualización móvil
          let parent = clonedEl.parentElement
          while (parent) {
            if (parent.style && parent.style.transform) {
              parent.style.transform = 'none'
            }
            parent = parent.parentElement
          }
        },
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)

      // Configuración de página A4 vertical (210 x 297 mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = 210
      const pdfHeight = 297
      const margin = 10
      const maxW = pdfWidth - margin * 2
      const maxH = pdfHeight - margin * 2

      const imgRatio = canvas.width / canvas.height
      let renderW = maxW
      let renderH = renderW / imgRatio

      if (renderH > maxH) {
        renderH = maxH
        renderW = renderH * imgRatio
      }

      // Centrado horizontal con margen superior
      const posX = margin + (maxW - renderW) / 2
      const posY = margin

      pdf.addImage(imgData, 'JPEG', posX, posY, renderW, renderH)
      pdf.save(`Pedido-${pedido.id}.pdf`)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al generar el archivo PDF.',
      )
    } finally {
      setGenerando(false)
    }
  }

  function handleImprimir() {
    window.print()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-vista-previa"
      className="fixed inset-0 z-50 flex flex-col bg-slate-900/85 backdrop-blur-xs print:static print:bg-white print:p-0 print:overflow-visible"
    >
      {/* Barra superior de herramientas (oculta al imprimir) */}
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4 py-3 text-white shadow-md print:hidden">
        <div>
          <h2
            id="titulo-vista-previa"
            className="font-headline-sm text-sm md:text-base font-bold tracking-tight text-white"
          >
            Vista previa de impresión — Pedido Nº {pedido.id}
          </h2>
          <p className="text-xs text-slate-300">
            Formato A4 vertical estándar (1 sola página)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botón Descargar PDF */}
          <button
            type="button"
            disabled={generando}
            onClick={handleDescargarPdf}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary-container px-4 py-2 font-label-md text-sm font-semibold text-white shadow-xs transition-colors hover:bg-primary-container/90 active:scale-[0.98] disabled:opacity-50"
          >
            {generando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Generando…</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Descargar PDF</span>
              </>
            )}
          </button>

          {/* Botón Imprimir */}
          <button
            type="button"
            disabled={generando}
            onClick={handleImprimir}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 font-label-md text-sm font-semibold text-white transition-colors hover:bg-white/20 active:scale-[0.98] disabled:opacity-50"
          >
            <Printer size={16} />
            <span>Imprimir</span>
          </button>

          {/* Botón Cerrar */}
          <button
            type="button"
            onClick={onCerrar}
            disabled={generando}
            aria-label="Cerrar vista previa"
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      {/* Alerta de error si falló la generación del PDF */}
      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-lg border border-error bg-error-container p-3 text-xs text-on-error-container shadow-sm print:hidden"
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-error shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 font-bold text-error hover:opacity-80"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Área con scroll sobre fondo gris que contiene la hoja A4 alineada al inicio sin corte izquierdo */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-3 sm:p-4 md:p-8 flex justify-start items-start print:p-0 print:overflow-visible"
      >
        <div
          style={{
            width: escala < 1 ? `${A4_ANCHO_PX * escala}px` : undefined,
            height: escala < 1 ? `${altoHoja * escala}px` : undefined,
          }}
          className="mx-auto print:!w-full print:!h-auto"
        >
          <div
            ref={sheetRef}
            style={{
              width: '210mm',
              minHeight: '297mm',
              transform: escala < 1 ? `scale(${escala})` : undefined,
              transformOrigin: 'top left',
            }}
            className="w-[210mm] min-w-[210mm] min-h-[297mm] bg-white p-[12mm] shadow-2xl rounded-sm box-border print:m-0 print:p-0 print:shadow-none print:!w-full print:min-w-0 print:min-h-0 print:border-none print:!transform-none"
          >
            <HojaPedido pedido={pedido} enModal hojaRef={hojaRef} />
          </div>
        </div>
      </div>
    </div>
  )
}
