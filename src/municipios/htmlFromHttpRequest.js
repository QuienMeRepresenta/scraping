const fs = require('fs-extra')
const axios = require('./axios')
const path = require('path')

/**
 * Checa un archivo local, y si no existe genera un http.get request al URL
 * @param {object} axiosConfig La configuración del request.
 * @param {string} filePath El archivo que se checara que existe. Si no existe se creará al generar el request
 * @returns {string}
 */
async function htmlFor(axiosConfig, dirPath, fileName, toString) {
  await fs.ensureDir(dirPath)
  const filePath = path.join(dirPath, fileName)
  const ts = toString || 'utf8'

  const exists = await fs.pathExists(filePath)

  if (exists) {
    console.log('Leyendo archivo del disco', filePath)
    const html = await fs.readFile(filePath, ts)
    return html
  }

  console.log('El archivo no existe en disco', filePath)
  console.log('Haciendo http request a', axiosConfig.url)

  const { data } = await axios(axiosConfig)

  const html = data.toString(ts)
  await fs.writeFile(filePath, html, ts)
  return html
}

module.exports = htmlFor
