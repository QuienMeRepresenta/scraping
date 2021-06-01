const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')
const numerosRomanos = require('../../romanos')

/**
 * @typedef {Object} diputado
 * @property {string} nombre - Nombre del diputado
 * @property {string} imgUrl - Imagen del diputado
 * @property {string} link - Link al congreso local
 * @param {Cheerio} $
 * @returns {diputado[]}
 */
async function scrapDiputados(baseUrl, $) {
  const FOLDER = `diputacion_local/aguascalientes/legislatura_lxiv`

  const diputados = []
  $('div.row:nth-child(2)')
    .children()
    .each(function () {
      const h4 = $(this).find('h4').html()
      if (!h4) {
        return
      }

      const distritoRomano = $(this).find('h5').text()
      //TODO: Ignorando plurinominales
      if (distritoRomano === 'Representación Proporcional') {
        return
      }

      const nombre = h4.replace('<span>', ' ').replace('</span>', '').replace('Dip. ', '')
      const congresoImgBase64 =
        $(this).find('div:nth-child(1) > div:nth-child(1) > img:nth-child(1)').attr('src') || ''

      const path = $(this)
        .find('a.button.button-rounded.button-mini.button-reveal.button-dark.tright')
        .attr('href')
      const replacedRomano = distritoRomano.replace('Distrito ', '').toLowerCase()
      const link = `${baseUrl}${path}`
      const distrito = numerosRomanos[replacedRomano]
      diputados.push({ nombre, link, distrito, congresoImgBase64 })
    })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('Checando link de diputado del distrito:', diputado.distrito)
    console.log('subiendo imagen del diputado', diputado.nombre)

    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgBase64, {
      folder: FOLDER,
      public_id: diputado.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })

    return {
      nombre: diputado.nombre,
      distritoLocal: diputado.distrito,
      imgUrl: secure_url,
      link: diputado.link,
    }
  })

  return result
}

module.exports = scrapDiputados
