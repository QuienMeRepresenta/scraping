const Promise = require('bluebird')
const cloudinary = require('../../cloudinary')

/**
 * @typedef {Object} diputado
 * @property {string} nombre - Nombre del diputado
 * @property {string} imgUrl - Imagen del diputado
 * @property {string} link - Link al congreso local
 * @param {Cheerio} $
 * @returns {diputado[]}
 */
async function scrapDiputados(baseUrl, $) {
  const FOLDER = `diputacion_local/campeche/legislatura_lxii`
  const diputados = []

  $('table > tbody > tr').each(function () {
    const representacion = $(this).find('td:nth-child(4)').text().trim().toLowerCase()

    if (representacion === 'proporcional') {
      return
    }

    const imgPath = $(this).find('td:nth-child(1) > div > img').attr('src')
    const linkPath = $(this).find('td:nth-child(2) > a').attr('href')
    const nombre = $(this).find('td:nth-child(2) > a').text().trim()
    const distritoDirty = $(this).find('td:nth-child(5) > div').html()
    const distrito = parseInt(distritoDirty, 10)

    const congresoImgUrl = `${baseUrl}/ubicatudiputado/${imgPath}`

    const link = `${baseUrl}/ubicatudiputado/${linkPath}`
    diputados.push({ congresoImgUrl, link, nombre, distrito })
  })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('subiendo imagen del diputado', diputado.nombre)
    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
      folder: FOLDER,
      public_id: diputado.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })
    const finalLink = diputado.link.replace('?', '\\\\?')

    return {
      nombre: diputado.nombre,
      distritoLocal: diputado.distrito,
      imgUrl: secure_url,
      link: finalLink,
    }
  })

  return result
}

module.exports = scrapDiputados
