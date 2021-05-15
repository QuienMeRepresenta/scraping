const cloudinary = require('../cloudinary')
const Promise = require('bluebird')

const uploadToCloudinary = async (senador) => {
  try {
    const cloudinaryFolder = `senado/legislatura_${senador.legislatura}`
    const { secure_url } = await cloudinary.uploader.upload(senador.senadoImgUrl, {
      folder: cloudinaryFolder,
      public_id: senador.nombre.toLowerCase().replace(/\s/g, '_'),
      overwrite: false,
    })
    return {
      ...senador,
      imgUrl: secure_url,
    }
  } catch (e) {
    console.error('No pude subir', senador.senadoImgUrl, 'link', senador.link)
    return {
      ...senador,
      imgUrl: 'https://via.placeholder.com/50',
    }
  }
}

async function upload(senadores) {
  const senadorWithCloudinary = await Promise.mapSeries(senadores, async (senador) => {
    console.log('subiendo imagen de senador', senador.nombre, 'de', senador.nombreEntidad)
    return uploadToCloudinary(senador)
  })

  return senadorWithCloudinary
}

module.exports = upload
