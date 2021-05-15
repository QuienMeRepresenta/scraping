const cheerio = require('cheerio')
const htmlFor = require('../../htmlFor')
const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.congresocdmx.gob.mx'
  const directorioUrl = `${baseUrl}/distritos-106-5.html`
  const directorioHtmlPath = `${process.cwd()}/src/congreso_local/cdmx/directorio.html`
  const sqlFilePath = `${process.cwd()}/src/congreso_local/cdmx/sql.txt`

  const html = await htmlFor(directorioUrl, directorioHtmlPath)
  const $ = cheerio.load(html)
  const diputados = await scrapDiputados(baseUrl, $)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
