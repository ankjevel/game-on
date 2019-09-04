import supertest from 'supertest'
import * as dataStore from '../services/dataStore'
import { CreateGroupInput } from 'dataStore'

jest.mock('../config', () => ({
  express: {
    port: 0,
    host: '',
  },
  packageJSON: {
    name: 'test',
    version: '13.37.0-beta-2-final',
  },
  jwt: {
    secret: 'supersecret',
    expire: '25h',
  },
}))

jest.mock('ioredis')
jest.mock('../services/dataStore')

import app, { server } from '../index'

let errorMock: jest.Mock
let logMock: jest.Mock
let dataStoreCreate: jest.Mock
beforeEach(() => {
  errorMock = jest.fn()
  logMock = jest.fn()

  console.error = errorMock
  console.log = logMock

  dataStoreCreate = dataStore.create as jest.Mock
})

afterEach(() => {
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
  describe('/group', () => {
    it('parses the query-params', async () => {
      const innerCallback = jest.fn()
      dataStoreCreate.mockImplementation((_, callback) => {
        innerCallback(callback(id))
      })

      const id = 'some generated uuid'
      const defaultObject = {
        id,
        name: '',
        startSum: 1000,
        users: [],
      }

      const tests: (
        | [string, CreateGroupInput]
        | [string, CreateGroupInput, string])[] = [
        ['/group', {}],
        ['/group?', {}],
        ['/group?name=foo', { name: 'foo' }],
        ['/group?name=[fsffsf];;;', { name: '[fsffsf];;;' }],
        ['/group?startSum=[fsffsf];;;', {}],
        ['/group?startSum=1337', { startSum: 1337 }],
        ['/group?startSum= 1337', { startSum: 1337 }],
        ['/group?startSum=1337.1337', { startSum: 1337 }],
        ['/group?startSum=1337.8', { startSum: 1337 }],
        ['/group?startSum=1337,8', {}],
        ['/group?startSum=-1337', { startSum: 0 }],
        [
          `/group?startSum=99999999999999999999999`,
          { startSum: Number.MAX_SAFE_INTEGER },
          'set max-value',
        ],
      ]

      for (const [query, result, message = ''] of tests) {
        await supertest(app)
          .get(query as string)
          .expect(200)

        expect(dataStoreCreate, message).lastCalledWith(
          dataStore.StoreTypes.Group,
          expect.any(Function)
        )

        expect(innerCallback, message).lastCalledWith({
          ...defaultObject,
          ...result,
        })
      }
    })
  })
})
