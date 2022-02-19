import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class CreateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    username: schema.string({}),
    password: schema.string({}, [rules.minLength(4)]),
    email: schema.string({}, [rules.email()]),
  })

  public messages = {}
}
