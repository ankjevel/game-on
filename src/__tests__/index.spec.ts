import supertest from 'supertest'
import * as dataStore from '../services/dataStore'

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
jest.mock('../routes/socket')

import app, { server } from '../index'

let errorMock: jest.Mock
let logMock: jest.Mock
let isUserWithOutPassword
let dataStoreMock: {
  [key: string]: jest.Mock
}
beforeEach(() => {
  isUserWithOutPassword = jest.spyOn(dataStore, 'isUserWithOutPassword')
  errorMock = jest.fn()
  logMock = jest.fn()

  console.error = errorMock
  console.log = logMock
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
    isUserWithOutPassword.mockReturnValue(true)
  })

  it('requires a valid token', async () => {
    isUserWithOutPassword.mockReturnValue(false)

    await supertest(app)
      .post('/group')
      .send({})
      .expect(401)

    user = null
    isUserWithOutPassword.mockReturnValue(true)

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
      pub: true,
    }

    const tests: ([any, any] | [any, any, string])[] = [
      [{ name: '1 foo' }, { name: '1-foo' }, 'replaces space with dash'],
      [{ name: '2 ☺☺☺' }, { name: '2' }, 'removes emojis'],
      [
        { name: 'FOO--BAR--club-2' },
        { name: 'foo-bar-club-2' },
        'lowercase and dash',
      ],
      [
        { name: ';drop table users' },
        { name: 'drop-table-users' },
        'limited amount of allowed characters',
      ],
      [
        { name: 'hello    world' },
        { name: 'hello-world' },
        'removes whitespace',
      ],
      [{ name: ['4-fsffsf'] }, {}, 'strict string-type'],
      [{ name: '-- ☺☺☺ --' }, {}, 'if only dash, it will be ignored'],
      [{ startSum: '[fsffsf];;;' }, {}, 'startsum not a number'],
      [{ startSum: '1337,8' }, {}, 'not a number'],
      [
        { startSum: 1337 },
        {
          startSum: 1337,
          users: expect.arrayContaining([
            expect.objectContaining({
              sum: 1337,
            }),
          ]),
        },
        'valid start sum',
      ],
      [
        { startSum: '1337' },
        {
          startSum: 1337,
          users: expect.arrayContaining([
            expect.objectContaining({
              sum: 1337,
            }),
          ]),
        },
        'it allows strings',
      ],
      [
        { startSum: 1337.1337 },
        {
          startSum: 1337,
          users: expect.arrayContaining([
            expect.objectContaining({
              sum: 1337,
            }),
          ]),
        },
        'integer, not float',
      ],
      [{ startSum: -1337 }, {}, 'ignores negative numbers'],
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
        'group',
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
