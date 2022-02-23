import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import { groupFactory, userFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'

const baseURL = `http://${process.env.HOST}:${process.env.PORT}`

let token = ''
let user = {} as User

test.group('GroupRequest', (group) => {
  test('it should create a group request', async (assert) => {
    const { id: masterId } = await userFactory.create()
    const group = await groupFactory.merge({ master: masterId }).create()

    const { body } = await supertest(baseURL)
      .post(`/groups/${group.id}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201)

    assert.exists(body.groupRequest, 'group request undefined')
    assert.equal(body.groupRequest.userId, user.id)
    assert.equal(body.groupRequest.groupId, group.id)
    assert.equal(body.groupRequest.status, 'PENDING')
  })

  test('it should return 409 when group request already exists', async (assert) => {
    const { id: masterId } = await userFactory.create()
    const group = await groupFactory.merge({ master: masterId }).create()

    await supertest(baseURL)
      .post(`/groups/${group.id}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(201)

    const { body } = await supertest(baseURL)
      .post(`/groups/${group.id}/requests`)
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(409)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when user is already in the group', async (assert) => {
    const groupPaylaod = {
      name: 'test',
      description: 'test',
      schedule: 'test',
      location: 'test',
      chronic: 'test',
      master: user.id,
    }

    // Master is added to group
    const { body: responseData } = await supertest(baseURL)
      .post('/groups')
      .set('Authorization', `Bearer ${token}`)
      .send(groupPaylaod)

    // console.log(responseData.group.players)

    const { body } = await supertest(baseURL)
      .post(`/groups/${responseData.group.id}/requests`)
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
