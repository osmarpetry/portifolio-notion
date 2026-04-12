import * as React from 'react'

import { NotionPage } from '@/components/NotionPage'
import { domain, rootNotionPageId, site } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'

export const getStaticProps = async () => {
  try {
    const props = await resolveNotionPage(domain)

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, err)
    return {
      props: {
        site,
        pageId: rootNotionPageId,
        error: {
          message: `Failed to load the root Notion page "${rootNotionPageId}". Make sure it is published to the web or provide NOTION_TOKEN_V2 and NOTION_ACTIVE_USER in the server environment.`,
          statusCode: 503
        }
      },
      revalidate: 10
    }
  }
}

export default function NotionDomainPage(props) {
  return <NotionPage {...props} />
}
