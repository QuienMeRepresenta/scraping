const cheerio = require('cheerio')
const htmlFor = require('../../htmlFor')
const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.congresotamaulipas.gob.mx'
  const directorioUrl = `${baseUrl}/AsambleaLegislativa/IntegrantesPleno/OrdenAlfabetico.asp`
  const directorioHtmlPath = `${__dirname}/directorio.html`
  const sqlFilePath = `${__dirname}/sql.txt`

  const html = await htmlFor(directorioUrl, directorioHtmlPath, 'latin1')
  const $ = cheerio.load(html)
  const diputados = await scrapDiputados(baseUrl, $)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
