import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string; native?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl, native } = await searchParams;
  return (
    <LoginForm locale={locale} callbackUrl={callbackUrl} native={native} />
  );
}
