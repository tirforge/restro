-- Add CASHIER staff role + Staff.extraRoles for dual-job (understaffed) shifts.
ALTER TYPE "StaffRole" ADD VALUE IF NOT EXISTS 'CASHIER';
ALTER TABLE "Staff" ADD COLUMN "extraRoles" "StaffRole"[] NOT NULL DEFAULT '{}';
