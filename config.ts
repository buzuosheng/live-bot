import * as dotenv from 'dotenv'

dotenv.config()

export default {
  allowGroups: process.env.ALLOW_GROUPS?.split(',') || '*',
  botName: process.env.BOTNAME || 'loginBot'
}