const { promises: Fs } = require('fs')

/**
 *
 * @param {diputado[]} diputados Lista de diputados
 */
async function writeSqlToDisk(diputados, sqlFilePath) {
  const sql = diputados
    .map((d) => {
      const puesto = `Diputación Local Hidalgo por Distrito ${d.distritoLocal}`
      const periodo = '[2018-10-01,2021-11-05)'
      return `insert into actores_politicos (nombre, puesto, img_url, created_at) values ('${d.nombre}', '${puesto}', '${d.imgUrl}', '2021-05-07 13:00:00') ON CONFLICT (nombre_formatted, puesto) DO UPDATE SET img_url = EXCLUDED.img_url;
insert into diputacion_local(actor_politico_id, periodo, distrito_local, estado, link) select id, '${periodo}'::daterange, ${d.distritoLocal}, 13, '${d.link}' from actores_politicos where nombre_formatted = lower(unaccent('${d.nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;`
    })
    .join('\n')
  const finalFile = `exports.seed = async function (knex) {
  await knex('diputacion_local').del()
  await knex.schema.raw(\`
  ${sql}
  \`)
}
`
  await Fs.writeFile(sqlFilePath, finalFile)
  console.log('escribi archivo sql en ', sqlFilePath)
}

module.exports = writeSqlToDisk
