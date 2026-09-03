"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStaffAuth } from "@/lib/staff-auth";
import StaffShell from "@/components/staff/StaffShell";

export default function OfficeHomePage() {
  const router = useRouter();
  const { loading, profile } = useStaffAuth();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace("/login");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="staff-login">
        <p>Loading office session…</p>
      </div>
    );
  }

  if (!profile) return null;

  return <StaffShell />;
}
