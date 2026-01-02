'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
    { name: 'Dashboard', href: '/', icon: '📊' },
    { name: 'Activity', href: '/activity', icon: '⚡' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="fixed left-0 top-0 h-screen w-64 border-r border-gray-200 bg-white">
            {/* Logo/Brand */}
            <div className="border-b border-gray-200 p-8">
                <h1 className="text-3xl font-bold tracking-tight">Centri</h1>
                <p className="text-sm text-gray-500 mt-1">Work Clarity</p>
            </div>

            {/* Navigation */}
            <nav className="p-4">
                <ul className="space-y-2">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive
                                            ? 'bg-black text-white'
                                            : 'text-gray-700 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <span className="text-xl">{item.icon}</span>
                                    <span className="font-semibold">{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Footer Info */}
            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 p-4">
                <div className="text-xs text-gray-500">
                    <p className="font-semibold mb-1">Privacy First</p>
                    <p>No surveillance. Just clarity.</p>
                </div>
            </div>
        </div>
    );
}
