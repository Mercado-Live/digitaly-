/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             INDEX — PUNTO DE ENTRADA DE LA APLICACIÓN                      ║
║                                                                             ║
║  En Expo Router, src/app/index.tsx es la RUTA RAÍZ ("/").                   ║
║  Es lo primero que ve el usuario cuando abre la app.                        ║
║                                                                             ║
║  La responsabilidad de este archivo es MINIMA:                              ║
║  - No contiene lógica                                                       ║
║  - No contiene datos                                                        ║
║  - Solo RENDERIZA el componente Billboard                                   ║
║                                                                             ║
║  Esto es el punto más alto de la COMPOSICIÓN:                               ║
║                                                                             ║
║    index.tsx (punto de entrada)                                             ║
║      └── Billboard.tsx (orquestador)                                        ║
║            ├── ScrollView                                                   ║
║            │    └── BillboardSlide.tsx (presentación)                       ║
║            └── SlideIndicator.tsx (presentación)                            ║
║                                                                             ║
║  Esta jerarquía refleja la ARQUITECTURA de la aplicación.                   ║
║  Cada nivel tiene una responsabilidad clara y NO se salta niveles.          ║
║  index.tsx no llama a BillboardSlide directamente.                          ║
║  Eso sería VIOLAR la arquitectura (saltarse la abstracción).                ║
║                                                                             ║
║  ¿Por qué tener index.tsx separado de Billboard.tsx?                        ║
║  1. Billboard es REUTILIZABLE: puedes ponerlo en otra ruta                  ║
║     (por ejemplo, /tv-mode) sin duplicar código.                            ║
║  2. Mañana podrías cambiar la ruta raíz (poner un login antes)              ║
║     sin tocar el componente Billboard.                                      ║
║  3. TESTING: puedes importar Billboard en tests sin Expo Router.            ║
║                                                                             ║
║  Esto es el principio de RESPONSABILIDAD ÚNICA (Single Responsibility):    ║
║  - index.tsx: "sé el punto de entrada de la app"                            ║
║  - Billboard.tsx: "orquesta la cartelera"                                   ║
║  - BillboardSlide.tsx: "renderiza un anuncio"                               ║
║  - SlideIndicator.tsx: "muestra los dots"                                   ║
║                                                                             ║
║  Ninguno hace la tarea del otro. Si un archivo hace más de una cosa,        ║
║  ese archivo debería dividirse.                                             ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * ¿POR QUÉ IMPORTAMOS DE "../../components/Billboard"?
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * La ruta relativa (../../) refleja la estructura de directorios:
 *
 *   src/
 *     app/
 *       index.tsx    ← estamos aquí
 *     components/
 *       Billboard.tsx ← queremos llegar aquí
 *
 * ../../ → sube de app/ → sube de src/ → luego baja a components/
 *
 * Alternativa: path alias (tsconfig.json "paths")
 *   import Billboard from "@/components/Billboard"
 *
 * Los path aliases evitan rutas relativas profundas (../../../../utils).
 * Expo Router recomienda "@/" como alias de "src/".
 * Se configura en tsconfig.json con:
 *   "paths": { "@/*": ["./src/*"] }
 *
 * Por ahora usamos ruta relativa para que sea EXPLÍCITA y educativa.
 * En proyectos grandes, USA PATH ALIASES.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import Billboard from "../components/Billboard";

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * EXPORT DEFAULT — ¿POR QUÉ RENDERIZAMOS DIRECTO?
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * Export default function Index() { return <Billboard /> }
 *
 * 1. Billboard es un componente que OCUPA TODA LA PANTALLA (flex: 1).
 * 2. No necesitamos View contenedor adicional — Billboard ya es root.
 * 3. El Stack layout (en _layout.tsx) ya maneja la navegación.
 *
 * ¿Por qué Export Default y no Export Named?
 * - Expo Router exige export default para las rutas.
 * - Export default significa: "esto es lo PRINCIPAL que exporta este módulo".
 * - Export named: export function Index() permite múltiples exports.
 * - Convención: default para la ruta/página, named para utilidades.
 *
 * Dato de arquitectura: solo los archivos en src/app/ (rutas) usan
 * export default. Los componentes en src/components/ técnicamente también,
 * pero es una decisión de diseño (cada equipo decide su convención).
 * ──────────────────────────────────────────────────────────────────────────────
 */
export default function Index() {
  return <Billboard />;
}
