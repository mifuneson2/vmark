# Solución de problemas

## Archivos de registro

VMark genera archivos de registro para ayudar a diagnosticar problemas. Los registros incluyen advertencias y errores tanto del backend de Rust como del frontend.

### Ubicación de los archivos de registro

| Plataforma | Ruta |
|------------|------|
| macOS | `~/Library/Logs/app.vmark/` |
| Windows | `%APPDATA%\app.vmark\logs\` |
| Linux | `~/.local/share/app.vmark/logs/` |

### Niveles de registro

| Nivel | Qué se registra | Producción | Desarrollo |
|-------|-----------------|------------|------------|
| Error | Fallos, cierres inesperados | Sí | Sí |
| Warn | Problemas recuperables, alternativas | Sí | Sí |
| Info | Hitos, cambios de estado | Sí | Sí |
| Debug | Seguimiento detallado | No | Sí |

### Rotación de registros

- Tamaño máximo de archivo: 5 MB
- Rotación: conserva un archivo de registro anterior
- Los registros antiguos se reemplazan automáticamente

## Reportar errores

Al reportar un error, incluye:

1. **Versión de VMark** — se muestra en la insignia de la barra de navegación o en el diálogo Acerca de
2. **Sistema operativo** — versión de macOS, compilación de Windows o distribución de Linux
3. **Pasos para reproducir** — qué hiciste antes de que ocurriera el problema
4. **Archivo de registro** — adjunta o pega las entradas de registro relevantes

Las entradas de registro tienen marca de tiempo y están etiquetadas por módulo (por ejemplo, `[HotExit]`, `[MCP Bridge]`, `[Export]`), lo que facilita encontrar las secciones relevantes.

### Encontrar registros relevantes

1. Abre el directorio de registros indicado en la tabla anterior
2. Abre el archivo `.log` más reciente
3. Busca entradas `ERROR` o `WARN` cercanas al momento en que ocurrió el problema
4. Copia las líneas relevantes e inclúyelas en tu reporte de error

## Problemas comunes

### La aplicación se inicia lentamente en Windows

VMark está optimizado para macOS. En Windows, el inicio puede ser más lento debido a la inicialización de WebView2. Asegúrate de que:

- WebView2 Runtime esté actualizado
- El software antivirus no esté escaneando el directorio de datos de la aplicación en tiempo real

### La barra de menú muestra inglés tras cambiar el idioma

Si la barra de menú permanece en inglés después de cambiar el idioma en Configuración, reinicia VMark. El menú se reconstruye en el siguiente inicio con el idioma guardado.

### El terminal no acepta signos de puntuación CJK

Corregido en v0.6.5+. Actualiza a la última versión.
