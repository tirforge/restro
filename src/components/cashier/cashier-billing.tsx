"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

import {
  staffOpenBillsAction,
  staffSettleAction,
} from "@/actions/staff-billing.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orderRunningTotal } from "@/components/pos/types";
import { useServerAction } from "@/hooks/use-server-action";
import { buildUpiUri } from "@/lib/upi";
import type { OrderDTO } from "@/types/order";
import type { StaffRole } from "@/types/staff";

const ERRORS: Record<string, string> = {
  PAYMENT_SHORT: "Tendered amount is less than the bill total.",
  STAFF_FORBIDDEN: "Only waiter/manager staff can settle bills.",
  NO_STAFF_SESSION: "Session expired — sign in again.",
  ORDER_NOT_OPEN: "This bill is no longer open.",
};

const orderLabel = (o: OrderDTO): string => {
  const who = o.customerName ? ` · ${o.customerName}` : "";
  if (o.tableLabel) return `Table ${o.tableLabel}${who}`;
  if (o.orderType === "DELIVERY")
    return `Delivery · ${o.customerName ?? "guest"}`;
  return `Takeaway · ${o.customerName ?? "guest"}`;
};

function UpiCollect({
  upiId,
  restaurantName,
  orderNumber,
  amount,
}: {
  readonly upiId: string;
  readonly restaurantName: string;
  readonly orderNumber: number;
  readonly amount: number;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const fileSlug = `bill-${orderNumber}-${amount.toFixed(0)}`;
  const uri = useMemo(() => {
    try {
      return buildUpiUri({
        vpa: upiId,
        name: restaurantName,
        amount,
        note: `Bill #${orderNumber}`,
        ref: `ORD-${orderNumber}`,
      });
    } catch {
      return null;
    }
  }, [upiId, restaurantName, amount, orderNumber]);

  useEffect(() => {
    if (!uri) return;
    QRCode.toDataURL(uri, { width: 512, margin: 2 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [uri]);

  if (!uri) {
    return (
      <p className="text-destructive text-sm">
        Invalid UPI ID — ask the manager to check restaurant settings.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="UPI payment QR" className="size-48 rounded-xl border" />
      ) : (
        <p className="text-muted-foreground text-sm">Generating QR…</p>
      )}
      <p className="text-center text-sm font-semibold tabular-nums">
        ₹{amount.toFixed(2)} → {upiId}
      </p>
      <a
        href={uri}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#4285F4] px-5 text-base font-semibold text-white shadow transition-colors hover:bg-[#3367D6]"
      >
        <span className="text-xl font-bold">G</span> Pay with GPay
      </a>
      {qr ? (
        <a
          href={qr}
          download={`${fileSlug}.png`}
          className="text-sm font-medium underline"
        >
          Download QR
        </a>
      ) : null}
      <p className="text-muted-foreground text-center text-xs">
        On mobile this opens Google Pay with the amount filled in. On desktop,
        scan the QR with any UPI app. Confirm below once paid.
      </p>
    </div>
  );
}

export function CashierBilling({
  username,
  restaurantName,
  upiId,
  staffName,
  staffRole,
  initialOrders,
}: {
  readonly username: string;
  readonly restaurantName: string;
  readonly upiId: string | null;
  readonly staffName: string;
  readonly staffRole: StaffRole;
  readonly initialOrders: readonly OrderDTO[];
}) {
  const [orders, setOrders] = useState<readonly OrderDTO[]>(initialOrders);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"CASH" | "UPI">("CASH");
  const [tendered, setTendered] = useState("");
  const [upiRef, setUpiRef] = useState("");

  const selected = orders.find((o) => o.id === selectedId) ?? null;
  const total = selected ? orderRunningTotal(selected) : 0;
  const tenderedNum = Number(tendered);
  const change =
    mode === "CASH" && Number.isFinite(tenderedNum) ? tenderedNum - total : 0;
  const canSettle = staffRole === "WAITER" || staffRole === "MANAGEMENT";

  const refresh = useServerAction(staffOpenBillsAction, {
    onSuccess: (data) => {
      setOrders(data ?? []);
      if (selectedId && !(data ?? []).some((o) => o.id === selectedId)) {
        setSelectedId(null);
      }
    },
  });

  const settle = useServerAction(staffSettleAction, {
    onSuccess: () => {
      toast.success("Bill settled — cleared ✓");
      setTendered("");
      setUpiRef("");
      setSelectedId(null);
      void refresh.execute({});
    },
    onError: (m) => toast.error(ERRORS[m] ?? m),
  });

  const confirm = () => {
    if (!selected || !canSettle || settle.isPending) return;
    if (mode === "CASH") {
      if (!Number.isFinite(tenderedNum) || tenderedNum + 0.5 < total) {
        toast.error("Enter tendered cash covering the bill total.");
        return;
      }
      settle.execute({
        orderId: selected.id,
        payments: [{ mode: "CASH", amount: total, tendered: tenderedNum }],
      });
    } else {
      settle.execute({
        orderId: selected.id,
        payments: [
          {
            mode: "UPI",
            amount: total,
            reference: upiRef.trim() || `ORD-${selected.orderNumber}`,
          },
        ],
      });
    }
  };

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-4 p-4 pb-10">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Cashier</h1>
          <p className="text-muted-foreground text-sm">
            {restaurantName} · {staffName}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refresh.execute({})}>
          Refresh
        </Button>
      </div>

      {!canSettle ? (
        <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
          Kitchen staff can view bills here — settling needs a waiter or
          manager sign-in.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-muted-foreground text-sm font-medium">
            Open bills ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              All cleared — no open bills 🎉
            </p>
          ) : (
            orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setSelectedId(o.id);
                  setTendered("");
                  setUpiRef("");
                  setMode("CASH");
                }}
                className={`flex items-center justify-between gap-2 rounded-xl border p-3 text-left transition-colors hover:bg-accent ${
                  o.id === selectedId ? "border-primary bg-accent" : ""
                }`}
              >
                <span>
                  <span className="block font-semibold">
                    #{o.orderNumber} · {orderLabel(o)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {o.orderType} · {o.lines.filter((l) => l.state !== "VOID").length} lines
                  </span>
                </span>
                <span className="font-bold tabular-nums">
                  ₹{orderRunningTotal(o).toFixed(0)}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border p-4">
          {!selected ? (
            <p className="text-muted-foreground py-10 text-center text-sm">
              Select a bill to collect payment.
            </p>
          ) : (
            <>
              <div className="flex items-baseline justify-between">
                <h2 className="font-bold">
                  #{selected.orderNumber} · {orderLabel(selected)}
                </h2>
                <span className="text-xl font-bold tabular-nums">
                  ₹{total.toFixed(2)}
                </span>
              </div>
              <ul className="divide-y text-sm">
                {selected.lines
                  .filter((l) => l.state !== "VOID")
                  .map((l) => (
                    <li key={l.id} className="flex justify-between py-1.5">
                      <span>
                        {l.quantity}× {l.name}
                      </span>
                      <span className="tabular-nums">
                        ₹{(l.unitPrice * l.quantity).toFixed(0)}
                      </span>
                    </li>
                  ))}
              </ul>
              <div className="grid grid-cols-2 gap-2">
                {(["CASH", "UPI"] as const).map((m) => (
                  <Button
                    key={m}
                    type="button"
                    variant={mode === m ? "default" : "outline"}
                    onClick={() => setMode(m)}
                  >
                    {m === "CASH" ? "💵 Cash" : "📱 UPI / GPay"}
                  </Button>
                ))}
              </div>
              {mode === "CASH" ? (
                <div className="flex flex-col gap-2">
                  <Input
                    value={tendered}
                    onChange={(e) =>
                      setTendered(e.target.value.replace(/[^\d.]/g, ""))
                    }
                    placeholder={`Cash received (₹${total.toFixed(0)})`}
                    inputMode="decimal"
                    className="h-12 text-lg"
                  />
                  <p className="text-sm tabular-nums text-muted-foreground">
                    Change due: ₹{Math.max(0, change).toFixed(2)}
                  </p>
                </div>
              ) : upiId ? (
                <div className="flex flex-col gap-2">
                  <UpiCollect
                    upiId={upiId}
                    restaurantName={restaurantName}
                    orderNumber={selected.orderNumber}
                    amount={total}
                  />
                  <Input
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value.slice(0, 60))}
                    placeholder="UPI ref / UTR (optional)"
                    className="h-11"
                  />
                </div>
              ) : (
                <p className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
                  No UPI ID set for this restaurant — ask the manager to add
                  one in settings to accept QR payments.
                </p>
              )}
              <Button
                className="h-12 text-base"
                disabled={
                  !canSettle ||
                  settle.isPending ||
                  (mode === "UPI" && !upiId)
                }
                onClick={confirm}
              >
                {settle.isPending
                  ? "Settling…"
                  : `Confirm ${mode === "CASH" ? "cash" : "UPI"} payment · ₹${total.toFixed(0)}`}
              </Button>
              <a
                className="text-center text-xs text-muted-foreground underline"
                href={`/u/${username}`}
              >
                Back to staff home
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
