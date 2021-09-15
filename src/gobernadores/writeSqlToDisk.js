const { promises: Fs } = require('fs')

async function writeSqlToDisk(gubernaturas, sqlFilePath) {
  const sql = gubernaturas
    .map((gobernador) => {
      const { nombre, nombreEntidad, imgUrl, link, numeroEntidad, periodoRango } = gobernador
      const puesto = `Gubernatura por el estado de ${nombreEntidad} en período ${periodoRango}`

      const original = `insert into actores_politicos (nombre, puesto, img_url, created_at) 
values ('${nombre}', '${puesto}', '${imgUrl}', '2021-04-29 13:00:00') ON CONFLICT (nombre_formatted, puesto) 
DO UPDATE SET img_url = EXCLUDED.img_url;

insert into gobernacion(actor_politico_id, periodo, estado, link)
select id, '[2021-11-01,2024-09-01)'::daterange, ${numeroEntidad}, '${link}'
from actores_politicos where nombre_formatted = lower(unaccent('${nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;
`
      return original
    })
    .join('\n')
  const finalFile = `exports.seed = async function (knex) {
  await knex('gobernacion').del()
  await knex.schema.raw(\`
  ${sql}
  \`)
}
`
  await Fs.writeFile(sqlFilePath, finalFile)
  console.log('escribi archivo sql en ', sqlFilePath)
}

module.exports = writeSqlToDisk
