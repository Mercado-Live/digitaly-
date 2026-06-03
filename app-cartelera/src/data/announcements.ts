/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             DATOS DE EJEMPLO (Mock Data)                                    ║
║                                                                             ║
║  En arquitectura de software, SEPARAR los datos de la presentación          ║
║  es uno de los principios más importantes (Separation of Concerns).         ║
║                                                                             ║
║  Este archivo es la "capa de datos". Si mañana estos anuncios vienen        ║
║  de una API REST, de Firebase, de SQLite o de un archivo JSON,              ║
║  solo cambias este archivo. Los componentes que los RENDERIZAN              ║
║  no necesitan saber de dónde vienen los datos.                              ║
║                                                                             ║
║  Esto se llama "abstracción de fuente de datos" y es primo hermano          ║
║  del patrón REPOSITORY en Domain-Driven Design (DDD).                       ║
║                                                                             ║
║  El beneficio: si el backend cambia, tocas 1 archivo, no 20.                  ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

/*
 * Importamos el CONTRATO (interface) que define cómo debe lucir
 * un Announcement. Esto NO es azúcar sintáctico — es una GUARDA
 * de compilación. Si alguien borra una propiedad requerida de
 * Announcement, TypeScript nos avisará AQUÍ antes de que el
 * programa se ejecute.
 *
 * En proyectos grandes, un cambio en el contrato puede romper
 * 50 archivos. TypeScript te dice cuáles son. Sin types,
 * descubres la rotura cuando el usuario reporta un crash.
 */
import type { Announcement } from "../types";

/*
 * `as const` SATISFIES el contrato Announcement[]
 *
 * `as const` es una "afirmación de constancia" en TypeScript.
 * Sin ella, TypeScript inferiría los tipos como `string` genérico.
 * Con `as const`, infiere los VALORES LITERALES como los tipos.
 *
 * Ejemplo:
 *   const x = "hola"      → tipo: string
 *   const x = "hola" as const → tipo: "hola" (el literal exacto)
 *
 * ¿Por qué importa? Porque sin `as const`, podrías poner cualquier
 * string en `date`. Con `as const`, TypeScript sabe que date es
 * exactamente "2025-01-15" y no cualquier string.
 *
 * `satisfies Announcement[]` es una GUARDA de tipo.
 * Verifica que el array cumple con el contrato Announcement[],
 * pero INFIERE el tipo más específico posible (gracias a `as const`).
 *
 * Sin `satisfies`: el tipo sería `Announcement[]` (pierdes los literales).
 * Sin `as const`: el tipo sería `string[]` (pierdes toda especificidad).
 * Juntos: "verifica que cumple el contrato, pero manten los valores exactos".
 */
export const ANNOUNCEMENTS = [
  {
    id: "1",
    title: "Bienvenidos a la Cartelera Digital",
    description:
      "Este es un sistema de visualización de anuncios. " +
      "Los anuncios rotan automáticamente cada 5 segundos. " +
      "Toca la pantalla para pausar la rotación.",
    date: "2025-01-15",
    backgroundColor: "#1a1a2e",
  },
  {
    id: "2",
    title: "Arquitectura de Software",
    description:
      "Separación de concerns: tipos en types/, datos en data/, " +
      "componentes en components/, rutas en app/. " +
      "Cada carpeta tiene UNA responsabilidad.",
    date: "2025-01-16",
    backgroundColor: "#16213e",
  },
  {
    id: "3",
    title: "React Native Bridge",
    description:
      "React Native NO traduce JSX a código nativo línea por línea. " +
      "Usa un BRIDGE (puente) asíncrono. El JS corre en un hilo separado " +
      "y envía mensajes JSON serializados al hilo nativo. " +
      "Con JSI (JavaScript Interface), ese puente es más directo.",
    date: "2025-01-17",
    backgroundColor: "#0f3460",
  },
  {
    id: "4",
    title: "Virtual DOM",
    description:
      "React mantiene una copia virtual del árbol de componentes. " +
      "Cuando cambia el estado, React compara (diffs) el Virtual DOM " +
      "anterior con el nuevo y SOLO aplica las diferencias al DOM real. " +
      "Eso se llama RECONCILIACIÓN y es por lo que React es rápido.",
    date: "2025-01-18",
    backgroundColor: "#533483",
  },
] as const satisfies Announcement[];
