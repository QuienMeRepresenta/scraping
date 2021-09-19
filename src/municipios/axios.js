const https = require('https')
const axios = require('axios')

const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.95 Safari/537.36'

const instance = axios.create({
  responseType: 'arraybuffer',
  responseEncoding: 'binary',
  httpsAgent: new https.Agent({
    rejectUnauthorized: false,
  }),
  headers: {
    Accept: '*/*',
    'User-Agent': userAgent,
    'Content-Type': 'application/x-www-form-urlencoded',
    'X-Requested-With': 'XMLHttpRequest',
    Origin: 'http://www.snim.rami.gob.mx',
    DNT: 1,
    Referer: 'http://www.snim.rami.gob.mx/index2.html',
    Cookie: 'PHPSESSID=umaevc6fsl1jqheuhjobinru40; jquery-ui-theme=Smoothness',
    Pragma: 'no-cache',
    'Cache-Control': 'no-cache',
    Connection: 'Keep-Alive',
    'Accept-Encoding': 'gzip, deflate',
    'Accept-Language': 'en-US,*',
  },
})

module.exports = instance
