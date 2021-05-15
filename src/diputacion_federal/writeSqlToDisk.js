const { promises: Fs } = require('fs')

async function writeSqlToDisk(diputados, sqlFilePath) {
  const sql = diputados
    .map((diputado) => {
      const { nombre, distrito, imgUrl, link, numeroEntidad, legislatura } = diputado
      const puesto = `Diputación Federal por Distrito Federal ${distrito} en legislatura ${legislatura}`

      const original = `insert into actores_politicos (nombre, puesto, img_url, created_at) values ('${nombre}', '${puesto}', '${imgUrl}', '2021-04-29 13:00:00') ON CONFLICT (nombre_formatted, puesto) DO UPDATE SET img_url = EXCLUDED.img_url;
insert into diputacion_federal(actor_politico_id, periodo, distrito_federal, numero_entidad, link) select id, '[2018-11-01,2021-09-01)'::daterange, ${distrito}, ${numeroEntidad}, '${link}' from actores_politicos where nombre_formatted = lower(unaccent('${nombre}')) and puesto = '${puesto}' ON CONFLICT  DO NOTHING;`
      return original
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
