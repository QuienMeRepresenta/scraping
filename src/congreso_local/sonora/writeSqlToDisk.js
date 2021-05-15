const { promises: Fs } = require('fs')

/**
 *
 * @param {diputado[]} diputados Lista de diputados
 */
async function writeSqlToDisk(diputados, sqlFilePath) {
  const sql = diputados
    .map((d) => {
      const puesto = `Diputación Local Sonora por Distrito ${d.distritoLocal}`
      return `insert into actores_politicos (nombre, puesto, img_url, created_at) values ('${d.nombre}', '${puesto}', '${d.imgUrl}', '2021-05-02 13:00:00') ON CONFLICT (nombre_formatted, puesto) DO UPDATE SET img_url = EXCLUDED.img_url;
insert into diputacion_local(actor_politico_id, periodo, distrito_local, estado, link) select id, '[2018-12-01,2021-12-02)'::daterange, ${d.distritoLocal}, 26, '${d.link}' from actores_politicos where nombre_formatted = lower(unaccent('${d.nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;`
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
