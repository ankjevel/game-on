import supertest from 'supertest'
// import path from 'path'
// import querystring from 'querystring'
// import hasProp from '../utils/hasProp'

import * as dataStore from '../services/dataStore'
import { CreateInput } from 'dataStore'

jest.mock('../config', () => ({
  express: {
    port: 0,
    host: '',
  },
  packageJSON: {
    name: 'test',
    version: '13.37.0-beta-2-final',
  },
}))

jest.mock('ioredis')

jest.mock('../services/dataStore')

import app, { server } from '../index'

let errorMock: jest.Mock
let logMock: jest.Mock
beforeEach(() => {
  errorMock = jest.fn()
  logMock = jest.fn()

  console.error = errorMock
  console.log = logMock
})

afterAll(() => {
  server.close()
})

describe('app routes', () => {
  describe('GET /', () => {
    it('gets a JSON on root-route', async () => {
      const { body } = await supertest(app)
        .get('/')
        .expect(200)

      expect(body).toEqual({
        version: '13.37.0-beta-2-final',
        name: 'test',
      })
    })
  })

  describe('GET /favicon', () => {
    it('gets an empty 404 for /favicon.ico', async () => {
      const { text } = await supertest(app)
        .get('/favicon.ico')
        .expect(404)

      expect(text).toEqual('')
    })
  })
})

describe('setup', () => {
  describe('/new', () => {
    it('parses the query-params', async () => {
      const tests: ([string, CreateInput] | [string, CreateInput, string])[] = [
        ['/new', {}],
        ['/new?', {}],
        ['/new?name=foo', { name: 'foo' }],
        ['/new?name=[fsffsf];;;', { name: '[fsffsf];;;' }],
        ['/new?startSum=[fsffsf];;;', {}],
        ['/new?startSum=1337', { startSum: 1337 }],
        ['/new?startSum= 1337', { startSum: 1337 }],
        ['/new?startSum=1337.1337', { startSum: 1337 }],
        ['/new?startSum=1337.8', { startSum: 1337 }],
        ['/new?startSum=1337,8', {}],
        ['/new?startSum=-1337', { startSum: 0 }],
        [
          `/new?startSum=99999999999999999999999`,
          { startSum: Number.MAX_SAFE_INTEGER },
          'set max-value',
        ],
      ]

      Promise.all(
        tests.map(async ([query, result, message = ''], index) => {
          await supertest(app)
            .get(query as string)
            .expect(200)
          expect(dataStore.create, message).nthCalledWith(index + 1, result)
        })
      )
    })
  })
})
