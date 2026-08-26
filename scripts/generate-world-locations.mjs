import { readFileSync, writeFileSync } from 'node:fs'

const sourcePath=process.argv[2]
if(!sourcePath)throw new Error('Uso: node scripts/generate-world-locations.mjs /ruta/cities5000.txt')

const rows=readFileSync(sourcePath,'utf8').trim().split('\n').map(line=>{
  const fields=line.split('\t')
  return {
    city:fields[1],ascii:fields[2],longitude:Number(fields[5]),featureClass:fields[6],
    countryCode:fields[8],population:Number(fields[14]),timezone:fields[17]
  }
}).filter(item=>item.featureClass==='P'&&item.city&&item.countryCode&&item.timezone&&Number.isFinite(item.longitude))
  .sort((a,b)=>b.population-a.population)

const countryCounts=new Map(),seen=new Set(),selected=[]
for(const item of rows){
  const count=countryCounts.get(item.countryCode)||0
  countryCounts.set(item.countryCode,count+1)
  if(count>=5&&item.population<500000)continue
  const key=`${item.city.toLocaleLowerCase()}|${item.countryCode}|${item.timezone}`
  if(seen.has(key))continue
  try{new Intl.DateTimeFormat('en',{timeZone:item.timezone}).format(new Date())}catch{continue}
  seen.add(key);selected.push(item)
}

const tuples=selected.map(item=>{
  const alias=item.ascii&&item.ascii!==item.city?item.ascii:''
  return `  [${JSON.stringify(item.city)},${JSON.stringify(item.countryCode)},${JSON.stringify(item.timezone)},${item.longitude},${item.population},${JSON.stringify(alias)}],`
}).join('\n')

writeFileSync('src/worldLocations.ts',`// Derivado de GeoNames cities5000, CC BY 4.0. https://www.geonames.org/\n`+
  `// Regla: cinco ciudades con mayor población por país y todas las ciudades con 500,000 habitantes o más.\n`+
  `export type WorldLocationRow=readonly [city:string,countryCode:string,timezone:string,longitude:number,population:number,alias:string]\n\n`+
  `export const worldLocationRows:readonly WorldLocationRow[]=[\n${tuples}\n]\n`)

console.log(`Ciudades generadas: ${selected.length}; países y territorios: ${countryCounts.size}`)
