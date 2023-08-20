import { Message, Sayable } from 'wechaty'
import { Redis } from 'ioredis'

const redis = new Redis()

type Route = {
  handle: ((text: string, msg: Message) => Sayable) | ((text: string, msg: Message) => Promise<Sayable>)
  keyword: string
}

export const routes: Route[] = [
  {
    keyword: '/原神',
    async handle(text, msg) {
      return 1
    }
  },
  {
    keyword: '/铁道', async handle() {
      return 1
    }
  }
]