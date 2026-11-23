import {
  Building2,
  MapPin,
  Package,
  Settings,
  SlidersHorizontal,
  Truck,
} from 'lucide-react'
import { useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PanelAreas from '../../components/configuracion/PanelAreas'
import PanelBarrios from '../../components/configuracion/PanelBarrios'
import PanelOpciones from '../../components/configuracion/PanelOpciones'
import PanelProductos from '../../components/configuracion/PanelProductos'
import PanelVehiculos from '../../components/configuracion/PanelVehiculos'
import Spinner from '../../components/Spinner'
import { useAuth } from '../../context/AuthContext'

const TABS = [
  { id: 'areas', label: 'Áreas', icon: Building2 },
  { id: 'generos', label: 'Género', icon: SlidersHorizontal },
  { id: 'procedencias', label: 'Procedencia', icon: SlidersHorizontal },
  { id: 'productos', label: 'Productos', icon: Package },
  { id: 'barrios', label: 'Barrios', icon: MapPin },
  { id: 'vehiculos', label: 'Vehículos', icon: Truck },
] as const

type TabId = (typeof TABS)[number]['id']

export default function ConfiguracionPage() {
  const { usuario, usuarioLoading } = useAuth()
  const { tab } = useParams<{ tab: string }>()
  const navigate = useNavigate()

  // En celular la barra de pestañas se desplaza: se centra la pestaña activa para que se vea dónde está.
  useEffect(() => {
    if (!tab) return
    document
      .getElementById(`tab-${tab}`)
      ?.scrollIntoView({ inline: 'center', block: 'nearest' })
  }, [tab, usuarioLoading])

  if (usuarioLoading) return <Spinner />

  // Control de acceso: solo Administrador
  if (usuario?.rol !== 'Administrador') {
    return <Navigate to="/estado-pedidos" replace />
  }

  // Si no hay tab o es inválido, redirigir a 'areas'
  const tabValido = TABS.some((t) => t.id === tab)
  if (!tab || !tabValido) {
    return <Navigate to="/configuracion/areas" replace />
  }

  const tabActual = tab as TabId

  function handleSeleccionarTab(id: TabId) {
    navigate(`/configuracion/${id}`)
  }

  function handleKeyDownTab(e: KeyboardEvent<HTMLButtonElement>, indexActual: number) {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      const siguiente = (indexActual + 1) % TABS.length
      navigate(`/configuracion/${TABS[siguiente].id}`)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      const anterior = (indexActual - 1 + TABS.length) % TABS.length
      navigate(`/configuracion/${TABS[anterior].id}`)
    }
  }

  return (
    <div className="space-y-space-lg p-margin md:p-margin-desktop">
      {/* Título único h1 de la pantalla */}
      <div>
        <div className="flex items-center gap-2 text-primary">
          <Settings size={28} />
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold tracking-tight text-ink md:font-headline-lg md:text-headline-lg">
            Configuración del Sistema
          </h1>
        </div>
        <p className="mt-1 font-body-md text-sm text-ink-soft">
          Administrá los catálogos de datos maestros utilizados en las solicitudes y logística.
        </p>
      </div>

      {/* Pestañas con scroll horizontal propio en pantallas chicas */}
      <div className="border-b border-line">
        <div
          role="tablist"
          aria-label="Catálogos del sistema"
          className="flex gap-2 overflow-x-auto pb-px scrollbar-none"
        >
          {TABS.map((t, idx) => {
            const Icono = t.icon
            const estaActivo = t.id === tabActual

            return (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={estaActivo}
                aria-controls={`panel-${t.id}`}
                tabIndex={estaActivo ? 0 : -1}
                onClick={() => handleSeleccionarTab(t.id)}
                onKeyDown={(e) => handleKeyDownTab(e, idx)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 font-label-md text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/30 ${
                  estaActivo
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-ink-soft hover:border-line hover:text-ink'
                }`}
              >
                <Icono size={18} className="shrink-0" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div
        id={`panel-${tabActual}`}
        role="tabpanel"
        aria-labelledby={`tab-${tabActual}`}
        className="focus:outline-none"
      >
        {tabActual === 'areas' && <PanelAreas />}
        {tabActual === 'generos' && <PanelOpciones categoria="genero" />}
        {tabActual === 'procedencias' && <PanelOpciones categoria="procedencia" />}
        {tabActual === 'productos' && <PanelProductos />}
        {tabActual === 'barrios' && <PanelBarrios />}
        {tabActual === 'vehiculos' && <PanelVehiculos />}
      </div>
    </div>
  )
}
