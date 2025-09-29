import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { locales, defaultLocale, type AppLocale } from '../../i18n'
import { translations } from '@/lib/translations'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MEFA - Municipal EU Funds Application Assistant',
  description: 'Helping Western Balkans municipalities access EU funding through IPA III'
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

function resolveLocale(locale: string): AppLocale {
  if (locales.includes(locale as AppLocale)) {
    return locale as AppLocale
  }
  if (locale === undefined || locale === null) {
    return defaultLocale
  }
  notFound()
}

export default function LocaleLayout({
  children,
  params
}: {
  children: ReactNode
  params: { locale: string }
}) {
  const locale = resolveLocale(params.locale)
  const messages = translations[locale]

  if (!messages) {
    notFound()
  }

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages} defaultTranslationValues={{}}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
