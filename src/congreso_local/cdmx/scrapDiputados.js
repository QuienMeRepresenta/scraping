const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')

/**
 * @typedef {Object} diputado
 * @property {string} nombre - Nombre del diputado
 * @property {string} imgUrl - Imagen del diputado
 * @property {string} link - Link al congreso local
 * @param {Cheerio} $
 * @returns {diputado[]}
 */
async function scrapDiputados(baseUrl, $) {
  const distritos = []

  $('article > div > div > div > div > div').each(function () {
    const $nombre = $(this).find('h4')
    const nombreUpperCase = $nombre.html().replace('<br>', ' ').replace('<br>', ' ')
    const nombre = nombreUpperCase
      .split(' ')
      .map((n) => `${n.charAt(0)}${n.substring(1).toLowerCase()}`)
      .join(' ')
    const $distrito = $(this).find('figure > div > span')
    const distrito = parseInt($distrito.html().trim().split(' ')[1], 10)
    const $congresoImgUrl = $(this).find('figure > div > a > img')
    const congresoImgUrl = `${baseUrl}/${$congresoImgUrl.attr('src')}`
    distritos.push({
      distrito,
      congresoImgUrl,
      nombre,
    })
  })

  const result = await Promise.mapSeries(distritos, async (distrito) => {
    const { secure_url } = await cloudinary.uploader.upload(distrito.congresoImgUrl, {
      folder: `diputacion_local/cdmx/legislatura_i`,
      public_id: distrito.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })

    return {
      nombre: distrito.nombre,
      distritoLocal: distrito.distrito,
      imgUrl: secure_url,
      link: 'https://www.congresocdmx.gob.mx/distritos-106-5.html',
    }
  })

  return result
}

module.exports = scrapDiputados
