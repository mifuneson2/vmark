# Por que los prompts en ingles producen mejor codigo

Las herramientas de programacion con IA funcionan mejor cuando les das prompts en ingles — incluso si el ingles no es tu lengua materna. El plugin [claude-english-buddy](https://github.com/xiaolai/claude-english-buddy-for-claude) autocorrige, traduce y refina tus prompts automaticamente.

## Por que el ingles importa para la programacion con IA

### Los LLMs piensan en ingles

Los modelos de lenguaje grandes procesan internamente todos los idiomas a traves de un espacio de representacion que esta fuertemente alineado con el ingles.[^1] Pretraducir los prompts en otros idiomas al ingles antes de enviarlos al modelo mejora de forma medible la calidad de la salida.[^2]

En la practica, un prompt en chino como "把这个函数改成异步的" funciona — pero el equivalente en ingles "Convert this function to async" produce codigo mas preciso con menos iteraciones.

### El uso de herramientas hereda el idioma del prompt

Cuando una herramienta de programacion con IA busca en la web, lee documentacion o consulta referencias de API, utiliza el idioma de tu prompt para esas consultas. Las consultas en ingles encuentran mejores resultados porque:

- La documentacion oficial, Stack Overflow y los issues de GitHub estan predominantemente en ingles
- Los terminos de busqueda tecnicos son mas precisos en ingles
- Los ejemplos de codigo y mensajes de error casi siempre estan en ingles

Un prompt en chino que pregunte sobre "状态管理" puede buscar recursos en chino, perdiendo la documentacion canonica en ingles. Los benchmarks multilingues muestran consistentemente brechas de rendimiento de hasta un 24% entre el ingles y otros idiomas — incluso los bien representados como el frances o el aleman.[^3]

## El plugin `claude-english-buddy`

`claude-english-buddy` es un plugin de Claude Code que intercepta cada prompt y lo procesa a traves de uno de cuatro modos:

| Modo | Activador | Que sucede |
|------|-----------|------------|
| **Correct** | Prompt en ingles con errores | Corrige ortografia/gramatica, muestra los cambios |
| **Translate** | Se detecta otro idioma (CJK, cirilico, etc.) | Traduce al ingles, muestra la traduccion |
| **Refine** | Prefijo `::` | Reescribe una entrada vaga en un prompt preciso y estructurado |
| **Skip** | Texto corto, comandos, URLs, codigo | Lo deja pasar sin cambios |

El plugin usa Claude Haiku para las correcciones — rapido y economico, sin ninguna interrupcion en tu flujo de trabajo.

### Autocorreccion (por defecto)

Simplemente escribe con normalidad. El plugin detecta el idioma automaticamente:

```
You type:    "refactor the autentication modul, its got too many responsibilties"

You see:     Refactor the authentication module. It has too many responsibilities.
             (autentication>authentication; modul>module; its got>it has;
              responsibilties>responsibilities)

Claude sees: the corrected version and responds normally.
```

Cuando tu prompt es correcto — silencio. Sin ruido. El silencio significa que es correcto.

### Traduccion

Los prompts en otros idiomas se traducen automaticamente:

```
You type:    这个组件渲染太慢了，每次父组件更新都会重新渲染，帮我优化一下

You see:     Optimize this component to prevent unnecessary re-renders when
             the parent component updates.
             (Chinese)

Claude sees: the English translation.
```

### Refinamiento de prompts con `::`

Usa el prefijo `::` en tu prompt para refinar una idea aproximada en un prompt preciso:

```
:: make the search faster it's really slow with big files
```

Se convierte en:

```
Optimize the search implementation for large files. Profile the current
bottleneck and consider debouncing, web workers, or incremental matching.
```

El prefijo `::` funciona para cualquier idioma — traduce y reestructura en un solo paso.[^4]

::: tip Cuando el plugin permanece en silencio
Los comandos cortos (`yes`, `continue`, `option 2`), los slash commands, las URLs y los fragmentos de codigo se dejan pasar sin cambios. Sin viajes de ida y vuelta innecesarios.
:::

## Seguimiento de tu progreso

El plugin registra cada correccion. A lo largo de las semanas, puedes ver como mejora tu ingles:

| Comando | Que muestra |
|---------|-------------|
| `/claude-english-buddy:today` | Correcciones de hoy, errores recurrentes, lecciones, tendencia |
| `/claude-english-buddy:stats` | Tasa de errores a largo plazo y trayectoria de mejora |
| `/claude-english-buddy:mistakes` | Patrones recurrentes historicos — tus puntos ciegos |

## Configuracion

Instala el plugin en Claude Code:

```bash
/plugin marketplace add xiaolai/claude-plugin-marketplace
/plugin install claude-english-buddy@xiaolai
```

No se necesita configuracion adicional — la autocorreccion comienza inmediatamente.

### Configuracion opcional

Crea `.claude-english-buddy.json` en la raiz de tu proyecto para personalizar:

```json
{
  "auto_correct": true,
  "summary_language": "Chinese",
  "strictness": "standard",
  "domain_terms": ["ProseMirror", "Tiptap", "Zustand"]
}
```

| Ajuste | Opciones | Por defecto |
|--------|----------|-------------|
| `auto_correct` | `true` / `false` | `true` |
| `strictness` | `gentle`, `standard`, `strict` | `standard` |
| `summary_language` | Cualquier nombre de idioma, o `null` para desactivar | `null` |
| `domain_terms` | Array de terminos a preservar sin cambios | `[]` |

Cuando `summary_language` esta configurado, Claude agrega un breve resumen en ese idioma al final de cada respuesta — util cuando quieres las decisiones clave en tu idioma nativo.[^5]

[^1]: Los LLMs multilingues toman decisiones clave en un espacio de representacion mas cercano al ingles, independientemente del idioma de entrada/salida. Usando una lente logit para sondear las representaciones internas, los investigadores encontraron que las palabras con carga semantica (como "water" o "sun") se seleccionan en ingles antes de traducirse al idioma de destino. El direccionamiento de activacion tambien es mas efectivo cuando se calcula en ingles. Vease: Schut, L., Gal, Y., & Farquhar, S. (2025). [Do Multilingual LLMs Think In English?](https://arxiv.org/abs/2502.15603). *arXiv:2502.15603*.

[^2]: Pretraducir sistematicamente los prompts en otros idiomas al ingles antes de la inferencia mejora la calidad de la salida de los LLMs en multiples tareas e idiomas. Los investigadores descomponen los prompts en cuatro partes funcionales (instruccion, contexto, ejemplos, salida) y demuestran que la traduccion selectiva de componentes especificos puede ser mas efectiva que traducir todo. Vease: Watts, J., Batsuren, K., & Gurevych, I. (2025). [Beyond English: The Impact of Prompt Translation Strategies across Languages and Tasks in Multilingual LLMs](https://arxiv.org/abs/2502.09331). *arXiv:2502.09331*.

[^3]: El benchmark MMLU-ProX — 11,829 preguntas identicas en 29 idiomas — encontro brechas de rendimiento de hasta un 24.3% entre el ingles y los idiomas con pocos recursos. Incluso idiomas bien representados como el frances y el aleman muestran una degradacion medible. La brecha se correlaciona fuertemente con la proporcion de cada idioma en el corpus de preentrenamiento del modelo, y simplemente escalar el tamano del modelo no la elimina. Vease: [MMLU-ProX: A Multilingual Benchmark for Advanced LLM Evaluation](https://mmluprox.github.io/) (2024); Palta, S. & Rudinger, R. (2024). [Language Ranker: A Metric for Quantifying LLM Performance Across High and Low-Resource Languages](https://arxiv.org/abs/2404.11553).

[^4]: El prompting few-shot — proporcionar ejemplos de entrada/salida dentro del prompt — mejora dramaticamente el rendimiento de los LLMs en tareas. El articulo fundacional de GPT-3 demostro que, mientras el rendimiento zero-shot mejora de manera constante con el tamano del modelo, el rendimiento few-shot aumenta *mas rapidamente*, alcanzando a veces la competitividad con modelos fine-tuned. Los modelos mas grandes son mas competentes para aprender de ejemplos en contexto. Vease: Brown, T., Mann, B., Ryder, N., et al. (2020). [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165). *NeurIPS 2020*.

[^5]: Los prompts estructurados y bien disenados superan consistentemente a las instrucciones vagas en tareas de generacion de codigo. Tecnicas como el razonamiento en cadena de pensamiento, la asignacion de roles y las restricciones explicitas de alcance mejoran la precision en el primer intento. Vease: Sahoo, P., Singh, A.K., Saha, S., et al. (2025). [Unleashing the Potential of Prompt Engineering for Large Language Models](https://www.sciencedirect.com/science/article/pii/S2666389925001084). *Patterns*.
