const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')
const htmlFor = require('../../htmlFor')
const cheerio = require('cheerio')

/**
 * @typedef {Object} diputado
 * @property {string} nombre - Nombre del diputado
 * @property {string} imgUrl - Imagen del diputado
 * @property {string} link - Link al congreso local
 * @param {Cheerio} $
 * @returns {diputado[]}
 */
async function scrapDiputados(baseUrl, $) {
  const distritosLinks = {}

  $('.col-md-4 > .panel.panel-default').each(function () {
    const $span = $(this).find('span')
    const link = $(this).find('a').attr('href')

    if ($span.text().trim() === 'Plurinominal') {
      return
    }

    if ($span.text().trim().startsWith('A partir del')) {
      return
    }

    const distrito = parseInt($span.text().split(' ')[1], 10)

    distritosLinks[distrito] = { link: link, distrito }
  })

  const result = await Promise.mapSeries(Object.keys(distritosLinks), async (distrito) => {
    const distritoLink = distritosLinks[distrito]
    const html = await htmlFor(
      distritoLink.link,
      `${process.cwd()}/src/congreso_local/jalisco/diputado_distrito_${distrito}.html`,
    )
    const $$ = cheerio.load(html)

    const nombre = $$('div.col-md-10 ul li h2')
      .text()
      .replace(/\s\s+/g, ' ')
      .replace('Dip. ', '')
      .trim()
    const congresoImg = $$('.img_diputado > img').attr('src')

    const { secure_url } = await cloudinary.uploader.upload(congresoImg, {
      folder: `diputacion_local/jalisco/legislatura_lxii`,
      public_id: nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })

    return {
      nombre,
      distritoLocal: distrito,
      imgUrl: secure_url,
      link: distritoLink.link,
    }
  })

  return result
}

module.exports = scrapDiputados
