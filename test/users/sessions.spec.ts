import test from 'japa'
import supertest from 'supertest'
import { userFactory } from 'Database/factories'
import Database from '@ioc:Adonis/Lucid/Database'

const baseURL = `http://${process.env.HOST}:${process.env.PORT}`

test.group('Sessions', (group) => {
  test('it should authenticate an user', async (assert) => {
    const plainPassword = 'teste'
    const { email, id } = await userFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.user, 'User undefined')
    assert.equal(body.user.id, id)
  })

  test('it should return an api token when sessions is created', async (assert) => {
    const plainPassword = 'teste'
    const { email, id } = await userFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    assert.isDefined(body.token, 'Token undefined')
    assert.equal(body.user.id, id)
  })

  test('it should return 400 when credentials are not provided', async (assert) => {
    const { body } = await supertest(baseURL).post('/sessions').send({}).expect(400)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 400)
    assert.equal(body.message, 'invalid credentials')
  })

  test('it should return 400 when credentials are invalid', async (assert) => {
    const { email } = await userFactory.create()
    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email, password: 'senhaerrada' })
      .expect(400)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 400)
    assert.equal(body.message, 'invalid credentials')
  })

  test('it should 200 when user signs out', async () => {
    const plainPassword = 'teste'
    const { email, id } = await userFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    const apiToken = body.token

    await supertest(baseURL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${apiToken.token}`)
      .expect(200)
  })

  test('it should revoke token an user signs out', async (assert) => {
    const plainPassword = 'teste'
    const { email } = await userFactory.merge({ password: plainPassword }).create()

    const { body } = await supertest(baseURL)
      .post('/sessions')
      .send({ email, password: plainPassword })
      .expect(201)

    const apiToken = body.token

    const tokenBeforeSignout = await Database.query().select('*').from('api_tokens')
    assert.isNotEmpty(tokenBeforeSignout)

    await supertest(baseURL)
      .delete('/sessions')
      .set('Authorization', `Bearer ${apiToken.token}`)
      .expect(200)

    const token = await Database.query().select('*').from('api_tokens')

    assert.isEmpty(token)
  })

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
