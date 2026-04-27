import { SignIn } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <SignIn signUpUrl="/sign-up" />
    </div>
  );
}
