import express from 'express'
import bodyParser from 'body-parser'
import config from './config'

import routes from './routes'

const app = express()

app.use(bodyParser.json())

routes(app)

app.use((err, _req, _res, next) => {
	console.error(err.stack)
	next(err)
})

app.listen(config.express, () => {
	console.log(`listening on port ${config.express.port}`)
})
