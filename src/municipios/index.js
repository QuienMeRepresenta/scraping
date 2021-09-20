const Promise = require('bluebird')
const entidades = require('./entidades')

const htmlFromHttpRequest = require('./htmlFromHttpRequest')
const fs = require('fs-extra')
const path = require('path')
const { DateTime } = require('luxon')
const $ = require('cheerio')
const latinize = require('latinize')

/**
 *
 * @param {string} nombre
 */
const formatName = (nombre) => {
  return nombre
    .replace(/LIC\.|C\.|TEC\.|ING\.|PROFR\.|J\.|MTRO\./g, '')
    .trim()
    .split(' ')
    .reduce((acc, current) => {
      if (current === '') {
        return acc
      }

      acc.push(`${current[0]}${current.slice(1).toLowerCase()}`)
      return acc
    }, [])
    .join(' ')
}

async function main() {
  // const baseUrl = 'https://www.conago.org.mx'
  // const directorioPath = `${__dirname}/html`
  // const sqlFilePath = `${__dirname}/sql.txt`
  // const gubernaturas = await scrapGubernatura(baseUrl, directorioPath)

  // // const withCloudinaryUrl = await uploadToCloudinary(gubernaturas)
  // await writeSqlToDisk(gubernaturas, sqlFilePath)
  const resultado = await Promise.map(
    entidades,
    async (entidad) => {
      console.log('Checando estado', entidad.nombre)
      const comboHtmlAxiosConfig = {
        url: 'http://www.snim.rami.gob.mx/combos.php',
        method: 'POST',
        data: `edo=${entidad.numero}&tipo=m`,
      }
      const comboHtml = await htmlFromHttpRequest(
        comboHtmlAxiosConfig,
        path.join(`${__dirname}`, 'html', entidad.nombre),
        'combo.html',
      )

      const $comboHtml = $.load(comboHtml)

      const ciudades = []
      const ciudadesFaltantes = []

      $comboHtml('option').each(function () {
        const estadosJson = require(`./json-from-db/estado-${entidad.numero}.json`)
        const $option = $(this)
        const nombre = $option.text().trim().replace(/\s\s+/g, '')
        const id = parseInt($option.attr('value').trim(), 10)
        const nombreFormatted = latinize(nombre.toUpperCase())
        const estadoJson = estadosJson.find((e) => e.nombre === nombreFormatted)

        if (!estadoJson) {
          ciudadesFaltantes.push({
            nombre,
            idInafed: id,
            entidad: entidad.nombre,
            idEntidad: entidad.numero,
            nombreFormatted,
          })
          return
        }

        ciudades.push({ nombre, id, nombreFormatted, idFromDb: estadoJson.numero_municipio })
      })

      const ciudadesResultado = await Promise.mapSeries(ciudades, async (ciudad) => {
        const params = new URLSearchParams()
        params.append('edo', entidad.numero)
        params.append('mun', ciudad.id)
        params.append('tipo', 'm')
        params.append('reporte', 'ia')

        const axiosConfig = {
          url: 'http://www.snim.rami.gob.mx/tbl_ip_ayuntamientos.php',
          method: 'POST',
          data: params,
        }

        const html = await htmlFromHttpRequest(
          axiosConfig,
          path.join(`${__dirname}`, 'html', entidad.nombre),
          `${ciudad.nombre}-${ciudad.id}.html`,
        )

        const $ciudad = $.load(html)

        const mensaje = $ciudad('p').text().trim().replace(/\n/g, ' ')
        if (
          mensaje ===
          'Información en proceso de actualización por cambio de gobierno.Fuente: Gobiernos estatales y municipales.'
        ) {
          return null
        }

        const presidenciaMunicipal = formatName($ciudad('table > tbody > tr > td').html())
        const regidores = []

        $ciudad('table ~ table > tbody:first')
          .find('tr')
          .each(function () {
            const nombre = formatName($(this).find('td:first').text())

            regidores.push(nombre)
          })

        $ciudad('table ~ table ~ table > tbody:first')
          .find('tr')
          .each(function () {
            const nombre = formatName($(this).find('td:first').text())
            regidores.push(nombre)
          })

        const axiosDirectorioConfig = {
          url: 'http://www.snim.rami.gob.mx/tbl_directorio.php',
          method: 'POST',
          data: `edo=${entidad.numero}&mun=${ciudad.id}&tipo=m&reporte=dirmun`,
        }

        const directorioHtml = await htmlFromHttpRequest(
          axiosDirectorioConfig,
          path.join(`${__dirname}`, 'html', entidad.nombre),
          `${ciudad.nombre}-${ciudad.id}-directorio.html`,
        )

        const $directorio = $.load(directorioHtml)

        const periodo = $directorio('table > tbody > tr:nth-child(2) > td')
          .text()
          .replace('Del ', '')
          .split(' al ')
          .map((fecha) => {
            const dt = DateTime.fromFormat(fecha.trim(), 'dd-LLL-yyyy', { locale: 'es-MX' })
            return dt.toFormat('yyyy-MM-dd')
          })
          .join(', ')

        let link = $directorio('table > tbody > tr:nth-child(4) > td > a').attr('href')

        if (link === 'http://') {
          link = null
        } else {
          link = `'${link}'`
        }

        const sql = `
      insert into presidencia_municipal_simplificado(
        nombre,
        puesto,
        img_url,
        periodo,
        link,
        municipio_id,
        estado_id
      ) VALUES (
        '${presidenciaMunicipal}',
        'Presidente municipal',
        'https://via.placeholder.com/50',
        '[${periodo})'::daterange,
        ${link},
        ${ciudad.idFromDb},
        ${entidad.numero}
      ) ON CONFLICT (
        nombre_formatted,
        puesto
      )
      DO UPDATE SET img_url = EXCLUDED.img_url;
              `

        const regidoresSql = regidores
          .map((regidor) => {
            return `
      insert into presidencia_municipal_simplificado(
        nombre,
        puesto,
        img_url,
        periodo,
        link,
        municipio_id,
        estado_id
      ) VALUES (
        '${regidor}',
        'Regidores',
        'https://via.placeholder.com/50',
        '[${periodo})'::daterange,
        ${link},
        ${ciudad.idFromDb},
        ${entidad.numero}
      ) ON CONFLICT (
        nombre_formatted,
        puesto
      )
      DO UPDATE SET img_url = EXCLUDED.img_url;
              `
          })
          .join('\n')

        return {
          ciudad: ciudad.nombre,
          presidenciaMunicipal,
          regidores,
          link,
          periodo,
          ciudadId: ciudad.id,
          entidadNumero: entidad.numero,
          sql: `${sql}\n${regidoresSql}`,
        }
      })

      const sql = ciudadesResultado
        .map((ciudad) => {
          if (!ciudad || !ciudad.sql) {
            return ''
          }
          return ciudad.sql
        })
        .join('')
      const finalFile = `exports.seed = async function (knex) {
            await knex('presidencia_municipal_simplificado').where('estado_id', ${entidad.numero}).del()
            await knex.schema.raw(\`
              ${sql}
              \`)
            }
            `

      await fs.writeFile(
        path.join(__dirname, `presidencias-municipales-${entidad.nombre}.js.txt`),
        finalFile,
      )

      if (ciudadesFaltantes.length > 0) {
        console.log('\n\n\nCiudades faltantes:\n', ciudadesFaltantes)
      }

      return `Writed sql file for ${entidad.nombre}`
    },
    { concurrency: 10 },
  )

  console.log(resultado)
}

main()
  .then(() => console.log('done'))
  .catch(console.error)
