
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link href="/" className="text-xl font-bold">
        Usogui Fansite
      </Link>
      <nav>
        <Link href="/admin" className="mr-4">
          Admin
        </Link>
        <Link href="/login">
          Login
        </Link>
      </nav>
    </header>
  );
}
