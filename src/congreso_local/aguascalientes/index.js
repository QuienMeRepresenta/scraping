const cheerio = require('cheerio')
const htmlFor = require('../../htmlFor')
const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://congresoags.gob.mx'
  const directorioUrl = `${baseUrl}/legislatura/conoce_a_tu_diputado`
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
