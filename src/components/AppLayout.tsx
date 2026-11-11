import {
  BadgeCheck,
  CircleHelp,
  CircleUser,
  ClipboardCheck,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  Truck,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../assets/logo.png'
import { useAuth } from '../context/AuthContext'
import { iniciales } from '../lib/estados'
import type { Rol } from '../lib/types'

interface Item {
  to: string
  label: string
  icon: LucideIcon
  /** si se define, solo lo ven estos roles */
  soloRoles?: Rol[]
}

const PRINCIPAL: Item[] = [
  {
    to: '/solicitudes',
    label: 'Solicitudes',
    icon: ClipboardList,
    soloRoles: ['Administrador', 'Solicitante'],
  },
  {
    to: '/asignar-pedidos',
    label: 'Asignar Pedidos',
    icon: Truck,
    soloRoles: ['Administrador', 'Asignador'],
  },
  {
    to: '/panel-entregas',
    label: 'Panel de Entregas',
    icon: Package,
    soloRoles: ['Administrador', 'Asignador'],
  },
  { to: '/estado-pedidos', label: 'Estado de Pedidos', icon: ClipboardCheck },
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    soloRoles: ['Administrador'],
  },
  {
    to: '/autorizar-pedidos',
    label: 'Autorizar Pedidos',
    icon: BadgeCheck,
    soloRoles: ['Administrador'],
  },
  {
    to: '/historial-pedidos',
    label: 'Historial Pedidos',
    icon: History,
    soloRoles: ['Administrador'],
  },
  {
    to: '/usuarios',
    label: 'Usuarios',
    icon: Users,
    soloRoles: ['Administrador'],
  },
]

const HERRAMIENTAS: Item[] = [
  { to: '/perfil', label: 'Perfil', icon: CircleUser },
  { to: '/ayuda', label: 'Ayuda', icon: CircleHelp },
  {
    to: '/administrativo',
    label: 'Administrativo',
    icon: ShieldCheck,
    soloRoles: ['Administrador'],
  },
]

function NavItem({ item, onNavigate }: { item: Item; onNavigate: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex min-h-[44px] items-center gap-space-sm px-space-md py-2.5 transition-colors ${
          isActive
            ? 'rounded-r-lg border-l-4 border-secondary bg-surface-container font-body-md-bold text-body-md-bold text-secondary shadow-sm'
            : 'rounded-lg font-body-md text-body-md text-on-surface-variant hover:bg-surface-container/70 hover:text-primary'
        }`
      }
    >
      <Icon size={20} />
      <span>{item.label}</span>
    </NavLink>
  )
}

function SidebarContent({ onNavigate }: { onNavigate: () => void }) {
  const { session, usuario, signOut } = useAuth()
  const navigate = useNavigate()
  const rol = usuario?.rol ?? 'No Asignado'
  const asignado = rol !== 'No Asignado'
  const email = session?.user.email

  const visible = (items: Item[]) =>
    items.filter((i) => !i.soloRoles || i.soloRoles.includes(rol))

  async function salir() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <>
      <div>
        <Link
          to="/estado-pedidos"
          onClick={onNavigate}
          className="flex items-center gap-3 border-b border-line p-space-md"
        >
          <img src={logo} alt="" className="size-10 rounded-lg object-cover" />
          <span className="font-headline-md text-headline-md text-ink">Emergencias</span>
        </Link>

        {asignado && (
          <div className="px-space-xs py-space-sm">
            <p className="px-space-md py-1.5 font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Menú Principal
            </p>
            <nav className="space-y-1">
              {visible(PRINCIPAL).map((i) => (
                <NavItem key={i.to} item={i} onNavigate={onNavigate} />
              ))}
            </nav>

            <div className="my-space-sm border-t border-line/80" />

            <p className="px-space-md py-1 font-label-sm text-label-sm uppercase tracking-wider text-outline">
              Herramientas
            </p>
            <nav className="space-y-1">
              {visible(HERRAMIENTAS).map((i) => (
                <NavItem key={i.to} item={i} onNavigate={onNavigate} />
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-panel p-space-md">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-sm font-bold text-white shadow-sm ring-2 ring-white">
            {iniciales(usuario?.nombreCompleto, email)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body-md-bold text-body-md-bold leading-tight text-ink">
              {usuario?.nombreCompleto ?? 'Nombre Completo'}
            </p>
            <p className="truncate font-label-sm text-label-sm text-ink-soft">{email}</p>
            <span className="mt-0.5 inline-block rounded bg-teal-soft px-1.5 py-0.5 font-label-sm text-[10px] font-semibold text-secondary">
              {usuario?.rol ?? 'Sin rol'}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={salir}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-primary-container font-label-lg text-label-lg text-primary-container transition-all hover:bg-primary-container/5 active:scale-[0.98]"
        >
          <LogOut size={18} />
          Salir
        </button>
      </div>
    </>
  )
}

export default function AppLayout() {
  const [abierto, setAbierto] = useState(false)
  const { session, usuario } = useAuth()
  const cerrar = () => setAbierto(false)

  return (
    <div className="flex min-h-full flex-col bg-page">
      {/* Barra superior: solo celular */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-primary-container px-margin py-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-white shadow-md print:hidden md:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Abrir menú de navegación"
            onClick={() => setAbierto(true)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-success"
          >
            <Menu size={26} />
          </button>
          <span className="font-headline-sm text-headline-sm tracking-tight">
            Muni Cba Emergencias
          </span>
        </div>
        <div className="flex size-8 items-center justify-center rounded-full bg-secondary-fixed text-xs font-bold text-primary">
          {iniciales(usuario?.nombreCompleto, session?.user.email)}
        </div>
      </header>

      {abierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrar}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Menú lateral: fijo en escritorio, deslizable en celular */}
      <aside
        className={`custom-scrollbar fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col justify-between overflow-y-auto border-r border-line bg-white shadow-sm transition-transform duration-200 ease-in-out print:hidden md:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={cerrar}
          className="absolute right-2 top-2 flex min-h-[44px] min-w-[44px] items-center justify-center text-on-surface-variant hover:text-primary md:hidden"
        >
          <X size={22} />
        </button>
        <SidebarContent onNavigate={cerrar} />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col md:pl-[270px] print:min-h-0 print:pl-0">
        {/* Barra superior: solo escritorio */}
        <div className="sticky top-0 z-30 hidden items-center bg-primary-container px-margin-desktop py-3 text-white shadow-sm print:hidden md:flex">
          <span className="font-headline-sm text-headline-sm tracking-tight">
            Muni Cba Emergencias
          </span>
        </div>

        <main className="flex-1">
          <Outlet />
        </main>

        <footer className="mt-auto border-t border-line bg-white px-margin py-4 text-xs text-ink-soft print:hidden md:px-margin-desktop">
          <span className="font-bold text-primary-container">Municipalidad de Córdoba</span>
          <span> · Secretaría de Políticas Sociales y Desarrollo Humano</span>
        </footer>
      </div>
    </div>
  )
}
