import { NotionAPI } from 'notion-client'

const authToken =
  process.env.NOTION_TOKEN_V2 ||
  process.env.NOTION_AUTH_TOKEN ||
  process.env.NOTION_TOKEN

const activeUser =
  process.env.NOTION_ACTIVE_USER ||
  process.env.NOTION_ACTIVE_USER_ID

export const notion = new NotionAPI({
  apiBaseUrl: process.env.NOTION_API_BASE_URL,
  authToken,
  activeUser
})
