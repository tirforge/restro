"use client";

import { useState } from "react";

import { toast } from "sonner";

import { setUpiIdAction } from "@/actions/settings.actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useServerAction } from "@/hooks/use-server-action";

export function UpiIdCard({ initialUpiId }: { readonly initialUpiId: string }) {
  const [upiId, setUpiId] = useState(initialUpiId);
  const dirty = upiId.trim() !== initialUpiId;

  const save = useServerAction(setUpiIdAction, {
    refresh: true,
    onSuccess: () => toast.success("UPI ID updated"),
    onError: (message) => toast.error(message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>UPI collection</CardTitle>
        <CardDescription>
          The cashier&apos;s QR collects into this UPI ID. The guest pays the
          exact bill amount; the cashier marks the bill paid after checking
          their own UPI app.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Input
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="shop@okhdfc"
            inputMode="email"
            className="h-11"
          />
          <Button
            className="h-11 shrink-0"
            disabled={!dirty || save.isPending}
            onClick={() => save.execute({ upiId: upiId.trim() })}
          >
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        <FieldDescription>
          Leave empty to turn UPI off at the cashier — cash-only mode.
        </FieldDescription>
      </CardContent>
    </Card>
  );
}
