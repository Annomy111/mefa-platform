import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'sq', 'bs', 'hr', 'mk', 'me', 'sr', 'tr'] as const;
export const defaultLocale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale || defaultLocale;

  return {
    locale,
    messages: {}
  };
});