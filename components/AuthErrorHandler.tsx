"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthErrorHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    if (errorCode === "otp_expired") {
      router.replace("/forgot-password?expired=1");
    }
  }, [searchParams, router]);

  return null;
}
