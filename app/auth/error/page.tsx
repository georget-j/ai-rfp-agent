export default function AuthErrorPage() {
  return (
    <div className="max-w-md mx-auto mt-20 text-center">
      <p className="text-sm font-medium text-gray-900 mb-2">Sign-in link expired or invalid</p>
      <p className="text-xs text-gray-500">
        Magic links expire after 1 hour. Ask an admin to resend your review request.
      </p>
    </div>
  )
}
