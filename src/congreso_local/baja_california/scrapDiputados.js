const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')

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
  const diputados = []

  $('tbody > tr').each(function () {
    const imgPath = $(this).find('td:nth-child(1) > div > img').attr('src')
    if (!imgPath) {
      //El primer TR esta vacío en el html
      return
    }

    const congresoImgUrl = `${baseUrl}/${imgPath.replace('../../../', '')}`
    const distritoRomano = $(this).find('td:nth-child(3) > span').html().trim().toLowerCase()

    if (distritoRomano === 'plurinominal') {
      //TODO: Pluris
      return
    }
    const nombre = $(this).find('td:nth-child(2) > p > span').html().trim().replace('Dip. ', '')
    const path = $(this).find('td:nth-child(2) > .contacto_d > ul > li > a').attr('href')
    const link = `${baseUrl}/Contenido/Legislatura/Diputados/${path}`
    const distrito = distritosRomano[distritoRomano]

    diputados.push({ congresoImgUrl, nombre, distrito, link })
  })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('subiendo imagen del diputado', diputado.nombre)
    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
      folder: `diputacion_local/baja_california/legislatura_xxiii`,
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
