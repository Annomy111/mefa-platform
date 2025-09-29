export const locales = ['en', 'sq', 'bs', 'hr', 'mk', 'me', 'sr', 'tr'] as const
export const defaultLocale = 'en'

export type AppLocale = (typeof locales)[number]
