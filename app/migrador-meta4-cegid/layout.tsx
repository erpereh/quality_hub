import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Migrador Meta4 a Cegid',
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
