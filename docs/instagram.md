# Instagram de MI MAPA

1. Convierte la cuenta de Instagram en cuenta profesional.
2. En Meta for Developers crea una app Business y configura **Instagram API con inicio de sesión de empresa de Instagram**.
3. En **Generar tokens de acceso**, agrega la cuenta y copia el identificador numérico que aparece bajo el usuario.
4. Pulsa **Generar token**, autoriza `instagram_business_basic` e `instagram_business_content_publish` y copia el token.
5. En GitHub abre **Settings → Secrets and variables → Actions** y crea:
   - `IG_USER_ID`
   - `IG_ACCESS_TOKEN`
6. En **Actions → Fábrica de publicaciones MI MAPA → Run workflow**, elige `hoy` y ejecuta una prueba.

La publicación usa `graph.instagram.com`. La clave secreta de la app queda dentro de Meta y el workflow utiliza únicamente el identificador de la cuenta y su token.

La fábrica permanece en pausa mientras faltan las dos llaves. Con ambas guardadas, sigue esta agenda en horario de Ciudad de México:

- Diario, 08:15: “Hoy”.
- Lunes, 13:00: primera mitad del carrusel semanal.
- Martes, 13:00: segunda mitad del carrusel semanal.
- Miércoles, 18:00: uno de los 10 centros.
- Viernes, 18:00: uno de los 12 animales.

Los centros y animales rotan automáticamente. Los carruseles semanales se dividen en dos publicaciones de seis láminas.

## Estudio manual

Abre `https://mi-mapa.github.io/#estudio-7m3p` para generar piezas aleatorias, descargar el PNG y copiar el caption. Esta ruta queda fuera de la navegación pública de MI MAPA.
