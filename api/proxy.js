import express from 'express'
import cors from 'cors'
import request from 'request'

const app = express()
app.use(cors())

function parseProxyParameters(proxyRequest) {
  const params = {}
  const urlMatch = proxyRequest.url.match(/(?<=[?&])url=(?<url>.*)$/)
  if (urlMatch) {
    params.url = decodeURIComponent(urlMatch.groups.url)
  }
  return params
}

app.all('/*', (req, res) => {
  const proxyParams = parseProxyParameters(req)
  if (!proxyParams.url) {
    return res.status(400).json({ msg: 'Missing url param' })
  }
  const target = request(proxyParams.url)
  req.pipe(target)
  target.pipe(res)
})

export default app
