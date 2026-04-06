import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

import { authApi } from "../api"
import { setAccessToken } from "../auth/token"
import { getApiErrorMessage } from "../utils/document"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const nextPath = (location.state as { from?: string } | undefined)?.from || "/workspace"

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setLoading(true)
      const response = await authApi.login({ username, password })
      setAccessToken(response.access_token)
      toast.success("Logged in")
      navigate(nextPath, { replace: true })
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-xl border border-slate-300 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
        <p className="mt-2 text-sm text-slate-600">Access your documents with your account.</p>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Username</label>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              value={password}
              type="password"
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
              placeholder="Enter password"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-70"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="mt-4 text-sm text-slate-600">
          New user?{" "}
          <Link to="/register" className="font-medium text-slate-900 underline">
            Create account
          </Link>
        </p>
      </form>
    </div>
  )
}
