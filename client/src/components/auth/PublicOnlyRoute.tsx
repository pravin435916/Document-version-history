import { Navigate, Outlet } from "react-router-dom"

import { isAuthenticated } from "../../auth/token"

export function PublicOnlyRoute() {
  if (isAuthenticated()) {
    return <Navigate to="/workspace" replace />
  }

  return <Outlet />
}
