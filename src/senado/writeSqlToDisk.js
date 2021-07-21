const { promises: Fs } = require('fs')

async function writeSqlToDisk(diputados, sqlFilePath) {
  const deleteSql = `await knex('senadurias').del()`

  const sql = diputados
    .map((diputado) => {
      const { nombre, nombreEntidad, imgUrl, link, numeroEntidad, legislatura } = diputado
      const puesto = `Senaduría por el estado de ${nombreEntidad} en legislatura ${legislatura}`

      const original = `insert into actores_politicos (nombre, puesto, img_url, created_at) values ('${nombre}', '${puesto}', '${imgUrl}', '2021-04-29 13:00:00') ON CONFLICT (nombre_formatted, puesto) DO UPDATE SET img_url = EXCLUDED.img_url;
insert into senadurias(actor_politico_id, periodo, estado, link) select id, '[2018-11-01, 2024-9-1)'::daterange, ${numeroEntidad}, '${link}' from actores_politicos where nombre_formatted = lower(unaccent('${nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;`

      return original
    })
    .join('\n')
  const finalFile = `exports.seed = async function (knex) {
  ${deleteSql}
  await knex.schema.raw(\`
  ${sql}
  \`)
}
`
  await Fs.writeFile(sqlFilePath, finalFile)
  console.log('escribi archivo sql en ', sqlFilePath)
}

module.exports = writeSqlToDisk
