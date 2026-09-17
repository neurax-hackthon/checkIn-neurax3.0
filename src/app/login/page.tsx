import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between p-12 border-r border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-dim to-gold" />
          <span className="font-semibold tracking-wide">NeuraX Entry</span>
        </div>
        <div>
          <h1 className="text-5xl font-bold leading-tight bg-gradient-to-br from-gold-dim via-gold-bright to-gold bg-clip-text text-transparent">
            NeuraX 3.0
          </h1>
          <p className="mt-4 max-w-md text-muted">
            24-hour hackathon at CMR Technical Campus, 19–20 September 2026.
            Registration verification &amp; on-site entry management.
          </p>
        </div>
        <p className="text-xs text-muted">
          Internal operational system for NeuraX 3.0 organizers and
          participants.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center px-5 py-10 sm:p-8 lg:p-12">
        <div className="lg:hidden mb-8 flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-gold-dim to-gold" />
          <span className="font-semibold tracking-wide">NeuraX Entry</span>
        </div>
        <LoginForm />
        <p className="lg:hidden mt-8 max-w-md text-center text-xs text-muted">
          24-hour hackathon at CMR Technical Campus, 19–20 September 2026.
        </p>
      </div>
    </div>
  );
}
