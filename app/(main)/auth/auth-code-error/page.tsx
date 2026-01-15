export default function AuthCodeError() {
  return (
    <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl">
          ⚠️
        </div>
        <h1 className="text-3xl font-extrabold text-foreground">Authentication Error</h1>
        <p className="text-muted">
          There was an issue verifying your login link. It may have expired or already been used.
        </p>
        <div className="pt-6">
          <a 
            href="/login" 
            className="rounded-full bg-primary px-8 py-3 font-bold text-white shadow-lg shadow-primary/25 transition hover:scale-105"
          >
            Try Again
          </a>
        </div>
      </div>
    </main>
  )
}
