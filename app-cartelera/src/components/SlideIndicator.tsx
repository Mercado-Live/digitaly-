/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             SlideIndicator — COMPONENTE DE PRESENTACIÓN PURA                ║
║                                                                             ║
║  Este componente es un "componente tonto" (o "dumb component" /              ║
║  "presentational component").                                               ║
║                                                                             ║
║  CARACTERÍSTICAS DE UN COMPONENTE TONTO:                                    ║
║  1. NO tiene estado interno (no usa useState)                               ║
║  2. NO tiene efectos secundarios (no usa useEffect)                         ║
║  3. SOLO recibe datos por props y renderiza                                 ║
║  4. Es 100% predecible — mismos props → mismo output siempre                ║
║                                                                             ║
║  Esto se llama "función pura" en programación funcional:                    ║
║  Dada la misma entrada, produce la misma salida, sin efectos secundarios.   ║
║  Es el mismo concepto que f(x) = x² en matemáticas.                          ║
║                                                                             ║
║  La alternativa son los "componentes inteligentes" (container/controller)  ║
║  que manejan estado, efectos, y lógica de negocio.                          ║
║  SEPARARLOS es el patrón CONTAINER-PRESENTATIONAL de Dan Abramov.          ║
║  Beneficio: puedes probar el presentational sin mockear nada.               ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { View, StyleSheet } from "react-native";
import { IS_TV, tvScale } from "../utils/tv";

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * INTERFACE DE PROPS
 * ──────────────────────────────────────────────────────────────────────────────
 * "Props" es shorthand para "properties".
 *
 * En React, los props son el mecanismo para pasar datos de un componente
 * PADRE a un componente HIJO. El flujo de datos es UNIDIRECCIONAL:
 * siempre de padre a hijo. Esto se llama "one-way data binding".
 *
 * Contrasta con Angular, que tiene two-way data binding (con ngModel).
 * One-way es más predecible: sabes exactamente de dónde viene cada
 * cambio de estado. Two-way es más cómodo para formularios pero
 * hace el flujo de datos más difícil de rastrear.
 *
 * En React, la comunicación hijo→padre se hace con CALLBACKS:
 * el padre le pasa una función al hijo, y el hijo la llama.
 * Es decir, el control siempre vuelve al padre.
 * ──────────────────────────────────────────────────────────────────────────────
 */
interface SlideIndicatorProps {
  /*
   * `readonly` en las props NO es obligatorio en TypeScript,
   * pero es una convención de buenas prácticas. Las props de un
   * componente NUNCA deben ser modificadas por el componente hijo.
   * Si necesitas modificar un prop, estás violando el principio
   * de "inmutabilidad de props" y probablemente necesitas estado.
   *
   * React ES扇形mente lanza un error en desarrollo si MODIFICAS
   * las props directamente (en realidad las congela con Object.freeze
   * en modo desarrollo, pero no en producción).
   */
  readonly totalSlides: number;
  readonly activeIndex: number;
}

export default function SlideIndicator({
  totalSlides,
  activeIndex,
}: SlideIndicatorProps) {
  /*
   * ──────────────────────────────────────────────────────────────────────────
   * ¿Por qué generamos un array con `Array.from`?
   * ──────────────────────────────────────────────────────────────────────────
   *
   * JSX no tiene bucles. JSX es AZÚCAR SINTÁCTICO sobre
   * `React.createElement(type, props, ...children)`.
   *
   * No puedes escribir:
   *   <View>
   *     {for (let i = 0; i < totalSlides; i++) { <View /> }}
   *   </View>
   *
   * Porque JSX se transforma en expresiones, no en statements.
   * Un `for` es un statement (no produce un valor).
   * Un `.map()` es una expresión (produce un array).
   *
   * Por eso en React SIEMPRE usamos .map() en lugar de for loops
   * dentro del JSX. Es una limitación de que JSX es un azúcar
   * sobre llamadas a funciones, no un template engine como
   * Angular o Jinja.
   *
   * `Array.from({ length: n })` crea [undefined, undefined, ...] de
   * longitud n, y luego .map((_, i) => ...) transforma cada posición
   * en su índice. Podríamos haber hecho:
   *   [...Array(totalSlides)].map(...)
   * Pero Array.from es más explícito.
   * ──────────────────────────────────────────────────────────────────────────
   */

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * EL ATRIBUTO CLAVE (key)
   * ──────────────────────────────────────────────────────────────────────────
   *
   * Cuando renderizas una lista en React, CADA ELEMENTO necesita
   * una prop `key` única. Esto NO es opcional — es crucial para
   * el algoritmo de RECONCILIACIÓN de React.
   *
   * ¿Qué pasa si no pones key?
   * React usa el ÍNDICE del array como key por defecto.
   *
   * ¿Cuándo está bien usar el índice?
   * - La lista es estática (no se reordena, no se filtra)
   * - Los items no tienen identidad propia
   * - La lista es corta
   *
   * ¿Cuándo es PELIGROSO usar el índice?
   * - Cuando la lista se reordena (React mezcla el estado visual)
   * - Cuando insertas/eliminas elementos del medio
   *   (los índices cambian, React pinta mal)
   *
   * Regla de oro: si tus datos tienen un `id`, USA ESE id como key.
   * Los IDs son estables, únicos, y predecibles.
   * Los índices son volátiles.
   *
   * `key` ayuda a React a IDENTIFICAR qué elementos cambiaron,
   * se agregaron o se eliminaron. Sin key, React tiene que
   * adivinar y a menudo se equivoca → bugs de UI.
   * ──────────────────────────────────────────────────────────────────────────
   */

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * ANÁLISIS DE LA EXPRESIÓN:
   *   activeIndex === index ? styles.dotActive : styles.dotInactive
   * ──────────────────────────────────────────────────────────────────────────
   *
   * Esto es un OPERADOR TERNARIO: condición ? valor_si_true : valor_si_false.
   *
   * Es el equivalente a:
   *   if (activeIndex === index) {
   *     return styles.dotActive;
   *   } else {
   *     return styles.dotInactive;
   *   }
   *
   * Pero como expresión (produce un valor), no como statement.
   * En JSX, las llaves { } aceptan expresiones, no statements.
   *
   * Es la misma restricción que hace que necesitemos .map()
   * en lugar de for: JSX solo acepta expresiones dentro de { }.
   * ──────────────────────────────────────────────────────────────────────────
   */
  const dots = Array.from({ length: totalSlides }).map((_, index) => {
    const isActive = activeIndex === index;
    return (
      <View
        key={index}
        /*
         * La prop `style` acepta un array de estilos.
         * React los MERGEA en orden: el último gana si hay conflicto.
         * Esto es el patrón de "style composition" — útil para
         * combinar estilos base con variantes.
         *
         * Alternativa: crear un StyleSheet dinámico.
         * Pero eso recrea el objeto en cada render.
         * Con el array, solo referencias a estilos estáticos.
         *
         * NOTA: esto NO es performante en listas largas (FlatList)
         * porque crea un nuevo array en cada render.
         * Para 4-5 dots, es irrelevante.
         */
        style={[
          styles.dot,
          /*
           * `isActive` determina qué estilo adicional se aplica.
           * Si es true, se aplica dotActive (opaco, más grande).
           * Si es false, se aplica dotInactive (translúcido, más chico).
           *
           * En CSS/Tailwind, harías:
           *   class={`dot ${isActive ? 'dot-active' : 'dot-inactive'}`}
           *
           * En React Native, no hay clases CSS — todo es StyleSheet.
           * StyleSheet.create() es un "precompilador" que valida
           * propiedades y optimiza (en web genera IDs numéricos
           * de clase, en native es un objeto plano).
           */
          isActive ? styles.dotActive : styles.dotInactive,
          IS_TV && (isActive ? styles.tvDotActive : styles.tvDotInactive),
        ]}
      />
    );
  });

  return (
    /*
     * El contenedor de los dots usa flexBox con gaps.
     *
     * FlexBox en React Native es el sistema de layout.
     * Viene de CSS Flexbox, pero con diferencias:
     * - Por defecto, flexDirection es 'column' (en CSS es 'row')
     * - No hay "justify-content: space-between" con más de 1 línea
     * - Flex: 1 significa "ocupa todo el espacio disponible"
     *
     * ¿Por qué React Native usa Flexbox?
     * Porque es nativo (no hay CSS en mobile) y Flexbox es
     * dimensionalmente independiente (funciona en cualquier
     * tamaño de pantalla). Es un diseño RELATIVO, no absoluto.
     */
    <View style={styles.container}>{dots}</View>
  );
}

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * StyleSheet.create() vs. objeto plano { }
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * `StyleSheet.create()` es OPTIMIZADO por React Native.
 * En desarrollo: valida propiedades y da warnings si escribes
 * mal un nombre de propiedad (p.ej., `backgrounColor` en vez de
 * `backgroundColor`).
 *
 * En producción: los estilos se registran por ID numérico,
 * no se pasa el objeto completo a través del bridge.
 * Eso ahorra serialización JSON entre el hilo JS y el hilo nativo.
 *
 * Objetos planos `{ }` se crean en cada render (nueva referencia).
 * `StyleSheet.create()` se crea UNA VEZ (referencia constante).
 *
 * En React, las referencias importan: React.memo() compara props
 * por referencia, no por valor. Si pasas un objeto plano nuevo
 * en cada render, React.memo() no puede optimizar.
 *
 * Conclusión: siempre usa StyleSheet.create() para estilos estáticos.
 * Usa arrays o objetos inline SOLO para estilos dinámicos.
 * ──────────────────────────────────────────────────────────────────────────────
 */
const styles = StyleSheet.create({
  container: {
    /*
     * flexDirection: 'row' — alinea los hijos en horizontal.
     * Por defecto en RN es 'column' (a diferencia de CSS que es 'row').
     * Esto es porque en mobile, las pantallas son verticales y
     * el layout más común es vertical (scroll, listas).
     */
    flexDirection: "row",

    /*
     * gap — separación entre hijos.
     * Es una propiedad moderna de Flexbox (CSS 2021).
     * En RN, está disponible desde hace años.
     * Alternativa antigua: darle marginHorizontal a cada hijo.
     * gap es más limpio porque evita "margin leakage"
     * (el margen del último hijo que sobra).
     */
    gap: 8,

    /*
     * justifyContent: 'center' — centra los hijos horizontalmente
     * (porque flexDirection es 'row').
     * Si flexDirection fuera 'column', centraría verticalmente.
     * El eje principal (main axis) sigue la dirección del flex.
     * El eje transversal (cross axis) es perpendicular.
     */
    justifyContent: "center",

    /*
     * alignItems: 'center' — centra los hijos en el eje transversal.
     * Con flexDirection: 'row', align-items controla el eje vertical.
     * Es decir: justifyContent → horizontal, alignItems → vertical.
     */
    alignItems: "center",

    /*
     * paddingVertical da espacio interno arriba y abajo.
     * paddingHorizontal haría lo mismo a los lados.
     * Es shorthand para paddingTop + paddingBottom.
     */
    paddingVertical: 12,
  },

  dot: {
    /*
     * borderRadius: la mitad de width/height → círculo perfecto.
     * Es el truco clásico para hacer círculos en CSS/RN.
     * Con width=8 y height=8, borderRadius: 4 da un círculo.
     * Si borderRadius > half la dimensión, se comporta como si
     * fuera half (sigue siendo círculo).
     */
    width: 8,
    height: 8,
    borderRadius: 4,

    /*
     * backgroundColor se define aquí con un valor por defecto.
     * El estilo dinámico (dotActive/dotInactive) SOBREESCRIBE
     * esta propiedad porque va DESPUÉS en el array de estilos.
     * Esto es OVERRIDE por orden, no por especificidad.
     */
    backgroundColor: "#ffffff",
  },

  dotActive: {
    /*
     * Opacidad 1 → totalmente visible.
     * El dot activo es más grande (10px) y opaco.
     * Esto comunica visualmente "este es el slide actual".
     */
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 1,
  },

  dotInactive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.4,
  },

  /*
   * ──────────────────────────────────────────────────────────────────────────
   * ESTILOS TV
   * ──────────────────────────────────────────────────────────────────────────
   * Los dots en TV son ~1.5× más grandes que en móvil para ser visibles
   * desde distancia. También aumentamos la opacidad del dot activo para
   * que resalte más en pantallas OLED/LED con mucho brillo ambiental.
   *
   * Se aplican CONDICIONALMENTE en el array de estilos del JSX
   * (solo si IS_TV es true).
   * ──────────────────────────────────────────────────────────────────────────
   */
  tvDotActive: {
    width: tvScale(10),
    height: tvScale(10),
    borderRadius: tvScale(5),
    opacity: 1,
  },

  tvDotInactive: {
    width: tvScale(8),
    height: tvScale(8),
    borderRadius: tvScale(4),
    opacity: 0.4,
  },
});
