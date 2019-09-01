import { Application } from 'express'
import { packageJSON } from '../config'
import * as dataStore from '../services/dataStore'
import { StoreTypes } from '../types/dataStore'

export default (app: Application) => {
	app.get('/', (_req, res) => res.send(packageJSON))
	app.get('/favicon.ico', (_req, res) => res.status(404).send(null))

  app.get('/new', async (_req, res) => res.send(await dataStore.create()))



	app.get('/get/:id', async ({ params: { id } }, res) => {
		res.send(await dataStore.get({ id }))
	})
	app.get('/get/user/:id', async ({ params: { id } }, res) => {
		res.send(await dataStore.get({ type: StoreTypes.User, id }))
	})
	app.get('/get/group/:id', async ({ params: { id } }, res) => {
		res.send(await dataStore.get({ type: StoreTypes.Group, id }))
	})
}
