import * as React from 'react'
import { GetStaticProps } from 'next'

import { NotionPage } from '@/components/NotionPage'
import { domain, isDev, site } from '@/lib/config'
import { resolveNotionPage } from '@/lib/resolve-notion-page'
import { PageProps, Params } from '@/lib/types'

export const getStaticProps: GetStaticProps<PageProps, Params> = async (
  context
) => {
  const rawPageId = context.params.pageId as string

  try {
    const props = await resolveNotionPage(domain, rawPageId)

    if (props.error?.statusCode === 404) {
      return {
        notFound: true,
        revalidate: 10
      }
    }

    return { props, revalidate: 10 }
  } catch (err) {
    console.error('page error', domain, rawPageId, err)
    return {
      props: {
        site,
        pageId: rawPageId,
        error: {
          message: `Failed to load Notion page "${rawPageId}". Make sure it is published to the web or provide NOTION_TOKEN_V2 and NOTION_ACTIVE_USER in the server environment.`,
          statusCode: 503
        }
      },
      revalidate: 10
    }
  }
}

export async function getStaticPaths() {
  if (isDev) {
    return {
      paths: [],
      fallback: true
    }
  }

  return {
    paths: [],
    fallback: 'blocking'
  }
}

export default function NotionDomainDynamicPage(props) {
  return <NotionPage {...props} />
}
