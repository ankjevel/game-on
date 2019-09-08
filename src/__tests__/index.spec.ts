import supertest from 'supertest'
import * as dataStore from '../services/dataStore'
import { isUserWithOutPassword } from '../types/dataStore'

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
  encryption: {
    variable: 'foo',
    predictable: 'bar',
  },
  debug: false,
}))

let user: any
const jwtMock = (req, _res, next) => {
  req.user = user
  next()
}

jest.mock('express-jwt', () => () => jwtMock)
jest.mock('ioredis')
jest.mock('../services/dataStore')
jest.mock('../types/dataStore')
jest.mock('../routes/socket')

import app, { server } from '../index'

let errorMock: jest.Mock
let logMock: jest.Mock
let isUserWithOutPasswordMock: jest.Mock
let dataStoreMock: {
  [key: string]: jest.Mock
}
beforeEach(() => {
  errorMock = jest.fn()
  logMock = jest.fn()

  console.error = errorMock
  console.log = logMock
  isUserWithOutPasswordMock = (isUserWithOutPassword as unknown) as jest.Mock
  dataStoreMock = (dataStore as unknown) as any

  user = { id: 'foo' }
  dataStoreMock.all.mockResolvedValue([])
})

afterEach(() => {
  server.close()
})

describe('/', () => {
  it('gets a JSON on root-route', async () => {
    const { body } = await supertest(app)
      .get('/')
      .accept('application/json')
      .expect(200)

    expect(body).toEqual({
      version: '13.37.0-beta-2-final',
      name: 'test',
    })
  })
})

describe('/favicon.ico', () => {
  it('gets an empty 404 for /favicon.ico', async () => {
    const { text } = await supertest(app)
      .get('/favicon.ico')
      .expect(404)

    expect(text).toEqual('')
  })
})

describe('/group', () => {
  beforeEach(() => {
    isUserWithOutPasswordMock.mockReturnValue(true)
  })

  it('requires a valid token', async () => {
    isUserWithOutPasswordMock.mockReturnValue(false)

    await supertest(app)
      .post('/group')
      .send({})
      .expect(401)

    user = null
    isUserWithOutPasswordMock.mockReturnValue(true)

    await supertest(app)
      .post('/group')
      .send({})
      .expect(400)
  })

  it('parses the query-params', async () => {
    const innerCallback = jest.fn()
    dataStoreMock.create.mockImplementation((_, callback) => {
      innerCallback(callback(id))
    })

    const id = 'some generated uuid'
    const defaultObject = {
      id,
      name: '',
      startSum: 1000,
      owner: user.id,
      blind: {
        big: 5,
        small: 2,
      },
      users: [
        {
          id: user.id,
          sum: 1000,
        },
      ],
    }

    const tests: ([any, any] | [any, any, string])[] = [
      [{}, {}],
      [{}, {}],
      [{ name: 'foo' }, { name: 'foo' }],
      [{ name: '[fsffsf];;;' }, { name: '[fsffsf];;;' }],
      [{ name: ['fsffsf'] }, {}],
      [{ startSum: '[fsffsf];;;' }, {}],
      [
        { startSum: 1337 },
        { startSum: 1337, users: [{ id: user.id, sum: 1337 }] },
      ],
      [
        { startSum: '1337' },
        { startSum: 1337, users: [{ id: user.id, sum: 1337 }] },
      ],
      [
        { startSum: 1337.1337 },
        { startSum: 1337, users: [{ id: user.id, sum: 1337 }] },
      ],
      [
        { startSum: 1337.8 },
        { startSum: 1337, users: [{ id: user.id, sum: 1337 }] },
      ],
      [{ startSum: '1337,8' }, {}],
      [{ startSum: -1337 }, { startSum: 0, users: [{ id: user.id, sum: 0 }] }],
      [
        { startSum: Number.MAX_SAFE_INTEGER + 1337 },
        {
          startSum: Number.MAX_SAFE_INTEGER,
          users: [{ id: user.id, sum: Number.MAX_SAFE_INTEGER }],
        },
        'set max-SAFE-value',
      ],
      [
        { startSum: Number.MAX_VALUE },
        { startSum: 1, users: [{ id: user.id, sum: 1 }] },
        'set max-value',
      ],
    ]

    for (const [body, result, message = ''] of tests) {
      await supertest(app)
        .post('/group')
        .send(body)
        .expect(200)

      expect(dataStore.create, message).lastCalledWith(
        dataStore.StoreTypes.Group,
        expect.any(Function)
      )

      expect(innerCallback, message).lastCalledWith({
        ...defaultObject,
        ...result,
      })
    }
  })

  it('only allows the user to create if not already in a group', async () => {
    dataStoreMock.all.mockResolvedValue(['group:key'])
    dataStoreMock.get.mockResolvedValue({
      users: [{ id: user.id }],
    })

    const { body } = await supertest(app)
      .post('/group')
      .send({ name: 'foo' })
      .expect(200)

    expect(body).toEqual({})
    expect(dataStore.create).not.toBeCalled()
  })
})
