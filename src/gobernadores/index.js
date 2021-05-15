const scrapGubernatura = require('./scrapGubernatura')
// const uploadToCloudinary = require('./uploadToCloudinary')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.conago.org.mx'
  const directorioPath = `${__dirname}/html`
  const sqlFilePath = `${__dirname}/sql.txt`
  const gubernaturas = await scrapGubernatura(baseUrl, directorioPath)

  // const withCloudinaryUrl = await uploadToCloudinary(senadores)
  await writeSqlToDisk(gubernaturas, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
