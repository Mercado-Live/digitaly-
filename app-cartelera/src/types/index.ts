/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             TIPOS COMPARTIDOS (Data Contracts)                              ║
║                                                                             ║
║  En Ciencias de la Computación, un "tipo" es un CONTRATO. Define la         ║
║  forma exacta que debe tener un dato para que el programa funcione.         ║
║                                                                             ║
║  Piénsalo como un molde de gelatina: si el molde tiene 3 agujeros,          ║
║  cualquier gelatina que viertas tendrá exactamente esa forma.               ║
║  TypeScript verifica esto en TIEMPO DE COMPILACIÓN — antes de que           ║
║  el código siquiera se ejecute. Esto es lo que se llama                       ║
║  "static type checking" vs. "runtime type checking".                        ║
║                                                                             ║
║  JavaScript puro solo descubre errores cuando ejecuta (runtime).            ║
║  TypeScript los encuentra mientras escribes (compile-time).                 ║
║  Esto es análogo a la diferencia entre un lenguaje compilado (C++, Rust)    ║
║  y uno interpretado (Python, JS). La compensación: más seguridad           ║
║  a cambio de un paso adicional de compilación.                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * INTERFACE vs TYPE
 * ──────────────────────────────────────────────────────────────────────────────
 * Ambas definen la "forma" de un objeto. La diferencia técnica es sutil:
 *
 * - `interface`: es extensible (puedes declararla varias veces y se fusionan).
 *                Se usa para definir contratos de objetos/clases públicos.
 *                Es más rápida en compilación (mejor performance).
 *
 * - `type`:  es una "alias". Una vez definido, NO se puede reabrir.
 *            Sirve para uniones (|), intersecciones (&), tuplas, etc.
 *            Cosas que interface no puede expresar.
 *
 * Regla de oro en la industria: usa `interface` por defecto para objetos,
 * usa `type` cuando NECESITES uniones, intersecciones o tipos complejos.
 * ──────────────────────────────────────────────────────────────────────────────
 */

/*
 * Cada anuncio en nuestra cartelera digital tiene:
 * - Un identificador único (string UUID o numérico)
 * - Un título (string)
 * - Una descripción (string opcional)
 * - Una fecha de publicación (string ISO)
 * - Un color de fondo opcional (string hex)
 *
 * El `readonly` en TS significa: esta propiedad no se puede reasignar
 * después de creada. No es "inmutabilidad del dato" (el array/objeto
 * al que apunta puede mutar), es "inmutabilidad de la referencia".
 *
 * Es similar a `const` en JavaScript, pero a nivel de propiedad.
 */
export interface Announcement {
  readonly id: string;
  readonly title: string;
  readonly description?: string;
  readonly date: string;
  readonly backgroundColor?: string;
}

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * ¿Por qué `export`?
 * ──────────────────────────────────────────────────────────────────────────────
 * Los módulos de JavaScript (ES Modules, o ESM) son ARCHIVOS.
 * Cada archivo tiene su propio SCOPE. Lo que no se exporta, no existe
 * fuera de ese archivo. Esto se llama "encapsulamiento a nivel de módulo".
 *
 * Sin `export`, TypeScript/JS asume que es código privado del archivo.
 * Esto evita colisiones de nombres y obliga a ser explícito sobre
 * qué partes de tu código forman la "API pública" vs. "implementación interna".
 *
 * Es el mismo principio que `public`/`private` en Java o C++, pero
 * a nivel de archivo en lugar de a nivel de clase.
 * ──────────────────────────────────────────────────────────────────────────────
 */
