import { SignUp } from "@clerk/tanstack-react-start";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
  component: SignUpPage,
});

function SignUpPage() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6">
      <SignUp />
    </div>
  );
}
