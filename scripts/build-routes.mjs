import {mkdir,readFile,writeFile} from 'node:fs/promises'

const routes=['crear','historias','yo','perfiles','elementos','acciones','encuentros','vacio','ahora','carta','carta-pro','hoy','calendario','mes','ciclos','admin','estudio-7m3p']
const source=await readFile('dist/index.html','utf8')

for(const route of routes){
  const directory=`dist/${route}`
  const url=`https://mi-mapa.github.io/${route}`
  const html=source
    .replace('<meta property="og:url" content="https://mi-mapa.github.io/" />',`<meta property="og:url" content="${url}" />`)
    .replace('<link rel="canonical" href="https://mi-mapa.github.io/" />',`<link rel="canonical" href="${url}" />`)
  await mkdir(directory,{recursive:true})
  await writeFile(`${directory}/index.html`,html)
}

console.log(`Rutas estáticas creadas: ${routes.length}`)
