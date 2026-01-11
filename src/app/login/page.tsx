import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-slate-800 to-black p-4">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
            <div className="relative z-10 w-full max-w-md">
                <div className="mb-8 text-center text-white">
                    <h1 className="text-3xl font-bold tracking-tight">Maintenance System</h1>
                    <p className="text-blue-200 mt-2">Building Management & Reporting</p>
                </div>
                <LoginForm />
            </div>
        </div>
    );
}
