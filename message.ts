import { Message } from 'wechaty'
import { Message as MessageType } from 'wechaty-puppet/types'
import { Contact as ContactType } from 'wechaty-puppet/types'
import { routes } from './routes'
import { redis } from './redis'

async function defaultFilter(msg: Message) {
  const metionSelf = await msg.mentionSelf()
  // 屏蔽微信运动、公众号消息等
  return (
    (msg.type() === MessageType.Text || msg.type() === MessageType.Image) &&
    (
      !msg.room() || (msg.room() && metionSelf) || (msg.type() === MessageType.Image && process.env.ENABLE_GROUP_IMAGE)
    ) &&
    msg.talker().type() !== ContactType.Official &&
    msg.talker().name() !== '朋友推荐消息'
  )
}

const createdAt = Date.now()
export async function handleMessage(msg: Message) {
  // 如果是过时的消息，则不理睬
  if (msg.date().getTime() < createdAt) {
    return
  }
  // 如果是自己发的消息，则不理睬
  if (msg.talker().self()) {
    return
  }
  const enable = await defaultFilter(msg)
  if (!enable) {
    return
  }
  console.log(msg.talker().name(), await msg.room()?.topic(), msg.text(), msg.date().toJSON())
  const text = await msg.mentionText()

  const fetchRoute = async () => {
    for (const route of routes) {
      const keyword = route.keyword
      const filter = await (route.filter || defaultFilter)(msg)
      if (typeof keyword === 'string') {
        if (text.includes(keyword) && filter) {
          return route
        }
      } else if (keyword.test(text) && filter) {
        return route
      }
    }
  }
  const route = await fetchRoute()
  if (!route) {
    return
  }
  const replyText = await route.handle(text, msg)
  if (replyText) {
    let group = null
    if (msg.room()) {
      group = await msg.room().topic()
    }
    logger.info(replyText.toString(), {
      text,
      reply: replyText,
      user: msg.talker().name(),
      group,
      time: dayjs().diff(msg.date(), 'second')
    })
    // 发图片有可能失败
    await retry(() => msg.say(replyText), { times: 3 })
  }
}