const Promise = require('bluebird')
const cheerio = require('cheerio')
const entidades = require('../entidades')
const htmlFor = require('../htmlFor')

async function scrapDiputados(baseUrl) {
  const legislatura = 'LXV'

  const linksPorEntidad = entidades.map((e) => {
    return {
      link: `${baseUrl}/${legislatura}_leg/listado_diputados_gpnp.php?tipot=Edo&edot=${e.numero}`,
      nombre: e.nombre,
      numero: e.numero,
    }
  })

  const linksDiputados = []

  //Saca todos los links de diputados por Estado
  await Promise.mapSeries(linksPorEntidad, async (linkPorEntidad) => {
    const { link, nombre, numero } = linkPorEntidad

    const filePath = `${__dirname}/html/por_estado/${numero}.html`
    const porEstadoHtml = await htmlFor(link, filePath, 'latin1')

    const $porEstadoHtml = cheerio.load(porEstadoHtml)

    $porEstadoHtml(`a[href]`).each(function () {
      const href = $porEstadoHtml(this).attr('href')
      if (href.startsWith('curricula.php')) {
        const split = href.split('=')
        linksDiputados.push({
          link: `${baseUrl}/${legislatura}_leg/${href}`,
          entidad: nombre,
          numeroEntidad: numero,
          id: split[1],
        })
      }
    })
  })
  console.log(linksDiputados)
  // De cada link saca la información de los diputados
  const diputados = await Promise.mapSeries(linksDiputados, async (linkDiputado) => {
    const { link, entidad, numeroEntidad, id } = linkDiputado
    const filePath = `${__dirname}/html/diputados/${legislatura.toLowerCase()}/${id}.html`

    const diputadoHtml = await htmlFor(link, filePath, 'latin1')
    const $diputadoHtml = cheerio.load(diputadoHtml)
    const nombre = $diputadoHtml(
      'body > div > table.cajasombra > tbody > tr > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(1) > td > center > strong',
    )
      .text()
      .replace('Dip. ', '')
      .trim()
    const entidadHtml = $diputadoHtml(
      'body > div > table.cajasombra > tbody > tr > td > table > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(3) > td:nth-child(2)',
    )
      .text()
      .trim()
      .replace(/\n/g, '')
      .split(':')
    const imgPath = $diputadoHtml(
      'body > div > table.cajasombra > tbody > tr > td > table > tbody > tr > td:nth-child(1) > img',
    )
      .attr('src')
      .replace('.', '') //replace first dot

    const imgUrl = `${baseUrl}/${legislatura}_leg${imgPath}`
    const replacedLink = link.replace('?', '\\\\?') //This is a hack to avoid parameter replacement in knex.schema.raw inserts

    if (!entidadHtml[0].toLowerCase().endsWith('distrito')) {
      //TODO: Plurinominales
      return null
    }

    const distrito = parseInt(entidadHtml[1].split('|')[0].trim(), 10)

    return {
      nombre,
      distrito,
      congresoImgUrl: imgUrl,
      link: replacedLink,
      numeroEntidad,
      entidad,
      legislatura,
    }
  })

  return diputados.filter((d) => d)
}

module.exports = scrapDiputados
