const cheerio = require('cheerio')
const scrapDiputados = require('./scrapDiputados')
const htmlFor = require('../../htmlFromHttpRequest')
const writeSqlToDisk = require('./writeSqlToDisk')

async function main() {
  const baseUrl = 'https://www.congresocam.gob.mx'
  const requestUrl = `${baseUrl}/ubicatudiputado/php/cargaTodo.php`
  const axiosConfig = {
    url: requestUrl,
    headers: {
      accept: '*/*',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
      'sec-ch-ua-mobile': '?0',
      'sec-fetch-dest': 'empty',
      'sec-fetch-mode': 'cors',
      'sec-fetch-site': 'same-origin',
      'x-requested-with': 'XMLHttpRequest',
    },
    referrer: 'https://www.congresocam.gob.mx/ubicatudiputado/tusdiputados.php',
    referrerPolicy: 'strict-origin-when-cross-origin',
    data: 'legislatura=3',
    method: 'POST',
    mode: 'cors',
  }

  const directorioHtmlPath = `${__dirname}/directorio.html`
  const sqlFilePath = `${__dirname}/sql.txt`

  const html = await htmlFor(axiosConfig, directorioHtmlPath)
  const $ = cheerio.load(html)
  const diputados = await scrapDiputados(baseUrl, $)
  await writeSqlToDisk(diputados, sqlFilePath)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
