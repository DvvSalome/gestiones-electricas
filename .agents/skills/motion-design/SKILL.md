---
name: motion-design
description: Guía y comandos para crear animaciones y motion design utilizando Higgsfield.ai y Seedance 2.0. Permite estructurar prompts, transiciones de cámara, personajes y efectos visuales de alta conversión.
allowed-tools:
  - Read
  - Write
  - RunCommand
---

# Skill de Motion Design para Higgsfield.ai y Seedance 2.0

## Propósito
Esta skill define las pautas de diseño de movimiento, estructuración de prompts de video, transiciones de cámara y estilos visuales para crear animaciones y videos promocionales de alto impacto utilizando **Higgsfield.ai** y **Seedance 2.0**.

---

## 1. Conector MCP (Model Context Protocol)
El conector permite a Claude interactuar directamente con la API y los modelos generativos de Higgsfield.

* **Nombre del Conector:** `Higgsfield`
* **URL del Conector:** `https://mcp.higgsfield.ai`
* **Comando de Invocación:** `/motiondesign [prompt]`

---

## 2. Tipos de Generación en Higgsfield.ai
Higgsfield.ai soporta las siguientes capacidades clave que esta skill debe guiar al usuario a emplear:

1. **Create Video (Creación de Video):** Generación de video de alta fidelidad de 9:16 o 16:9 desde texto.
2. **AI Character (Personaje IA):** Mapeo de identidad para mantener al personaje 100% consistente a lo largo de cortes.
3. **Convert Video (Video-to-Video):** Aplicación de efectos de movimiento y morphing sobre videos base.
4. **Audio Sync (Sincronización de Audio):** Ajuste de animación labial (lip-sync) o ritmo visual con una pista de audio.
5. **Expand Canvas (Expansión de Lienzo):** Outpainting de fotogramas de video para cambiar la escala.

---

## 3. Estructuración de Prompts para Motion Design

Para obtener videos fluidos con estética de "Motion Design" premium, los prompts deben seguir la estructura de **Hook, Transition, Camera Motion y Visual Accents**:

### Reglas de Prompts de Seedance 2.0:
* **Detalles del Objeto:** Definir la geometría, materiales (ej: vidrio flotante, metal pulido, oro champaña) y reflejos.
* **Movimiento de Cámara (Kinetic Motion):** Usar palabras clave de cámara física: `slow tracking orbit`, `whip pan`, `dolly-in`, `crash zoom`, `aggressive 360-degree rotation`.
* **Atmósfera y Luces:** Definir el contraste de luz: `champagne gold rim light`, `deep shadows`, `single overhead spotlight`, `anamorphic lens flare`, `floating dust motes`.
* **Evitar Elementos Indeseados:** Usar cláusulas de control: `no text, no external logos, no people, clean flat background`.

### Ejemplos de Prompts:

#### 1. Revelación de Interfaz de Producto (Abstracto/SaaS)
> `"/motiondesign A dashboard interface displayed on a floating glass screen suspended in dark warm space. Camera orbits 90 degrees around it in slow motion, revealing graphs and text transitioning. Dark background, screen content glowing softly in gold typography accents. Editorial product cinematography, anamorphic lens flares, dust motes. 9:16 vertical, no people."`

#### 2. Transición de Objeto (Morphing)
> `"/motiondesign A close-up shot of a traditional paper legal document floating. A digital laser line sweeps down, morphing the paper into a glowing holographic shield with a golden checkmark icon. Tech-forward, high contrast dark environment, gold particle burst, kinetic zoom. 9:16 vertical."`

---

## 4. Flujo de Trabajo en Claude Chat UI
Cuando se activa esta skill, Claude debe:
1. **Definir el Guion Gráfico (Storyboard):** Detallar cada toma del video promocional (Duración, VO, Prompt visual).
2. **Generar los Prompts de Higgsfield:** Estructurar el prompt con la etiqueta `/motiondesign` para que el conector web lo procese.
3. **Ofrecer Botones de Interacción Rápida:**
   * **Download:** Para exportar el clip a local.
   * **Predict Virality:** Análisis predictivo de enganche para redes sociales.
   * **Recreate:** Regeneración con variación de semilla (seed) o temperatura de movimiento.
