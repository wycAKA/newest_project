'use client'

import React, { useState } from 'react';
import Header from './Header';
import Drawer from './Drawer';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const toggleDrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header toggleDrawer={toggleDrawer} />
            <Drawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
            <main className="flex-grow flex items-center justify-center bg-gray-100">
                {children}
            </main>
        </div>
    );
};

export default Layout;
