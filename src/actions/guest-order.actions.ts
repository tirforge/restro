"use server";

import { withValidation } from "@/actions/helpers";
import {
  createGuestSession,
  destroyGuestSession,
  getGuestSession,
} from "@/lib/guest-session";
import { isGuestOtpSkipped } from "@/lib/guest-verification";
import {
  guestPlaceOrderSchema,
  guestRequestOtpSchema,
  guestVerifyOtpSchema,
} from "@/lib/validators/guest-order";
import {
  getGuestOrders,
  listGuestTables,
  placeGuestOrder,
  resolveGuestOrderTarget,
} from "@/services/guest-order.service";
import { requestGuestOtp, verifyGuestOtp } from "@/services/guest-otp.service";
import { failure, success, type ActionResult } from "@/types";
import type { GuestOrderSummaryDTO, OrderDTO } from "@/types/order";

const GUEST_NOT_VERIFIED = "GUEST_NOT_VERIFIED";

/** Send a verification code to the guest, after checking the table is valid. */
export const guestRequestOtpAction = withValidation(
  guestRequestOtpSchema,
  async (data): Promise<void> => {
    await resolveGuestOrderTarget(data.username, data.tableId);
    await requestGuestOtp(data.phone);
  },
);

/** Verify the code and open a table-scoped guest session (once per seating). */
export const guestVerifyOtpAction = withValidation(
  guestVerifyOtpSchema,
  async (data): Promise<void> => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    await verifyGuestOtp(data.phone, data.code);
    await createGuestSession({
      restaurantId: target.restaurantId,
      tableId: target.tableId,
      phone: data.phone,
    });
  },
);

/** Place the order — requires a verified guest session bound to this table,
 * unless OTP is disabled via GUEST_OTP_DISABLED (walk-in mode). */
export const guestPlaceOrderAction = withValidation(
  guestPlaceOrderSchema,
  async (data): Promise<OrderDTO> => {
    const target = await resolveGuestOrderTarget(data.username, data.tableId);
    if (isGuestOtpSkipped()) {
      return placeGuestOrder(
        {
          restaurantId: target.restaurantId,
          tableId: target.tableId,
          phone: null,
        },
        data,
      );
    }
    const session = await getGuestSession();
    if (
      !session ||
      session.restaurantId !== target.restaurantId ||
      session.tableId !== target.tableId
    ) {
      throw new Error(GUEST_NOT_VERIFIED);
    }
    return placeGuestOrder(
      {
        restaurantId: target.restaurantId,
        tableId: target.tableId,
        phone: session.phone,
      },
      data,
    );
  },
);

/** The verified guest's own orders (by phone + current table) with live status.
 * In walk-in mode (OTP disabled) there is no phone to scope by — tracking
 * is unavailable, so this returns an empty list. */
export const guestMyOrdersAction = async (): Promise<
  ActionResult<GuestOrderSummaryDTO[]>
> => {
  if (isGuestOtpSkipped()) {
    return success([]);
  }
  const session = await getGuestSession();
  if (!session) {
    return failure<GuestOrderSummaryDTO[]>(GUEST_NOT_VERIFIED);
  }
  try {
    return success(
      await getGuestOrders(
        session.restaurantId,
        session.phone,
        session.tableId,
      ),
    );
  } catch (error) {
    return failure<GuestOrderSummaryDTO[]>(
      error instanceof Error ? error.message : "Something went wrong",
    );
  }
};

/** Log the guest out by clearing their session cookie. */
export const guestLogoutAction = async (): Promise<void> => {
  await destroyGuestSession();
};

/** Public table list for the guest table picker (no login required). */
export const guestTablesAction = async (
  username: string,
): Promise<ActionResult<readonly { id: string; label: string; seats: number | null }[]>> => {
  try {
    return success([...(await listGuestTables(username))]);
  } catch (error) {
    return failure(error instanceof Error ? error.message : "Something went wrong");
  }
};
