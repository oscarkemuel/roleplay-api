import { schema, rules } from '@ioc:Adonis/Core/Validator'
import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class UpdateUserValidator {
  constructor(protected ctx: HttpContextContract) {}

  public schema = schema.create({
    password: schema.string({}, [rules.minLength(4)]),
    email: schema.string({}, [rules.email()]),
    avatar: schema.string.optional({}, [rules.url()]),
  })

  public messages = {}
}
