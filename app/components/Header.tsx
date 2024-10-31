'use client'

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu } from 'lucide-react';

interface HeaderProps {
    toggleDrawer: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleDrawer }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16"> {/* 高さを固定 */}
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/images/logo.svg"
                            alt="YOLO JAPAN Logo"
                            width={180}
                            height={40}
                            priority
                            className="h-auto w-40 md:w-48"
                        />
                    </Link>
                    <div className="flex items-center">
                        <button
                            onClick={toggleDrawer}
                            className="ml-4 p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
