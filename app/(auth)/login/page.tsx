import { AuthForm } from "../AuthForm";

export const metadata = { title: "Log in — FirstStep" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={next} />;
}
