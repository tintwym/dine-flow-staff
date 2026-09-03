"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStaffAuth } from "@/lib/staff-auth";
import StaffLoginForm from "@/components/staff/StaffLoginForm";

export default function OfficeLoginPage() {
  const router = useRouter();
  const { loading, profile } = useStaffAuth();

  useEffect(() => {
    if (!loading && profile) {
      router.replace("/");
    }
  }, [loading, profile, router]);

  if (loading) {
    return (
      <div className="staff-login">
        <p>Loading…</p>
      </div>
    );
  }

  return <StaffLoginForm />;
}
