"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { guestTablesAction } from "@/actions/guest-order.actions";
import { Button } from "@/components/ui/button";
import { useServerAction } from "@/hooks/use-server-action";

interface TableOption {
  readonly id: string;
  readonly label: string;
  readonly seats: number | null;
}

/**
 * Lets a guest pick their table when they arrive without a table QR link
 * (or the link is invalid). Navigates to the table-specific order URL.
 */
export function GuestTablePicker({
  username,
  restaurantName,
  currentTableId,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly currentTableId?: string;
}) {
  const router = useRouter();
  const [tables, setTables] = useState<readonly TableOption[]>([]);
  const [failed, setFailed] = useState(false);

  const load = useServerAction(guestTablesAction, {
    onSuccess: (data) => setTables(data ?? []),
    onError: () => setFailed(true),
  });

  useEffect(() => {
    load.execute(username);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl text-2xl">
        🪑
      </div>
      <div>
        <h1 className="text-lg font-semibold">{restaurantName}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {currentTableId
            ? "Switch to your table to continue ordering."
            : "Which table are you sitting at?"}
        </p>
      </div>
      {load.isPending ? (
        <p className="text-muted-foreground text-sm">Loading tables…</p>
      ) : failed || tables.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          We couldn&apos;t load the tables. Please scan the QR code on your
          table, or ask a server.
        </p>
      ) : (
        <div className="grid w-full grid-cols-2 gap-2">
          {tables.map((t) => (
            <Button
              key={t.id}
              variant={t.id === currentTableId ? "default" : "outline"}
              className="h-14 flex-col gap-0.5 text-base"
              disabled={t.id === currentTableId}
              onClick={() => router.push(`/order/${username}?table=${t.id}`)}
            >
              <span className="font-bold">{t.label}</span>
              {t.seats ? (
                <span className="text-xs font-normal opacity-70">
                  {t.seats} seats
                </span>
              ) : null}
            </Button>
          ))}
        </div>
      )}
    </main>
  );
}
