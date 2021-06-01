const { promises: Fs } = require('fs')

/**
 *
 * @param {diputado[]} diputados Lista de diputados
 */
async function writeSqlToDisk(diputados, sqlFilePath) {
  const sql = diputados
    .map((d) => {
      const puesto = `Diputación Local Campeche por Distrito ${d.distritoLocal}`
      const estadoId = 4

      const rango = '[2018-10-01,2021-12-01)'
      const createdAt = '2021-05-31 13:00:00'
      return `insert into actores_politicos (nombre, puesto, img_url, created_at) values ('${d.nombre}', '${puesto}', '${d.imgUrl}', '${createdAt}') ON CONFLICT (nombre_formatted, puesto) DO UPDATE SET img_url = EXCLUDED.img_url;
insert into diputacion_local(actor_politico_id, periodo, distrito_local, estado, link) select id, '${rango}'::daterange, ${d.distritoLocal}, ${estadoId}, '${d.link}' from actores_politicos where nombre_formatted = lower(unaccent('${d.nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;`
    })
    .join('\n')
  const finalFile = `exports.seed = async function (knex) {
  await knex.schema.raw(\`
  ${sql}
  \`)
}
`
  await Fs.writeFile(sqlFilePath, finalFile)
  console.log('escribi archivo sql en ', sqlFilePath)
}

module.exports = writeSqlToDisk
