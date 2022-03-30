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
  const diputados = {}

  const diputadoBoxes  = $('#cr-diputados-tabs-container .cr-diputados-posts .cr-diputados-post-box')

  diputadoBoxes.each(function () {
    let imgUrl = $(this).find('.cr-diputados-post-box__col-img img').attr('src')
    imgUrl = imgUrl.replace('-200x300', '') // Get image in original size
    
    const $diputadoAnchor = $(this).find(
      '.cr-diputados-post-box__col-contents h2.cr-diputados-post-box__title a'
    )
    const nombre = $diputadoAnchor.text()
    const link = $diputadoAnchor.attr('href')

    const distrito = $(this).find(
      '.cr-diputados-post-box__col-contents > ul > li:nth-child(1) > .cr-diputados-post-box__meta-text'
    ).text()

    if (distrito === 'Representación Proporcional') {
      //TODO: Plurinominales
      return
    }
    if (distrito === '* Diputada Suplente en funciones de propietaria') {
      //TODO: Suplentes
      return
    }

    const numeroDistrito = distrito.split(' ')[1]

    diputados[nombre] = {
      nombre,
      distrito: parseInt(numeroDistrito, 10),
      link,
      imgUrl,
    }
  })

  const result = await Promise.mapSeries(Object.keys(diputados), async (diputadoKey) => {
    const diputado = diputados[diputadoKey]
    const nombre = diputado.nombre.replace('Dip. ', '')

    console.log('Subiendo imagen de diputado', diputado.imgUrl)
    const { secure_url } = await cloudinary.uploader.upload(diputado.imgUrl, {
      folder: `diputacion_local/sinaloa/legislatura_lxiv`,
      public_id: nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })

    return {
      nombre,
      distritoLocal: diputado.distrito,
      imgUrl: secure_url,
      link: diputado.link,
    }
  })

  return result
}

module.exports = scrapDiputados
