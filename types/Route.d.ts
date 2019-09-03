import { RequestHandler, Application } from 'express'

export type Route = (app: Application, requireAuth: RequestHandler) => void

export default Route
