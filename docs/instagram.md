# Instagram de MI MAPA

1. Convierte la cuenta de Instagram en cuenta profesional y conéctala a una página de Facebook.
2. En Meta for Developers crea una app con Instagram Graph API y genera un token de acceso para publicación de contenido.
3. Copia el identificador de usuario de Instagram y el token.
4. En GitHub abre **Settings → Secrets and variables → Actions** y crea:
   - `IG_USER_ID`
   - `IG_ACCESS_TOKEN`
5. En **Actions → Publicar Hoy en Instagram → Run workflow**, ejecuta una prueba.

El workflow corre diario a las 08:15 hora de Ciudad de México. Genera el JPG en `public/social/hoy.jpg`, guarda el caption y publica el post general “Hoy”.
