"use client"

import { usePathname } from "next/navigation"

export function PathAwareLayout() {
  const pathname = usePathname()

  return (
    <div>
      <p>You&apos;re on: {pathname}</p>
    </div>
  )
}