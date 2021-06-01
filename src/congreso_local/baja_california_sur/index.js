const scrapDiputados = require('./scrapDiputados')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.cbcs.gob.mx'
  const sqlFilePath = `${__dirname}/sql.txt`

  const diputados = await scrapDiputados(baseUrl)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
