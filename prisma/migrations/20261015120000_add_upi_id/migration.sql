-- Add Restaurant.upiId for dynamic UPI QR / GPay collections at billing.
ALTER TABLE "Restaurant" ADD COLUMN "upiId" TEXT;
