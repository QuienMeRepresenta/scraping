const scrapDiputados = require('./scrapDiputadosLXV')
const uploadToCloudinary = require('./uploadToCloudinary')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'http://sitl.diputados.gob.mx'
  const sqlFilePath = `${__dirname}/sql.txt`
  const diputados = await scrapDiputados(baseUrl)

  const withCloudinaryUrl = await uploadToCloudinary(diputados)
  await writeSqlToDisk(withCloudinaryUrl, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
