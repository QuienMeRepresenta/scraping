const cloudinary = require('../cloudinary')
const Promise = require('bluebird')

const uploadToCloudinary = async (diputado) => {
  try {
    const cloudinaryFolder = `diputacion_federal/legislatura_${diputado.legislatura}`
    const { secure_url } = await cloudinary.uploader.upload(diputado.congresoImgUrl, {
      folder: cloudinaryFolder,
      public_id: diputado.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })
    return {
      ...diputado,
      imgUrl: secure_url,
    }
  } catch (e) {
    console.error('No pude subir', diputado.congresoImgUrl, 'link', diputado.link)
    return {
      ...diputado,
      imgUrl: 'https://via.placeholder.com/50',
    }
  }
}

async function upload(diputados) {
  const diputadosWithCloudinary = await Promise.mapSeries(diputados, async (diputado) => {
    console.log('subiendo imagen de diputado', diputado.nombre, 'del distrito', diputado.distrito)
    return uploadToCloudinary(diputado)
  })

  return diputadosWithCloudinary
}

module.exports = upload
