const cheerio = require('cheerio')
const htmlFor = require('../../htmlFor')
const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'http://www.congreso-hidalgo.gob.mx'
  const directorioUrl = `${baseUrl}/LXIV%20LEGISLATURA/integrantes-lxiv-legislatura.html`
  const directorioHtmlPath = `${process.cwd()}/src/congreso_local/hidalgo/directorio.html`
  const sqlFilePath = `${process.cwd()}/src/congreso_local/hidalgo/sql.txt`

  const html = await htmlFor(directorioUrl, directorioHtmlPath)
  const $ = cheerio.load(html)
  const diputados = await scrapDiputados(baseUrl, $)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
