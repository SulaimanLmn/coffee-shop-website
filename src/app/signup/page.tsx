import { AuthForm } from "@/components/auth-form";
import { signupAction } from "@/app/account/actions";

export const metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const errorCode =
    typeof params.error === "string" ? params.error : undefined;
  return <AuthForm kind="signup" action={signupAction} errorCode={errorCode} />;
}
