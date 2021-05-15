const entidades = require('../entidades')
const Promise = require('bluebird')
const htmlFor = require('../htmlFor')
const cheerio = require('cheerio')

const scrapGubernatura = async (baseUrl, directorioPath) => {
  const gobernadores = await Promise.mapSeries(entidades, async (entidad) => {
    const nombreEntidad = entidad.nombre.toLowerCase().replace(/\s/g, '-')
    const url = `${baseUrl}/entidadesfederativas/detalle/${nombreEntidad}`
    const filePath = `${directorioPath}/${nombreEntidad}.html`

    const html = await htmlFor(url, filePath)
    const $ = cheerio.load(html)
    const nombre = $(
      '#fContenido > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div.col-xs-12.col-md-8.texto.rcGobernadoresEF > h4 > a',
    )
      .text()
      .trim()
    const periodo = $(
      '#fContenido > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div.col-xs-12.col-md-8.texto.rcGobernadoresEF',
    )
      .text()
      .trim()
      .split('\n')
      .map((x) => x.trim())
      .filter((x) => x !== '')[1]
      .replace(/\//gi, '-')
      .split(' a ')
    const link = $(
      '#fContenido > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div.col-xs-12.col-md-8.texto.rcGobernadoresEF > h4 > a',
    ).attr('href')

    const [dI, mI, aI] = periodo[0].split('-')
    const [dF, mF, aF] = periodo[1].split('-')

    const imgUrl = $(
      '#fContenido > div > div > div:nth-child(2) > div:nth-child(3) > div > div > div > div.col-xs-12.col-md-4.pb15 > a > img',
    ).attr('src')
    const periodoRango = `[${mI}-${dI}-${aI}, ${mF}-${dF}-${aF}]`

    return {
      nombre,
      periodo,
      imgUrl,
      periodoRango,
      nombreEntidad: entidad.nombre,
      numeroEntidad: entidad.numero,
      link,
    }
  })

  return gobernadores
}

module.exports = scrapGubernatura
