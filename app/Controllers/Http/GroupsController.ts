import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Group from 'App/Models/Group'
import CreateGroupValidator from 'App/Validators/CreateGroupValidator'

export default class GroupsController {
  public async store({ request, response }: HttpContextContract) {
    const groupPaylaod = await request.validate(CreateGroupValidator)

    const group = await Group.create(groupPaylaod)

    await group.related('players').attach([groupPaylaod.master])
    await group.load('players')

    return response.created({ group })
  }
}
