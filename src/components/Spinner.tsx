export default function Spinner({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <div
      className={`flex items-center justify-center ${fullscreen ? 'h-full min-h-screen' : 'py-10'}`}
      role="status"
      aria-label="Cargando"
    >
      <div className="size-12 animate-spin rounded-full border-4 border-primary-container/25 border-t-primary-container" />
    </div>
  )
}
