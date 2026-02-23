import Link from "next/link";

export default function NavBar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-wide text-white">
          ECB Lightforce
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/ecb-hub" className="text-white/80 hover:text-white">
            ECB Hub
          </Link>
          <Link href="/register" className="text-white/80 hover:text-white">
            Join
          </Link>
          <Link href="/login" className="rounded-full bg-pitch-400 px-4 py-1.5 font-medium text-black">
            Login
          </Link>
        </div>
      </nav>
    </header>
  );
}
