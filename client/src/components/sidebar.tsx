
import Link from 'next/link';

const links = [
  { href: '/admin/arcs', label: 'Arcs' },
  { href: '/admin/chapters', label: 'Chapters' },
  { href: '/admin/characters', label: 'Characters' },
  { href: '/admin/events', label: 'Events' },
  { href: '/admin/factions', label: 'Factions' },
  { href: '/admin/gambles', label: 'Gambles' },
  { href: '/admin/guides', label: 'Guides' },
  { href: '/admin/media', label: 'Media' },
  { href: '/admin/quotes', label: 'Quotes' },
  { href: '/admin/series', label: 'Series' },
  { href: '/admin/tags', label: 'Tags' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/volumes', label: 'Volumes' },
];

export default function Sidebar() {
  return (
    <aside className="bg-gray-700 text-white w-64 p-4">
      <nav>
        <ul>
          {links.map(link => (
            <li key={link.href}>
              <Link href={link.href} className="block py-2 px-4 rounded hover:bg-gray-600">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
