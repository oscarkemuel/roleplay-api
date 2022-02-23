import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import { userFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const baseURL = `http://${process.env.HOST}:${process.env.PORT}`
let token = ''
let user = {} as User

test.group('Group', (group) => {
  test('it should create a group', async (assert) => {
    const groupPaylaod = {
      name: 'group name',
      description: 'group description',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: user.id,
    }

    const { body } = await supertest(baseURL)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupPaylaod)
      .expect(201)

    assert.exists(body.group, 'group undefined')
    assert.equal(body.group.name, groupPaylaod.name)
    assert.equal(body.group.description, groupPaylaod.description)
    assert.equal(body.group.schedule, groupPaylaod.schedule)
    assert.equal(body.group.location, groupPaylaod.location)
    assert.equal(body.group.chronic, groupPaylaod.chronic)
    assert.equal(body.group.master, groupPaylaod.master)
    assert.exists(body.group.players, 'players undefined')
    assert.equal(body.group.players.length, 1)
    assert.equal(body.group.players[0].id, groupPaylaod.master)
  })

  test('it should return 422 when required data is not priveded', async (assert) => {
    const { body } = await supertest(baseURL)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  group.before(async () => {
    const plainPassword = 'teste'
    const newUser = await userFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email: newUser.email, password: plainPassword })
      .expect(201)

    token = body.token.token
    user = newUser
  })

  group.after(async () => {
    await supertest(baseURL).delete('/sessions').set('Authorization', `Bearer ${token}`)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
