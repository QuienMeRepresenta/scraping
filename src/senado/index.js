const entidades = require('../entidades')
const Promise = require('bluebird')
const htmlFor = require('../htmlFor')
const cheerio = require('cheerio')
const uploadToCloudinary = require('./uploadToCloudinary')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.senado.gob.mx'
  const directorioPath = `${__dirname}/html`
  const sqlFilePath = `${__dirname}/sql.txt`
  const senadores = await scrapSenadores(baseUrl, directorioPath)

  const withCloudinaryUrl = await uploadToCloudinary(senadores)
  await writeSqlToDisk(withCloudinaryUrl, sqlFilePath)
}

const scrapSenadores = async (baseUrl, directorioPath) => {
  const result = []
  await Promise.mapSeries(entidades, async (entidad) => {
    const nombreEntidad = entidad.nombre.toLowerCase().replace(/\s/g, '_')
    const url = `${baseUrl}/64/senadores/por_entidad_federativa/${nombreEntidad}`
    const filePath = `${directorioPath}/${nombreEntidad}.html`

    const html = await htmlFor(url, filePath)
    const $ = cheerio.load(html)
    const senadoresDiv = $('.panel')

    senadoresDiv.each(function () {
      const imgUrl = $(this).find('.panel-heading > a > img').attr('src')

      const nombre = $(this)
        .find('.panel-body a')
        .html()
        .replace('<br>', ' ')
        .replace(/^Sen. /, '')

      const urlPath = $(this).find('.panel-heading a').attr('href')

      const link = `${baseUrl}${urlPath}`
      const senadoImgUrl = `${baseUrl}${imgUrl}`
      result.push({
        nombre,
        senadoImgUrl,
        link,
        legislatura: 'lxiv',
        nombreEntidad: entidad.nombre,
        numeroEntidad: entidad.numero,
      })
    })
  })

  return result
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
