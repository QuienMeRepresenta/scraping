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

  const imgElement = $(
    'div.elementor-widget-container div.elementor-image img.attachment-medium.size-medium',
  )

  imgElement.each(function () {
    const src = $(this).attr('src')
    if (src.endsWith('logosn-300x118.png') || src.endsWith('logosnwhite-300x118.png')) {
      return
    }

    const $elemtorRowElement = $(this)
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()
      .parent()

    const nombre = $elemtorRowElement.find('div > h2').text()
    const distrito = $elemtorRowElement
      .find('div > ul > li:nth-child(1) > span.elementor-icon-list-text')
      .text()

    if (distrito === 'Representación Proporcional') {
      //TODO: Plurinominales
      return
    }

    const numeroDistrito = distrito.split(' ')[1]

    const link = $elemtorRowElement
      .find('span:contains("Ver más")')
      .parent()
      .parent()
      .find('a.elementor-button-link.elementor-button.elementor-size-sm')
      .attr('href')

    let url = link.startsWith('/diputado63') ? `${baseUrl}${link}` : link

    diputados[nombre] = {
      nombre,
      distrito: parseInt(numeroDistrito, 10),
      link: url,
      imgUrl: src,
    }
  })

  const result = await Promise.mapSeries(Object.keys(diputados), async (diputadoKey) => {
    const diputado = diputados[diputadoKey]
    const nombre = diputado.nombre.replace('Dip. ', '')

    console.log('Subiendo imagen de diputado', diputado.imgUrl)
    const { secure_url } = await cloudinary.uploader.upload(diputado.imgUrl, {
      folder: `diputacion_local/sinaloa/legislatura_lxiii`,
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
