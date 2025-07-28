import express from 'express'
import cors from 'cors'
import request from 'request'

const app = express()
app.use(cors())

function parseProxyParameters(req) {
  const params = {}
  const urlMatch = req.url.match(/(?<=[?&])url=(?<url>.*)$/)
  if (urlMatch) {
    params.url = decodeURIComponent(urlMatch.groups.url)
  }
  return params
}

app.all('*', (req, res) => {
  const { url } = parseProxyParameters(req)
  if (!url) {
    return res.status(400).json({ error: 'Missing url parameter' })
  }
  const proxy = request(url)
  req.pipe(proxy)
  proxy.pipe(res)
})

export default app
