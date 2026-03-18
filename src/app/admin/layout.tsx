import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
    title: 'JawraAI Admin',
};

export default function AdminLayout({ children }: { children: React.ReactNode; }) {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {children}
            <Toaster />
        </div>
    );
}
