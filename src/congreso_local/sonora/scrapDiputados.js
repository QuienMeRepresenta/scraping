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
  const diputados = []
  $('tr').each(function () {
    const nombre = $(this).find('a:nth-child(1)').html()
    if (!nombre) {
      return
    }
    const link = $(this).find('a:nth-child(1)').attr('href').replace('?', '\\\\?')
    const cabecera = $(this).find('td:nth-child(1)').html()

    if (
      cabecera === 'Diputado de Representación Proporcional' ||
      cabecera === 'Diputada de Representación Proporcional' ||
      cabecera === 'Estado de Sonora'
    ) {
      //TODO: Diputados plurinominales
      return
    }

    const distritoLocal = cabecera.split(' ')[1]
    const congresoImgUrl = $(this).find('img').attr('src')

    diputados.push({
      nombre: nombre.trim(),
      distritoLocal,
      congresoImgUrl,
      link: `${baseUrl}${link}`,
    })
  })

  const result = await Promise.map(diputados, async (diputado) => {
    console.log('subiendo foto del diputado ', diputado.nombre)
    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
      folder: `diputacion_local/sonora/legislatura_lxii`,
      public_id: diputado.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: true,
    })

    return {
      nombre: diputado.nombre,
      distritoLocal: diputado.distritoLocal,
      imgUrl: secure_url,
      link: diputado.link,
    }
  })

  return result.sort()
}

module.exports = scrapDiputados
