const cheerio = require('cheerio')
const htmlFor = require('../../htmlFor')
const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.congresojal.gob.mx'
  const directorioUrl = `${baseUrl}/aplicaciones/lista_busqueda_dips.php?nom=&cgp=&crep=`
  const directorioHtmlPath = `${process.cwd()}/src/congreso_local/jalisco/directorio.html`
  const sqlFilePath = `${process.cwd()}/src/congreso_local/jalisco/sql.txt`

  const html = await htmlFor(directorioUrl, directorioHtmlPath)
  const $ = cheerio.load(html)
  const diputados = await scrapDiputados(baseUrl, $)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
