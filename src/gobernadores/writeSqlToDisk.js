const { promises: Fs } = require('fs')

async function writeSqlToDisk(gubernaturas, sqlFilePath) {
  const deleteSql = `await knex('gobernacion').del()`

  const sql = gubernaturas
    .map((gobernador) => {
      const {
        nombre,
        nombreEntidad,
        imgUrl,
        // link, TODO: Add link to schema
        numeroEntidad,
        // periodo,
        periodoRango,
      } = gobernador
      const puesto = `Gubernatura por el estado de ${nombreEntidad} en período ${periodoRango}`

      const original = `insert into actores_politicos (nombre, puesto, img_url, created_at) 
values ('${nombre}', '${puesto}', '${imgUrl}', '2021-04-29 13:00:00') ON CONFLICT (nombre_formatted, puesto) 
DO UPDATE SET img_url = EXCLUDED.img_url;

insert into gobernacion(actor_politico_id, periodo, estado)
select id, '${periodoRango}'::daterange, ${numeroEntidad}
from actores_politicos where nombre_formatted = lower(unaccent('${nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;
`

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
