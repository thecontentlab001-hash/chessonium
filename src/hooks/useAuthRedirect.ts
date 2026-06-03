"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const username = localStorage.getItem("username");
      if (!username) {
        router.push("/auth/signin");
      }
    }
  }, [router]);
}
