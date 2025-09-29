import createMiddleware from 'next-intl/middleware'

import { locales, defaultLocale } from './i18n'

export const runtime = 'edge'

export default createMiddleware({
  locales: [...locales],
  defaultLocale
})

export const config = {
  matcher: [
    '/',
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'
  ]
}
