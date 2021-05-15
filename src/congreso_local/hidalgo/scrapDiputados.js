const cloudinary = require('../../cloudinary')
const Promise = require('bluebird')

const romanos = {
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

  $('.col-md-4').each(function () {
    let $nombre = $(this).find('div > h12')
    let nombre = null

    if ($nombre.find('ul').html()) {
      //Esto es por un commentario dentro del html.
      $nombre.find('ul').remove('ul')
      $nombre
        .contents()
        .filter(function () {
          return this.type === 'comment'
        })
        .remove()

      nombre = $nombre.html().trim().replace('Dip.', '')
    } else {
      nombre = $nombre.html().trim().replace('Dip. ', '')
    }

    const distritoTxt = $(this).find('br + h12').text().trim()
    if (distritoTxt.startsWith('Representación Proporcional')) {
      //TODO: Plurinominales
      return
    }

    const distritoRomano = distritoTxt.split(' ')[1].toLowerCase()
    const distrito = romanos[distritoRomano]
    const $link = $(this).find(
      'div:nth-child(2) > ul:nth-child(3) > li:nth-child(1) > a:nth-child(1)',
    )

    //Hay diputados que no tienen perfil, ni imagen
    if ($link.text().trim() !== 'Conoce más') {
      diputados.push({
        nombre,
        imgUrl: 'https://via.placeholder.com/50',
        link: `${baseUrl}/LXIV%20LEGISLATURA/integrantes-lxiv-legislatura.html#`,
        distrito: distrito,
      })
      return
    }

    const imgPath = $(this).find('img.media-object').attr('src').replace(/\s+/g, '%20')
    const imgUrl = `${baseUrl}/LXIV%20LEGISLATURA/${imgPath}`
    const link = `${baseUrl}/LXIV%20LEGISLATURA/${$link.attr('href').replace(/\s+/g, '%20')}`

    diputados.push({ nombre, imgUrl, link, distrito })
  })

  const result = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('Subiendo imagen de diputado', diputado.imgUrl)
    const { secure_url } = await cloudinary.uploader.upload(diputado.imgUrl, {
      folder: `diputacion_local/hidalgo/legislatura_lxiv`,
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
