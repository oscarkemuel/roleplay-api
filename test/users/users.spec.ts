import Database from '@ioc:Adonis/Lucid/Database'
import { userFactory } from 'Database/factories'
import test from 'japa'
import supertest from 'supertest'
import Hash from '@ioc:Adonis/Core/Hash'
import User from 'App/Models/User'

const baseURL = `http://${process.env.HOST}:${process.env.PORT}`
let token = ''
let user = {} as User

test.group('User', (group) => {
  test('it should create an user', async (assert) => {
    const userPlayload = {
      email: 'teste@gmail.com',
      username: 'teste',
      password: 'teste',
      avatar: 'https://www.twitch.tv/gafallen',
    }

    const { body } = await supertest(baseURL).post('/users').send(userPlayload).expect(201)

    assert.exists(body.user, 'User undefined')
    assert.exists(body.user.id, 'ID undefined')

    assert.equal(body.user.email, userPlayload.email)
    assert.equal(body.user.username, userPlayload.username)
    assert.notExists(body.user.password, 'Password defined')
  })

  test('it should return 409 when email is already in user', async (assert) => {
    const { email } = await userFactory.create()
    const { body } = await supertest(baseURL)
      .post('/users')
      .send({
        email,
        username: 'teste',
        password: 'teste',
        avatar: '',
      })
      .expect(409)

    assert.include(body.message, 'email')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 409 when username is already in user', async (assert) => {
    const { username } = await userFactory.create()
    const { body } = await supertest(baseURL)
      .post('/users')
      .send({
        email: 'teste@gmail.com',
        username,
        password: 'teste',
        avatar: '',
      })
      .expect(409)

    assert.include(body.message, 'username')
    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 409)
  })

  test('it should return 422 when required data is not provided', async (assert) => {
    const { body } = await supertest(baseURL).post('/users').send({}).expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required password is not valid', async (assert) => {
    const { body } = await supertest(baseURL)
      .post('/users')
      .send({
        email: 'teste@gmail.com',
        username: 'teste',
        password: '123',
        avatar: 'https://www.twitch.tv/gafallen',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required email is not valid', async (assert) => {
    const { body } = await supertest(baseURL)
      .post('/users')
      .send({
        email: 'asdasdasd',
        password: 'teste',
        username: 'teste',
        avatar: 'https://www.twitch.tv/gafallen',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required username is empty', async (assert) => {
    const { body } = await supertest(baseURL)
      .post('/users')
      .send({
        email: 'asdasdasd',
        password: 'teste',
        avatar: 'https://www.twitch.tv/gafallen',
      })
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should update an user', async (assert) => {
    const email = 'teste@teste.com'
    const avatar = 'https://www.google.com'

    const { body } = await supertest(baseURL)
      .put(`/users/${user.id}`)
      .send({ email, avatar, password: user.password })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.email, email)
    assert.equal(body.user.avatar, avatar)
    assert.equal(body.user.id, user.id)
  })

  test('it should update the password of the user', async (assert) => {
    const password = '40028922'

    const { body } = await supertest(baseURL)
      .put(`/users/${user.id}`)
      .send({ email: user.email, avatar: user.avatar, password })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    await user.refresh()

    assert.exists(body.user, 'User undefined')
    assert.equal(body.user.id, user.id)
    assert.isTrue(await Hash.verify(user.password, password))
  })

  test('it should return 422 when required data is not provided to update', async (assert) => {
    const { id } = await userFactory.create()

    const { body } = await supertest(baseURL)
      .put(`/users/${id}`)
      .send({})
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required email is not valid to update', async (assert) => {
    const { id, password, avatar } = await userFactory.create()

    const { body } = await supertest(baseURL)
      .put(`/users/${id}`)
      .send({ password, avatar, email: 'invalidemail' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required password is not valid to update', async (assert) => {
    const { id, email, avatar } = await userFactory.create()

    const { body } = await supertest(baseURL)
      .put(`/users/${id}`)
      .send({ email, avatar, password: '123' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required avatar is not valid to update', async (assert) => {
    const { id, email, password } = await userFactory.create()

    const { body } = await supertest(baseURL)
      .put(`/users/${id}`)
      .send({ email, password, avatar: 'notisurl' })
      .set('Authorization', `Bearer ${token}`)
      .expect(422)

    assert.equal(body.code, 'BAD_REQUEST')
    assert.equal(body.status, 422)
  })

  test('it should return 422 when required user_id is not valid to update', async (assert) => {
    const { email, password } = await userFactory.create()

    const { body } = await supertest(baseURL)
      .put(`/users/${362626563235}`)
      .send({ email, password, avatar: 'notisurl' })
      .set('Authorization', `Bearer ${token}`)
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

  group.beforeEach(async () => {
    await Database.beginGlobalTransaction()
  })

  group.afterEach(async () => {
    await Database.rollbackGlobalTransaction()
  })
})
