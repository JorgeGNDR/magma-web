# Revisión de seguridad y rendimiento — 25 septiembre 2026

## Cambios aplicados

- Next.js y eslint-config-next: 16.3.1 → 16.3.6. La auditoría inicial de producción detectó dos avisos críticos de Next.js y uno alto de sharp. Actualizado también el parser js-yaml transitivo de desarrollo mediante override a 4.3.2.
- Auditoría final completa de pnpm: 0 vulnerabilidades conocidas (453 dependencias contabilizadas). Esto no equivale a ausencia de fallos desconocidos.
- Desactivado el optimizador de imágenes no utilizado. Sin sourcemaps públicos de producción ni cabecera X-Powered-By.
- Añadidas cabeceras contra inclusión de la web en marcos, MIME sniffing y acceso innecesario a cámara, micrófono y ubicación. CSP limitada a base, objetos, marcos y destinos de formulario; no es una política completa contra XSS basada en nonces.
- Eliminado el campo que desactivaba el CAPTCHA de FormSubmit; se mantiene el honeypot. No se ha enviado ningún formulario durante la revisión.
- Diez portadas sin uso trasladadas de public/projects a assets/project-covers. Se conservan en el repositorio, pero el servidor Next no las publica. Copias anteriores pueden permanecer en cachés externas.
- El build valida una lista explícita de archivos permitidos en public y rechaza enlaces simbólicos y archivos no revisados. No detecta secretos dentro del contenido de un archivo permitido.
- El estudio se importa y monta al acercarse a su sección. El logo pausa el render fuera de su sección observando el hero, en lugar del canvas fijo.

## Comprobaciones

- Build de producción, TypeScript, ESLint y pruebas existentes de colisiones correctos.
- Respuesta local de producción: cabeceras nuevas presentes; /.env, /.git/config, /package.json, /next.config.mjs, /AGENTS.md, las portadas retiradas y el optimizador de imágenes devuelven 404.
- Sin mapas de fuentes en .next/static.
- Búsqueda de patrones de credenciales en archivos de trabajo y revisión de nombres de archivos sensibles en el historial: sin hallazgos. No se ha realizado un escaneo exhaustivo de secretos de todos los commits.
- Verificación en Chrome del estudio y apertura/cierre de pantalla completa. Los cinco marcos Spotify cargan su interfaz; no se ha verificado reproducción completa. Three.js emite avisos de deprecación de Clock y PCFSoftShadowMap.

## Límites y siguientes revisiones

- El dominio dev redirige a Cloudflare Access desde peticiones sin autenticar. Los resultados HTTP anteriores corresponden al build local, no certifican la configuración final del hosting. Desplegar el nuevo build y comprobar que el proxy conserva las cabeceras.
- Los modelos 3D, audio, JavaScript y todo recurso entregado al navegador son descargables. No almacenar originales confidenciales, credenciales ni pistas privadas entre esos recursos. Ocultar enlaces o desactivar el clic derecho no evita la descarga.
- Mantener secretos en variables de servidor, nunca NEXT_PUBLIC ni public. La visibilidad y permisos del repositorio/hosting no se han modificado.
- Pendiente completar la política de privacidad con los datos reales del responsable y revisar el tratamiento de datos por FormSubmit y Spotify.
- Próxima optimización posible: reducir geometría/texturas de los dos GLB (~10 MB combinados) con comparación visual. No se ha aplicado compresión con pérdida ni se han medido mejoras de Core Web Vitals.

## Referencias de avisos corregidos

- https://github.com/advisories/GHSA-p293-qw3h-jr36
- https://github.com/advisories/GHSA-2xp9-vwfh-vxw4
- https://github.com/advisories/GHSA-rgj7-g3m4-5g8c
