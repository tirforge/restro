import Link from "next/link";

import { LoginForm } from "@/components/login-form";

const GUEST_ORDER_PATH =
  process.env.GUEST_DEMO_ORDER_PATH ?? "/order/demo-restaurant";

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
        <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          OR
          <span className="h-px flex-1 bg-border" />
        </div>
        <Link
          href={GUEST_ORDER_PATH}
          className="mt-4 flex h-10 w-full items-center justify-center rounded-md border border-input bg-background text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Continue as Guest — order without login
        </Link>
      </div>
    </div>
  );
}
