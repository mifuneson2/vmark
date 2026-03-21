# ¿Cuánto costaría construir VMark?

::: info En resumen
VMark tiene aproximadamente 109,000 líneas de código de producción y 206,000 líneas de código de pruebas en TypeScript, Rust, CSS y Vue. Un equipo humano necesitaría **4,239 días-desarrollador** (~17 años-persona) para construirlo desde cero. A precios del mercado estadounidense, eso equivale a **$3.4–$4.2M USD**. Se construyó en **85 días calendario** por una sola persona con asistencia de IA, a un costo aproximado de **$2,000 USD** — un multiplicador de productividad de ~50x y una reducción de costos de ~99.9%.
:::

## Por qué existe esta página

Una pregunta aparece una y otra vez: *"¿Cuánto esfuerzo requirió VMark realmente?"*

Esto no es una página de marketing. Es un análisis transparente basado en datos reales del código — no en impresiones. Cada número aquí proviene de `tokei` (conteo de líneas), `git log` (historial) y `vitest` (conteo de pruebas). Puedes reproducir estos números tú mismo clonando el repositorio.

## Métricas en bruto

| Métrica | Valor |
|---------|-------|
| Código de producción (frontend TS/TSX) | 85,306 LOC |
| Código de producción (backend Rust) | 10,328 LOC |
| Código de producción (MCP server) | 4,627 LOC |
| CSS de producción | 8,779 LOC |
| Datos de localización i18n | 10,130 LOC |
| Sitio web (Vue + TS + docs) | 4,421 LOC + 75,930 líneas de docs |
| **Código de pruebas** | **206,077 LOC** (656 archivos) |
| Cantidad de pruebas | 17,255 tests |
| Documentación | 75,930 líneas (320 páginas, 10 idiomas) |
| Commits | 1,993 en 84 días activos |
| Tiempo calendario | 85 días (27 dic. 2025 — 21 mar. 2026) |
| Contribuidores | 2 (1 humano + IA) |
| Tasa de reescritura | 3.7x (1.23M inserciones / 330K líneas finales) |
| Ratio pruebas/producción | **2.06:1** |

### Qué significan estos números

- **Un ratio pruebas/producción de 2.06:1** es excepcional. La mayoría de los proyectos open source rondan el 0.3:1. VMark tiene más código de pruebas que código de producción — por un factor de dos.
- **Una tasa de reescritura de 3.7x** significa que por cada línea en el código base final, se escribieron 3.7 líneas en total (incluyendo reescrituras, refactorizaciones y código eliminado). Esto indica una iteración significativa — no "escribir una vez y entregar".
- **1,993 commits en 84 días activos** equivalen a un promedio de ~24 commits por día. El desarrollo asistido por IA produce muchos commits pequeños y enfocados.

## Desglose por complejidad

No todo el código es igual. Una línea de análisis de configuración no es lo mismo que una línea de código de plugin ProseMirror. Clasificamos el código base en cuatro niveles de complejidad:

| Nivel | Qué incluye | LOC | Ritmo (LOC/día) |
|-------|-------------|-----|------------------|
| **Rutina** (1.0x) | JSON i18n, tokens CSS, layouts de página, UI de ajustes | 23,000 | 150 |
| **Estándar** (1.5x) | Stores, hooks, componentes, puente MCP, exportación, comandos Rust, sitio web | 52,000 | 100 |
| **Complejo** (2.5x) | Plugins ProseMirror/Tiptap (multi-cursor, modo foco, vista previa de código, UI de tablas, guardia IME), integración CodeMirror, proveedor IA en Rust, MCP server | 30,000 | 50 |
| **Investigación** (4.0x) | Motor de formateo CJK, sistema de guardia de composición, auto-pair con detección IME | 4,000 | 25 |

Los ritmos "LOC/día" asumen un desarrollador senior escribiendo código probado y revisado — no salida bruta sin revisar.

### Por qué los plugins de editor son costosos

La parte más costosa de VMark es, sin duda, la **capa de plugins ProseMirror/Tiptap** — 34,859 líneas de código que gestionan selecciones de texto, transacciones de documentos, vistas de nodos y composición IME. Esto se considera ampliamente la categoría más difícil del desarrollo web:

- Se trabaja con un modelo de documento, no con un árbol de componentes
- Cada edición es una transacción que debe preservar la integridad del documento
- La composición IME (para entrada CJK) añade una máquina de estados paralela completa
- El multi-cursor requiere rastrear N selecciones independientes simultáneamente
- Deshacer/rehacer debe funcionar correctamente con todo lo anterior

Por eso la capa de plugins se clasifica como "Complejo" (multiplicador 2.5x) y el código CJK/IME como "Investigación" (4.0x).

## Estimación de esfuerzo

| Componente | LOC | Días-dev. |
|------------|-----|-----------|
| Nivel 1 — producción (rutina) | 23,000 | 153 |
| Nivel 2 — producción (estándar) | 52,000 | 520 |
| Nivel 3 — producción (complejo) | 30,000 | 600 |
| Nivel 4 — producción (investigación) | 4,000 | 160 |
| Código de pruebas | 206,077 | 1,374 |
| Documentación (10 idiomas) | 75,930 | 380 |
| **Subtotal** | | **3,187** |
| Gastos generales (diseño 5% + CI 3% + revisión 10%) | | 574 |
| Sobrecosto de reescritura (3.7x → +15%) | | 478 |
| **Total** | | **4,239 días-desarrollador** |

Eso equivale a aproximadamente **17 años-persona** de trabajo de ingeniería senior a tiempo completo.

::: warning Nota sobre el esfuerzo de pruebas
La suite de pruebas (206K LOC, 17,255 tests) representa **1,374 días-desarrollador** — más de un tercio del esfuerzo total. Este es el costo de la disciplina test-first del proyecto. Sin ella, el proyecto costaría ~40% menos de construir, pero sería significativamente más difícil de mantener.
:::

## Estimación de costos

Usando precios del mercado estadounidense (costo total — salario + beneficios + gastos generales):

| Escenario | Equipo | Duración | Costo |
|-----------|--------|----------|-------|
| Senior individual ($800/día) | 1 persona | 17.7 años | **$3.39M** |
| Equipo pequeño ($900/día prom.) | 3 personas | 2.3 años | **$3.82M** |
| Equipo completo ($1,000/día prom.) | 5 personas | 10.6 meses | **$4.24M** |

Los equipos no escalan linealmente. Un equipo de 5 personas es ~4 veces más productivo que una sola persona (no 5 veces) debido a la sobrecarga de comunicación — la Ley de Brooks en acción.

## La realidad de la IA

| Métrica | Valor |
|---------|-------|
| Tiempo calendario real | **85 días** (12 semanas) |
| Equivalente humano | 4,239 días-desarrollador (~17 años-persona) |
| **Multiplicador de productividad** | **~50x** |
| Costo real estimado | ~$2,000 (suscripción Claude Max) |
| Costo equivalente humano (individual) | $3.39M |
| **Reducción de costos** | **~99.9%** |

### Qué significa el multiplicador 50x

**No** significa que "la IA es 50 veces más inteligente que un humano". Significa:

1. **La IA no cambia de contexto.** Puede mantener todo el código base en memoria y hacer cambios en 10 archivos simultáneamente.
2. **La IA escribe pruebas a velocidad de producción.** Para un humano, escribir 17,255 pruebas es un trabajo agotador. Para la IA, es simplemente más código.
3. **La IA maneja el código repetitivo al instante.** La capa de traducción en 10 idiomas (10,130 LOC de JSON + 320 páginas de docs) le tomaría semanas a un equipo humano. La IA lo hace en minutos.
4. **La IA no se aburre.** Los 656 archivos de prueba que cubren casos límite, composición IME y formateo CJK son exactamente el tipo de trabajo que los humanos suelen omitir.

El rol del humano fue el juicio — *qué* construir, *cuándo* detenerse, *qué* enfoque tomar. El rol de la IA fue el trabajo — escribir, probar, depurar, traducir.

## Comparación con el mercado

| Dimensión | VMark | Typora | Zettlr | Mark Text |
|-----------|-------|--------|--------|-----------|
| Función principal | Markdown WYSIWYG + Source | Markdown WYSIWYG | Markdown académico | Markdown WYSIWYG |
| LOC (est.) | ~109K prod. | ~200K (código cerrado) | ~80K | ~120K |
| Contribuidores | 2 (1 humano + IA) | 1–2 (cerrado) | ~50 | ~100 |
| Antigüedad | **3 meses** | 8+ años | 6+ años | 6+ años |
| Precio | Gratuito (beta) | Licencia de $15 | Gratuito / OSS | Gratuito / OSS |
| Diferenciador clave | Nativo Tauri, MCP AI, CJK nativo, multi-cursor | Pulido, exportación PDF | Zettelkasten, citas | Electron, maduro |

### Qué muestra esta comparación

VMark alcanzó un tamaño de código base y un conjunto de funcionalidades comparables en **85 días** — lo que a otros proyectos les tomó **6 a 8 años** con equipos de 50 a 100 contribuidores. La disciplina de pruebas (17K tests, ratio 2:1) supera a todos los editores Markdown open source en esta comparación.

Esto no es porque VMark sea "mejor" — es más joven y menos probado en batalla. Pero demuestra lo que el desarrollo asistido por IA hace posible: una sola persona puede producir resultados que antes requerían un equipo financiado.

## Qué hace costoso construir VMark

Tres factores impulsan el costo:

1. **Complejidad de los plugins del editor** — 34,859 LOC de plugins ProseMirror que tocan selecciones, transacciones, vistas de nodos y composición IME. Este es código de nivel 3/4 que un especialista senior en frameworks de edición escribiría a ~50 LOC/día.

2. **Disciplina de pruebas extrema** — Un ratio pruebas/producción de 2.06:1 significa que el código de pruebas solo (206K LOC) requiere más esfuerzo que el código de producción. Es una inversión deliberada — es lo que hace sostenible el desarrollo asistido por IA.

3. **i18n completa en 10 idiomas** — 320 páginas de documentación, 80 archivos JSON de localización y un sitio web completamente localizado. Esta es una escala operativa que normalmente solo se ve en productos comerciales financiados, no en proyectos individuales.

## Reproducir estos números

Todas las métricas son reproducibles desde el repositorio público:

```bash
# Clonar e instalar
git clone https://github.com/xiaolai/vmark.git
cd vmark && pnpm install

# Métricas LOC (requiere tokei: brew install tokei)
tokei --exclude node_modules --exclude dist .

# Historial de Git
git log --oneline | wc -l
git log --format='%ai' | awk '{print $1}' | sort -u | wc -l

# Conteo de pruebas
pnpm vitest run src/ 2>&1 | tail -5
```

::: tip Metodología
Los niveles de referencia de productividad (ritmos LOC/día) utilizados en este análisis son estimaciones estándar de la industria para desarrolladores senior escribiendo código probado y revisado. Provienen de la literatura de estimación de software (McConnell, Capers Jones) y están calibrados para producción de calidad industrial — no para prototipos o código de prueba de concepto.
:::
