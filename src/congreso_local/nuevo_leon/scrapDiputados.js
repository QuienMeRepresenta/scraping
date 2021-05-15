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
  const gpoLegislativoLinks = []

  $('.btn.btn-default.btn-block').each(function () {
    const path = $(this).attr('href')
    const link = `${baseUrl}/organizacion/${path}`
    const nombre = path.split('/')[0].replace('.php', '')

    gpoLegislativoLinks.push({ nombre, link })
  })
  const diputados = []
  await Promise.each(gpoLegislativoLinks, async (gpo) => {
    const filePath = `${process.cwd()}/src/congreso_local/nuevo_leon/${gpo.nombre}.html`
    const htmlGpoLegislativo = await htmlFor(gpo.link, filePath)
    const $$ = cheerio.load(htmlGpoLegislativo)

    $$('.list-group-item').each(function () {
      const $h4 = $$(this).find('h4')
      const $img = $$(this).find('.media-left > a > img')

      const link = $h4.find('a').attr('href')
      const nombre = $h4
        .find('a')
        .text()
        .replace('DIP. ', '')
        .split(' ')
        .map((n) => `${n.charAt(0)}${n.substring(1).toLowerCase()}`)
        .join(' ')

      const congresoImgUrl = $img.attr('src')
      const representacion = $$(this)
        .find('div > .col-md-2:nth-child(2) > h5')
        .parent()
        .text()
        .replace(/\n|\t/g, '')
        .replace('Representación:', '')
      const distrito = $$(this)
        .find('div > .col-md-2:nth-child(3) > h5')
        .parent()
        .text()
        .replace(/\n|\t/g, '')
        .replace('Distrito Electoral:', '')

      if (distrito === 'Plurinominal') {
        //TODO: Plurinominales
        return
      }

      diputados.push({
        link,
        nombre,
        congresoImgUrl,
        representacion,
        distrito: parseInt(distrito, 10),
      })
    })
  })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log(
      'subiendo imagen de diputado ',
      diputado.nombre,
      ' del distrito ',
      diputado.distrito,
    )

    const cloudinaryFolder = `diputacion_local/nuevo_leon/legislatura_lxxv`

    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
      folder: cloudinaryFolder,
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
