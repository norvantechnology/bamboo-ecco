"use client";

import { useEffect, useState } from "react";
import { getCustomerUser } from "@/lib/auth";
import { AccountShell } from "@/components/account/account-shell";
import { TrackOrderForm } from "@/components/account/track-order-form";

export default function AccountTrackPage() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    setEmail(getCustomerUser()?.email ?? "");
  }, []);

  return (
    <AccountShell
      title="Track your order"
      subtitle="Enter your order ID and the email used at checkout."
    >
      <TrackOrderForm defaultEmail={email} />
    </AccountShell>
  );
}
