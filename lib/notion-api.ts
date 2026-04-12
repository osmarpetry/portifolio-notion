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

const notionRetryAttempts = Number(process.env.NOTION_RETRY_ATTEMPTS || 5)
const notionRetryDelayMs = Number(process.env.NOTION_RETRY_DELAY_MS || 1500)

type NotionGetPageOptions = Parameters<NotionAPI['getPage']>[1]

function getErrorStatusCode(error: any): number | undefined {
  return (
    error?.statusCode ||
    error?.status ||
    error?.response?.status ||
    error?.data?.status
  )
}

export function isNotionRateLimitedError(error: any): boolean {
  return (
    getErrorStatusCode(error) === 429 ||
    String(error?.message || '').includes('429 Too Many Requests')
  )
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getPageWithRetry(
  pageId: string,
  options?: NotionGetPageOptions
) {
  let lastError: unknown

  for (let attempt = 1; attempt <= notionRetryAttempts; attempt++) {
    try {
      return await notion.getPage(pageId, options)
    } catch (error) {
      lastError = error

      if (!isNotionRateLimitedError(error) || attempt === notionRetryAttempts) {
        throw error
      }

      const delayMs = notionRetryDelayMs * 2 ** (attempt - 1)
      console.warn('notion getPage rate limited; retrying', {
        pageId,
        attempt,
        notionRetryAttempts,
        delayMs
      })
      await sleep(delayMs)
    }
  }

  throw lastError
}
