const { promises: Fs } = require('fs')
const fileExists = require('./fileExists')
const axios = require('./axios')

/**
 * Checa un archivo local, y si no existe genera un http.get request al URL
 * @param {object} axiosConfig La configuración del request.
 * @param {string} filePath El archivo que se checara que existe. Si no existe se creará al generar el request
 * @returns {string}
 */
async function htmlFor(axiosConfig, filePath, toString) {
  const exists = await fileExists(filePath)

  if (exists) {
    console.log('Leyendo archivo del disco', filePath)
    const html = await Fs.readFile(filePath)
    return html
  }

  console.log('El archivo no existe en disco', filePath)
  console.log('Haciendo http request a', axiosConfig.url)

  const { data } = await axios(axiosConfig)
  const ts = toString || 'utf8'
  const html = data.toString(ts)
  await Fs.writeFile(filePath, html)
  return html
}

module.exports = htmlFor
