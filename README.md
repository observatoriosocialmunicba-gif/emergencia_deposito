# Emergencias Muni Cba

Aplicación web progresiva (PWA) para la gestión de **pedidos de ayuda de emergencia** de la Secretaría de Políticas
Sociales y Desarrollo Humano de la Municipalidad de Córdoba. Reemplaza a una app Flutter anterior.

Permite registrar solicitudes de asistencia, autorizarlas, asignarlas a un reparto, registrar la entrega y consultar
estadísticas, con permisos distintos según el rol y el área de cada usuario.

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Supabase (PostgreSQL + Auth + API REST)
- **Uso previsto:** interno, pocos usuarios, en celular y escritorio

---

## Flujo de un pedido

```
Pendiente de Autorización ──autoriza (Administrador)──▶ Para Asignar ──asigna (Asignador/Admin)──▶ Asignado
          │                                                                                          │
          └──rechaza, con motivo (Administrador)──▶ Rechazado                       Entregado ◀──────┴──────▶ No Entregado
```

1. Un **Solicitante** registra la solicitud (persona beneficiaria, ubicación y artículos). Puede **editarla mientras siga pendiente**.
2. Un **Administrador** la autoriza o la rechaza (el rechazo exige un motivo, que queda en las observaciones).
3. Un **Asignador** (o un Administrador) la asigna indicando vehículo, entregador y fecha de entrega.
4. Los choferes no usan la app: llevan el pedido impreso. El Asignador registra después si fue **Entregado** o **No Entregado**.

## Roles y permisos

| Rol | Qué ve | Qué puede hacer |
|---|---|---|
| **Administrador** | Todo, incluido el Dashboard | Autorizar y rechazar, editar pedidos, asignar, registrar entregas, gestionar usuarios y áreas |
| **Asignador** | Pedidos en Para Asignar, Asignado, Entregado y No Entregado | Asignar y registrar entregas |
| **Solicitante** | Solo los pedidos y personas **de su área** | Crear solicitudes y editarlas hasta que se autorizan |
| **No Asignado** | Nada | Cuenta recién registrada: queda pendiente hasta que un Administrador le asigne rol y área |

Las **áreas** son: Subsecretaría de Emergencia e Intervención Territorial, Subsecretaría de Familias y Desarrollo
Comunitario, Subsecretaría de Nuevas Economías y Otras. Cada Solicitante pertenece a una. Un usuario **inactivo** no puede
operar aunque conserve su cuenta.

> **Importante:** el frontend oculta las opciones que no corresponden a cada rol, pero **la seguridad real debe imponerse
> en la base de datos** (Row Level Security de Supabase). Los permisos por rol y área descritos arriba requieren que las
> políticas del backend estén aplicadas.

## Pantallas

| Ruta | Pantalla | Quién |
|---|---|---|
| `/login`, `/crear-cuenta`, `/recuperar-password` | Acceso | Público |
| `/estado-pedidos` | Pedidos por estado, con filtros y búsqueda | Todos |
| `/solicitudes`, `/solicitudes/nueva`, `/solicitudes/:id/editar` | Listado, alta y edición de solicitudes | Solicitante, Administrador |
| `/ver-pedido/:id` | Detalle, acciones por rol, vista previa y PDF | Según el pedido |
| `/autorizar-pedidos` | Cola de pedidos pendientes | Administrador |
| `/asignar-pedidos`, `/panel-entregas` | Asignación y seguimiento de entregas | Asignador, Administrador |
| `/historial-pedidos` | Historial unificado por persona | Administrador |
| `/dashboard` | Indicadores y gráficos | Administrador |
| `/usuarios` | Gestión de usuarios: rol, área, habilitar y desactivar | Administrador |
| `/perfil` | Datos propios | Todos |

La **vista previa** de un pedido muestra la hoja A4 y permite **descargarla como PDF** o imprimirla.

## Modelo de datos (resumen)

Esquema `public` de PostgreSQL. Los nombres de tablas y columnas llevan mayúsculas, por eso se consultan entre comillas
(`.from('Pedidos')`).

| Tabla | Contenido |
|---|---|
| `Pedidos` | Solicitudes: estado, ubicación, procedencia, área, datos de asignación y entrega |
| `DetalledePedido` | Artículos de cada pedido (rubro, necesidad, cantidad) |
| `Personas` | Personas beneficiarias |
| `Productos` | Catálogo de rubros y necesidades |
| `Usuarios` | Perfil de cada usuario: rol, área y si está activo (el `id` es el de Supabase Auth) |
| `Areas` | Subsecretarías |
| `Vehiculos`, `Barrios` | Catálogos auxiliares |

Además hay vistas de solo lectura para los conteos por estado y para el Dashboard.

## Estructura del proyecto

```
src/
  pages/<Pantalla>/index.tsx   una carpeta por pantalla
  components/                  componentes compartidos (pedidos, usuarios, layout, rutas protegidas)
  services/                    TODAS las llamadas a Supabase (los componentes nunca llaman a supabase)
  hooks/                       react-query sobre los services (use<Entidad>.ts)
  context/                     sesión y usuario autenticado
  lib/                         cliente de Supabase, tipos, estados y formatos
  styles/                      tokens del sistema de diseño
  index.css                    tema de Tailwind (fuente de verdad de los estilos)
```

Convenciones: capas **servicios → hooks → pantallas**, nombres en español, TypeScript estricto (sin `any`), invalidación
de queries de react-query al modificar datos, y estados de carga, vacío y error en cada pantalla.

## Puesta en marcha

Requisitos: **Node.js 20 o superior** y un proyecto de Supabase con el esquema descrito arriba.

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un archivo `.env` en esta carpeta (está en `.gitignore`, **nunca se sube**):

   ```
   VITE_SUPABASE_URL=<URL de tu proyecto Supabase>
   VITE_SUPABASE_ANON_KEY=<clave "anon / publishable" del proyecto>
   ```

   Sin estas variables la app muestra una pantalla de configuración en lugar de fallar.

3. Levantar el servidor de desarrollo:

   ```bash
   npm run dev
   ```

   Si el puerto 5173 está ocupado, Vite usa el siguiente libre y lo informa en la terminal.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Chequeo de tipos (`tsc -b`) y build de producción |
| `npm run preview` | Sirve el build para probarlo |
| `npm run lint` | Análisis estático con oxlint |

### Desarrollo contra una base local

Para no tocar datos reales conviene desarrollar contra un Supabase local (Supabase CLI + Docker). Se puede apuntar la
app a esa base creando un archivo `.env.development.local` (ignorado por git) con la URL y la clave del stack local.
Ese archivo **solo lo lee `npm run dev`**; el build de producción usa las variables del entorno donde se despliega.

> Después de instalar dependencias nuevas, reiniciar el servidor de desarrollo con `npm run dev -- --force`.
> Si no, puede fallar la carga de módulos importados dinámicamente (por ejemplo, la generación de PDF).

## Despliegue (Vercel)

- [`vercel.json`](vercel.json) ya incluye la **reescritura de rutas** (la app usa rutas del lado del cliente, sin esto
  recargar `/ver-pedido/12` daría 404) y los **encabezados de caché** del Service Worker, el manifest y `/assets/`.
- Cargar `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en *Settings → Environment Variables* del proyecto de Vercel.
- **Cuidado con los entornos de Preview:** una rama distinta de `main` también genera una publicación. No cargarle las
  variables de la base real: una prueba podría modificar datos reales.
- Es una **PWA** (`vite-plugin-pwa`, registro `autoUpdate`): los dispositivos toman la versión nueva al recargar.

## Notas técnicas

- **Filtros y paginación en el servidor:** las listas usan `.range()` y conteo exacto; no se descarga la tabla completa.
- **PDF:** se genera en el navegador con `html2canvas-pro` + `jsPDF`, cargados bajo demanda. Se usa `html2canvas-pro`
  porque Tailwind v4 emplea colores `oklch`, que la versión original de `html2canvas` no soporta. El PDF es una imagen
  A4 de una sola página (el texto no es seleccionable).
- **Gráficos:** `recharts`. **Íconos:** `lucide-react`. **Tipografías:** Outfit, Plus Jakarta Sans y Readex Pro (fontsource).

## Seguridad

- No guardar claves ni credenciales en el código: salen de variables de entorno (`import.meta.env`).
- La clave `anon` de Supabase es pública por diseño; lo que protege los datos son las **políticas RLS** de la base.
  Nunca usar la clave `service_role` en el frontend.
- Los datos de la aplicación incluyen **datos personales de beneficiarios** (DNI, teléfono, dirección). Para desarrollar
  y probar usar siempre datos inventados.
