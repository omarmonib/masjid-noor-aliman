import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const validLocale = ["ar", "en"].includes(locale as string) ? locale : "ar";

  return {
    locale: validLocale as string,
    messages: (await import(`./messages/${validLocale}.json`)).default,
  };
});
