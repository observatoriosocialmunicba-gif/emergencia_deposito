import { Construction } from 'lucide-react'

// Pantallas del original que todavía no se portaron.
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <Construction size={48} className="text-ink-soft" />
      <h1 className="font-headline-lg text-headline-lg text-ink">{title}</h1>
      <p className="text-ink-soft">Esta pantalla todavía no está migrada.</p>
    </div>
  )
}
