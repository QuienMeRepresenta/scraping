const axios = require('axios')
const cheerio = require('cheerio')
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
async function scrapDiputados(baseUrl) {
  const FOLDER = `diputacion_local/baja_california_sur/legislatura_xv`
  const { data } = await axios(`${baseUrl}/DIPUTADOS/json/dip.json`, {
    credentials: 'include',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US',
      'X-Requested-With': 'XMLHttpRequest',
      Pragma: 'no-cache',
      'Cache-Control': 'no-cache',
    },
    referrer: `${baseUrl}/index.php/organizacion/diputados`,
    method: 'GET',
    mode: 'cors',
  })
  console.log(data[0])
  const diputados = []
  data.forEach((diputado) => {
    if (diputado['DISTRITO'] === 'RP') {
      return
    }

    const nombre = diputado['NOMBRE']
      .replace('DIP. ', '')
      .split(' ')
      .map((n) => `${n.charAt(0)}${n.substring(1).toLowerCase()}`)
      .join(' ')

    const distrito = parseInt(diputado['DISTRITO'], 10)
    const $ = cheerio.load(diputado['FOTO'])
    const imgPath = $('img').attr('src')
    const congresoImgUrl = `${baseUrl}${imgPath}`
    const link = `${baseUrl}${diputado['ACCESO']}`

    diputados.push({ nombre, distrito, congresoImgUrl, link })
  })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('subiendo imagen del diputado', diputado.nombre)
    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
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
