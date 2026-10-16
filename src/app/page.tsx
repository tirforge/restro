import Link from "next/link";
import { UtensilsCrossedIcon } from "lucide-react";

const GUEST_ORDER_PATH =
  process.env.GUEST_DEMO_ORDER_PATH ?? "/order/demo-restaurant";
const STAFF_DEMO_LOGIN_PATH =
  process.env.STAFF_DEMO_LOGIN_PATH ?? "/u/demo-restaurant/login";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <UtensilsCrossedIcon className="size-8" />
        </span>
        <h1 className="text-3xl font-bold tracking-tight">ElitaleRestro</h1>
        <p className="max-w-sm text-muted-foreground">
          Dining in? Order from your table — no account needed. Floor staff,
          sign in with your PIN.
        </p>
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href={GUEST_ORDER_PATH}
          className="flex h-12 w-full items-center justify-center rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          Order as Guest
        </Link>
        <Link
          href={STAFF_DEMO_LOGIN_PATH}
          className="flex h-12 w-full items-center justify-center rounded-md border border-input bg-background px-5 text-base font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Staff Login
        </Link>
        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-md border border-input bg-background px-5 text-base font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Manager Sign In
        </Link>
      </div>
    </div>
  );
}
