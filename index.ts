import { Contact, Wechaty, WechatyBuilder } from "wechaty";
import qrcode from 'qrcode-terminal'
import config from "./config";
import { cache } from './cache'
import { redis } from './redis'

const botName = config.botName
const allowGroups = config.allowGroups

export function createBot(botName: string = process.env.BOT_NAME || 'shanyue') {
  if (cache.get(botName)) {
    return cache.get(botName) as Wechaty
  }
  const bot = WechatyBuilder.build({
    name: botName,
    puppetOptions: {
      uos: true, // 开启uos协议
      tls: {
        disable: true
      },
      timeoutSeconds: 4 * 60,
    }

    // 可采用基于 iPad 协议的 PUPPET
    // puppet: 'wechaty-puppet-padlocal'
  })

  cache.set(config.botName, bot, { ttl: 30 * 24 * 3600 * 1000 })
  return bot
}

const bot = cache.get(botName) ? cache.get(botName) as Wechaty : WechatyBuilder.build({
  puppetOptions: {
    uos: true, // 开启uos协议
    tls: {
      disable: true
    },
    timeoutSeconds: 4 * 60,
  }
})

cache.set(config.botName, bot, { ttl: 30 * 24 * 3600 * 1000 })


function handleScan(url: string) {
  // Qrterminal.generate(qrcode, { small: true })
  if (cache.get(qrcode)) {
    return
  }
  // 十分钟不出现相同的二维码
  cache.set(qrcode, 1, {
    ttl: 10 * 60000
  })
  qrcode.generate(url, { small: true })
}

bot
  .on('scan', async (url) => {
    handleScan(url)
  })
  .on('login', async (user) => {
    console.log(user.name(), '已登录')
  })
  .on('message', async (message) => {
    const room = message.room()
    const text = message.text()
    const topic = await room?.topic()
    if (allowGroups.includes(topic!)) {
      console.log('user', message.talker().name())
      console.log('group', topic)
      console.log('text', text)
      console.log('-'.repeat(20))
      console.log(message)
    }
  })
  .on('logout', async (user) => {
    console.log(user.name, '退出登录')
  })

bot.start()