/*
╔══════════════════════════════════════════════════════════════════════════════╗
║             BillboardSlide — TARJETA DE ANUNCIO INDIVIDUAL                  ║
║                                                                             ║
║  Componente presentacional puro (dumb component).                           ║
║  Recibe un Announcement y lo renderiza.                                     ║
║  No tiene estado, no tiene efectos, no tiene lógica de negocio.             ║
║                                                                             ║
║  En TV: muestra un FOCUS RING (anillo de enfoque) cuando isTVFocused        ║
║  es true. El anillo es un borde blanco semitransparente de 4dp que          ║
║  rodea el slide. No se usa el sistema de foco nativo (onFocus/onBlur)      ║
║  porque Billboard maneja el foco con TVEventHandler. El anillo es           ║
║  puramente VISUAL, no funcional.                                            ║
║                                                                             ║
║  También ajusta tamaños de texto cuando IS_TV es true para que              ║
║  el contenido sea legible desde 2-4 metros de distancia.                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
*/

import { View, Text, StyleSheet } from "react-native";
import type { Announcement } from "../types";
import { IS_TV, tvScale, TV_FOCUS_RING_WIDTH, TV_FOCUS_RING_COLOR } from "../utils/tv";

interface BillboardSlideProps {
  readonly announcement: Announcement;

  /*
   * isTVFocused: true cuando este slide es el actual Y el usuario está
   * interactuando con el control remoto. Se usa para mostrar el focus ring.
   *
   * Nota: NO es el foco nativo del TV focus engine. Es un estado manejado
   * por Billboard que sincroniza el focus ring con currentSlideIndex.
   *
   * ¿Por qué no usar el focus engine nativo?
   * Porque el ScrollView + pagingEnabled tiene comportamiento impredecible
   * con el TV focus system (el scroll y el foco compiten). Al manejar el
   * foco VISUALMENTE desde Billboard, evitamos esa competencia.
   */
  readonly isTVFocused?: boolean;
}

export default function BillboardSlide({
  announcement,
  isTVFocused = false,
}: BillboardSlideProps) {
  const { title, description, backgroundColor } = announcement;

  return (
    /*
     * El contenedor del slide usa un array de estilos:
     * 1. styles.container (base: flex, centrado, padding)
     * 2. { backgroundColor } (dinámico: viene de los datos)
     * 3. IS_TV && tvFocusRing (condicional: solo en TV cuando enfocado)
     *
     * La composition de estilos con array permite que CADA estilo
     * sobrescriba propiedades del anterior. El foco ring TV necesita
     * borderWidth y borderColor, que no existen en los estilos base,
     * así que se agregan sin conflicto.
     */
    <View
      style={[
        styles.container,
        { backgroundColor },
        IS_TV && isTVFocused && styles.tvFocusRing,
      ]}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            /*
             * En TV, el título escala 1.5× (32 → 48dp).
             * tvScale() multiplica el tamaño base por la constante
             * TV_TEXT_SCALE si IS_TV es true, o devuelve el original si no.
             *
             * Esto evita tener que hacer:
             *   IS_TV ? { fontSize: 48 } : { fontSize: 32 }
             * en cada propiedad.
             */
            IS_TV && { fontSize: tvScale(32) },
          ]}
        >
          {title}
        </Text>

        {description && (
          <Text
            style={[
              styles.description,
              IS_TV && { fontSize: tvScale(18), lineHeight: tvScale(28) },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
    </View>
  );
}

/*
 * ──────────────────────────────────────────────────────────────────────────────
 * ESTILOS
 * ──────────────────────────────────────────────────────────────────────────────
 *
 * styles.tvFocusRing se aplica CONDICIONALMENTE desde el JSX.
 * No está en el StyleSheet base porque solo existe en TV.
 * StyleSheet.create() no puede crear estilos condicionales,
 * así que los estilos TV se definen como objetos planos.
 *
 * Alternativa: crear dos StyleSheets (base y tv) y combinarlos.
 * Pero para 2-3 propiedades, un objeto plano es más legible.
 */
const tvFocusRing = {
  borderWidth: TV_FOCUS_RING_WIDTH,
  borderColor: TV_FOCUS_RING_COLOR,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  content: {
    maxWidth: 600,
    width: "100%",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 18,
    lineHeight: 28,
    color: "rgba(255, 255, 255, 0.85)",
    textAlign: "center",
  },
});
