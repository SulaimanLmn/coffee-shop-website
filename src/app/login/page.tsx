import { AuthForm } from "@/components/auth-form";
import { loginAction } from "@/app/account/actions";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorCode =
    typeof params.error === "string" ? params.error : undefined;
  return <AuthForm kind="login" action={loginAction} errorCode={errorCode} />;
}
