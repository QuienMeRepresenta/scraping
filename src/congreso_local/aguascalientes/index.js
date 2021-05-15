const axios = require('axios')
const https = require('https')
const cheerio = require('cheerio')
const fs = require('fs')
const promisify = require('util').promisify
const writeFile = promisify(fs.writeFile)
const readFile = promisify(fs.readFile)

const baseUrl = 'https://congresoags.gob.mx/legislatura/conoce_a_tu_diputado'

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'

const instance = axios.create({
  responseType: 'arraybuffer',
  responseEncoding: 'binary',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'User-Agent': userAgent,
    Connection: 'Keep-Alive',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,*',
  },
})
const distritosRomano = {
  'Distrito I': 1,
  'Distrito II': 2,
  'Distrito III': 3,
  'Distrito IV': 4,
  'Distrito V': 5,
  'Distrito VI': 6,
  'Distrito VII': 7,
  'Distrito VIII': 8,
  'Distrito IX': 9,
  'Distrito X': 10,
  'Distrito XI': 11,
  'Distrito XII': 12,
  'Distrito XIII': 13,
  'Distrito XIV': 14,
  'Distrito XV': 15,
  'Distrito XVI': 16,
  'Distrito XVII': 17,
  'Distrito XVIII': 18,
}

// instance.get(baseUrl).then((r) => {
//   return writeFile(
//     `${process.cwd()}/scraping/congreso_local/aguascalientes/directorio.html`,
//     r.data.toString('latin1'),
//   )
// })
readFile(`${process.cwd()}/scraping/congreso_local/aguascalientes/directorio.html`)
  .then((r) => {
    return cheerio.load(r)
  })
  .then(($) => {
    const diputados = []

    $('div.row:nth-child(2)')
      .children()
      .each(function () {
        const h4 = $(this).find('h4').html()
        if (!h4) {
          return
        }
        const distritoRomano = $(this).find('h5').text()
        //TODO: Ignorando plurinominales
        if (distritoRomano === 'Representación Proporcional') {
          return
        }

        const name = h4.replace('<span>', ' ').replace('</span>', '').replace('Dip. ', '')
        const baseUrl =
          $(this).find('div:nth-child(1) > div:nth-child(1) > img:nth-child(1)').attr('src') || ''
        const link = $(this)
          .find('a.button.button-rounded.button-mini.button-reveal.button-dark.tright')
          .attr('href')
        const distrito = distritosRomano[distritoRomano]

        diputados.push({
          name,
          baseUrl,
          link,
          distrito,
        })
      })
    return diputados
  })
