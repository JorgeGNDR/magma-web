# MAGMA

Web estática del estudio MAGMA construida con Next.js, React Three Fiber y Three.js.
Node se utiliza para desarrollo y compilación; el sitio publicado sirve archivos de `out/`.

## Desarrollo

```bash
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Comprobaciones

```bash
pnpm exec tsc --noEmit --incremental false
pnpm lint
pnpm build
```

## Exportación y vista previa

`pnpm build` genera `out/`, con HTML, JavaScript, CSS, fuentes, `robots.txt`,
`sitemap.xml`, modelos GLB, decodificador Draco y audio. Las fuentes de Google
se descargan durante la compilación y se sirven después desde el propio sitio.
La compilación requiere acceso a Google Fonts.

```bash
pnpm preview
```

La vista previa usa Python 3 en `http://127.0.0.1:3000` y permite revisar los
archivos y la interacción. No interpreta las reglas de Apache ni reproduce su
página 404. Ya no se utiliza `next start`.

## Publicación estática

1. Ejecutar `pnpm install --frozen-lockfile` y `pnpm build`.
2. Publicar **el contenido de `out/`**, incluido el archivo oculto `.htaccess`,
   en la raíz web del dominio. No publicar el repositorio, `.next/` ni `node_modules/`.
   El sitio espera estar en la raíz del dominio, no en un subdirectorio.
3. En Apache 2.4, habilitar `mod_headers`, `mod_rewrite`, `mod_mime` y los permisos
   `AllowOverride FileInfo Indexes Options AuthConfig`. Las reglas de
   `deployment/apache.htaccess` se copian a `out/.htaccess` durante el build.
   Si el hosting usa otro servidor o CDN, trasladar allí esas reglas antes del cambio.
4. Verificar en el hosting de destino: `/`, `/robots.txt`, `/sitemap.xml`, carga
   de ambos modelos, audio, formulario y respuesta **404** para una ruta inexistente.
   No configurar un fallback de todas las rutas a `index.html`.
5. Comprobar las cabeceras de seguridad, `X-Robots-Tag: noindex` en
   `dev.magmaestudio.com` y la redirección **308** de `www.magmaestudio.com`
   a `https://magmaestudio.com`, conservando ruta y query. Mantener HTTPS y
   la protección de acceso del entorno de desarrollo en el hosting/proxy.
6. Tras verificar el sitio estático en destino, retirar el arranque y el proceso
   Node del despliegue anterior. Conservarlo hasta entonces para poder volver atrás.

El logo y el estudio 3D se ejecutan en el navegador. No hay imágenes que necesiten
el optimizador de Next, API propias, Server Actions ni lógica por petición.
El formulario envía desde el navegador a FormSubmit; sigue dependiendo de ese
servicio. Spotify también requiere conexión a su servicio externo.

## Despliegue automático en Hostinger

El sitio `magmaestudio.com` está conectado a `JorgeGNDR/magma-web`, rama `main`.
Los pushes a esa rama activan la compilación y publicación. Los ajustes de build
deben usar Node 22, framework Next.js, gestor `pnpm`, script `build` y directorio
de salida `out`, sin archivo de entrada. Node se necesita durante la compilación;
la publicación debe servir el resultado estático sin arrancar un servidor Next.

No subir `out/` a Git ni conectar el repositorio fuente al despliegue de archivos
sin compilación. Verificar después de cada cambio de configuración que Hostinger
publica el HTML exportado, conserva `.htaccess` y no genera un proxy hacia Node.

Referencias: [exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports),
[cabeceras de Apache](https://httpd.apache.org/docs/2.4/mod/mod_headers.html) y
[reglas de redirección](https://httpd.apache.org/docs/2.4/mod/mod_rewrite.html).
