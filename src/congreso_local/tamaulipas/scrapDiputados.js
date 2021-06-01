const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')
const htmlFor = require('../../htmlFor')
const cheerio = require('cheerio')

const distritosRomano = {
  i: 1,
  ii: 2,
  iii: 3,
  iv: 4,
  v: 5,
  vi: 6,
  vii: 7,
  viii: 8,
  ix: 9,
  x: 10,
  xi: 11,
  xii: 12,
  xiii: 13,
  xiv: 14,
  xv: 15,
  xvi: 16,
  xvii: 17,
  xviii: 18,
  xix: 19,
  xx: 20,
  xxi: 21,
  xxii: 22,
  xxiii: 23,
}

/**
 * @typedef {Object} diputado
 * @property {string} nombre - Nombre del diputado
 * @property {string} imgUrl - Imagen del diputado
 * @property {string} link - Link al congreso local
 * @param {Cheerio} $
 * @returns {diputado[]}
 */
async function scrapDiputados(baseUrl, $) {
  const links = []

  $(
    'body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > wrapper:nth-child(1) > container:nth-child(8) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(5) > td:nth-child(1) > table',
  ).each(function () {
    const distritoCompleto = $(this)
      .find('tr:nth-child(2) > td:nth-child(2) > #menu > ul > li:nth-child(2) > a')
      .html()
      .trim()
      .toLowerCase()

    if (distritoCompleto === 'representación proporcional') {
      return
    }

    const distritoRomano = distritoCompleto.split(' ')[1]
    const distrito = distritosRomano[distritoRomano]

    const path = $(this)
      .find('tr:nth-child(2) > td:nth-child(2) > #menu > ul > li:nth-child(1) > a')
      .attr('href')

    const link = `${baseUrl}/AsambleaLegislativa/IntegrantesPleno/${path}`

    const congresoImgPath = $(this).find('tr:nth-child(2) > td:nth-child(1) > img').attr('src')
    const congresoImgUrl = `${baseUrl}${congresoImgPath}`

    links.push({ distrito, link, congresoImgUrl })
  })

  const result = await Promise.mapSeries(links, async (link) => {
    console.log('Checando link de diputado del distrito:', link.distrito)
    const path = `${__dirname}/${link.distrito}.html`
    const htmlDiputado = await htmlFor(link.link, path, 'latin1')
    const $htmlDiputado = cheerio.load(htmlDiputado)
    const nombre = $htmlDiputado(
      'body > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > wrapper:nth-child(1) > container:nth-child(8) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(1) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(1) > td:nth-child(2) > table:nth-child(1) > tbody:nth-child(1) > tr:nth-child(3) > td:nth-child(1) > font:nth-child(1) > b:nth-child(1)',
    )
      .html()
      .trim()
      .replace('Dip. ', '')

    console.log('subiendo imagen del diputado', nombre)
    const { secure_url } = await cloudinary.uploader.upload(link.congresoImgUrl, {
      folder: `diputacion_local/tamaulipas/legislatura_lxiv`,
      public_id: nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })

    const finalLink = link.link.replace('?', '\\\\?')

    return {
      nombre: nombre,
      distritoLocal: link.distrito,
      imgUrl: secure_url,
      link: finalLink,
    }
  })

  return result
}

module.exports = scrapDiputados
