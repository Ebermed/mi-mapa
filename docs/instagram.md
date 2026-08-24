# Instagram de MI MAPA

1. Convierte la cuenta de Instagram en cuenta profesional y conéctala a una página de Facebook.
2. En Meta for Developers crea una app con Instagram Graph API y genera un token de acceso para publicación de contenido.
3. Copia el identificador de usuario de Instagram y el token.
4. En GitHub abre **Settings → Secrets and variables → Actions** y crea:
   - `IG_USER_ID`
   - `IG_ACCESS_TOKEN`
5. En **Actions → Fábrica de publicaciones MI MAPA → Run workflow**, elige `hoy` y ejecuta una prueba.

La fábrica permanece en pausa mientras faltan las dos llaves. Con ambas guardadas, sigue esta agenda en horario de Ciudad de México:

- Diario, 08:15: “Hoy”.
- Lunes, 13:00: primera mitad del carrusel semanal.
- Martes, 13:00: segunda mitad del carrusel semanal.
- Miércoles, 18:00: uno de los 10 centros.
- Viernes, 18:00: uno de los 12 animales.

Los centros y animales rotan automáticamente. Los carruseles semanales se dividen en dos publicaciones de seis láminas.

## Estudio manual

Abre `https://ebermed.github.io/mi-mapa/#estudio-7m3p` para generar piezas aleatorias, descargar el PNG y copiar el caption. Esta ruta queda fuera de la navegación pública de MI MAPA.
