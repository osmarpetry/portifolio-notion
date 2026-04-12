import { getAllPagesInSpace, uuidToId } from 'notion-utils'
import pMemoize from 'p-memoize'

import * as config from './config'
import * as types from './types'
import { includeNotionIdInUrls } from './config'
import { getCanonicalPageId } from './get-canonical-page-id'
import { getPageWithRetry } from './notion-api'

const uuid = !!includeNotionIdInUrls

export async function getSiteMap(): Promise<types.SiteMap> {
  const partialSiteMap = await getAllPages(
    config.rootNotionPageId,
    config.rootNotionSpaceId
  )

  return {
    site: config.site,
    ...partialSiteMap
  } as types.SiteMap
}

const getAllPages = pMemoize(getAllPagesImpl, {
  cacheKey: (...args) => JSON.stringify(args)
})

async function getAllPagesImpl(
  rootNotionPageId: string,
  rootNotionSpaceId: string
): Promise<Partial<types.SiteMap>> {
  const emptySiteMap: Pick<types.SiteMap, 'pageMap' | 'canonicalPageMap'> = {
    pageMap: {},
    canonicalPageMap: {}
  }

  const getPage = async (pageId: string, ...args) => {
    console.log('\nnotion getPage', uuidToId(pageId))
    return getPageWithRetry(pageId, args[0])
  }

  let pageMap

  try {
    pageMap = await getAllPagesInSpace(
      rootNotionPageId,
      rootNotionSpaceId,
      getPage,
      {
        concurrency: 1
      }
    )
  } catch (error) {
    console.error('failed to build site map from notion', {
      rootNotionPageId,
      rootNotionSpaceId,
      error
    })
    return emptySiteMap
  }

  const canonicalPageMap = Object.keys(pageMap).reduce(
    (map, pageId: string) => {
      const recordMap = pageMap[pageId]
      if (!recordMap) {
        console.warn('skipping unreadable notion page in site map', { pageId })
        return map
      }

      let canonicalPageId: string

      try {
        canonicalPageId = getCanonicalPageId(pageId, recordMap, {
          uuid
        })
      } catch (error) {
        console.warn('skipping notion page with invalid canonical id', {
          pageId,
          error
        })
        return map
      }

      if (map[canonicalPageId]) {
        // you can have multiple pages in different collections that have the same id
        // TODO: we may want to error if neither entry is a collection page
        console.warn('error duplicate canonical page id', {
          canonicalPageId,
          pageId,
          existingPageId: map[canonicalPageId]
        })

        return map
      } else {
        return {
          ...map,
          [canonicalPageId]: pageId
        }
      }
    },
    {}
  )

  return {
    pageMap,
    canonicalPageMap
  }
}
