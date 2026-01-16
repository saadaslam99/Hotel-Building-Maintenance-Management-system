'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
    User,
    Lock,
    Bell,
    Settings,
    Shield,
    Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user } = useAuthStore();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Mock Preferences State
    const [preferences, setPreferences] = useState({
        theme: 'system',
        language: 'en',
        timezone: 'utc+5',
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false,
    });

    // Sync theme preference on mount - only once to avoid render loop
    useEffect(() => {
        if (theme && theme !== preferences.theme) {
            setPreferences(prev => ({ ...prev, theme }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [theme]);

    const handleSavePreferences = () => {
        setIsLoading(true);
        // Apply theme change
        if (preferences.theme) {
            setTheme(preferences.theme);
        }

        // Mock API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Preferences saved successfully');
        }, 1000);
    };

    if (!user) return null;

    return (
        <div className="container max-w-6xl py-6 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">
                    Manage your profile, preferences, and view account details.
                </p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Sidebar Navigation */}
                <aside className="lg:w-64 flex-shrink-0">
                    <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
                        <Button
                            variant={activeTab === 'profile' ? 'secondary' : 'ghost'}
                            className="justify-start gap-2 w-full"
                            onClick={() => setActiveTab('profile')}
                        >
                            <User className="h-4 w-4" />
                            Profile
                        </Button>
                        <Button
                            variant={activeTab === 'preferences' ? 'secondary' : 'ghost'}
                            className="justify-start gap-2 w-full"
                            onClick={() => setActiveTab('preferences')}
                        >
                            <Settings className="h-4 w-4" />
                            Preferences
                        </Button>
                        <Button
                            variant={activeTab === 'notifications' ? 'secondary' : 'ghost'}
                            className="justify-start gap-2 w-full"
                            onClick={() => setActiveTab('notifications')}
                        >
                            <Bell className="h-4 w-4" />
                            Notifications
                        </Button>
                        <Button
                            variant={activeTab === 'system' ? 'secondary' : 'ghost'}
                            className="justify-start gap-2 w-full"
                            onClick={() => setActiveTab('system')}
                        >
                            <Shield className="h-4 w-4" />
                            System Info
                        </Button>
                    </nav>
                </aside>

                {/* Right Content Area */}
                <div className="flex-1 space-y-6">
                    {/* Profile Section */}
                    {activeTab === 'profile' && (
                        <div className="animation-fade-in space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Profile Overview</CardTitle>
                                    <CardDescription>
                                        Your personal information. Managed by your organization administrator.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="flex items-center gap-6 p-6">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src="" />
                                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                                {user.full_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <h3 className="font-semibold text-lg">{user.full_name}</h3>
                                            <Badge variant="outline" className="uppercase text-xs tracking-wide">
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Separator className="my-0" />

                                    <div className="grid gap-6 md:grid-cols-2 p-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="full-name">Full Name</Label>
                                            <div className="relative">
                                                <Input id="full-name" value={user.full_name} disabled className="bg-muted text-muted-foreground pr-10" />
                                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="employee-id">Employee ID (Username)</Label>
                                            <div className="relative">
                                                <Input id="employee-id" value={user.employee_id} disabled className="bg-muted text-muted-foreground pr-10" />
                                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <div className="relative">
                                                <Input id="phone" value={user.phone || 'N/A'} disabled className="bg-muted text-muted-foreground pr-10" />
                                                <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground/50" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account-status">Account Status</Label>
                                            <Input
                                                id="account-status"
                                                value={user.active ? 'Active' : 'Inactive'}
                                                disabled
                                                className={`font-medium ${user.active ? 'text-green-600' : 'text-red-500'} bg-muted`}
                                            />
                                        </div>
                                    </div>
                                    <Separator className="my-0" />

                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-b-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300 border-t border-blue-200 dark:border-blue-800">
                                        <Shield className="h-5 w-5 flex-shrink-0" />
                                        <p>
                                            To update your personal details or password, please contact the IT department or your system administrator.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Preferences Section */}
                    {activeTab === 'preferences' && (
                        <div className="animation-fade-in space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Preferences</CardTitle>
                                    <CardDescription>
                                        Customize your interface experience.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Theme</Label>
                                            <Select
                                                value={preferences.theme}
                                                onValueChange={(val) => setPreferences({ ...preferences, theme: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select theme" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="light">Light</SelectItem>
                                                    <SelectItem value="dark">Dark</SelectItem>
                                                    <SelectItem value="system">System</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Language</Label>
                                            <Select
                                                value={preferences.language}
                                                onValueChange={(val) => setPreferences({ ...preferences, language: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select language" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="en">English (US)</SelectItem>
                                                    <SelectItem value="es">Español</SelectItem>
                                                    <SelectItem value="fr">Français</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Timezone</Label>
                                            <Select
                                                value={preferences.timezone}
                                                onValueChange={(val) => setPreferences({ ...preferences, timezone: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select timezone" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="utc">UTC (Coordinated Universal Time)</SelectItem>
                                                    <SelectItem value="utc+5">UTC+05:00 (Islamabad, Karachi)</SelectItem>
                                                    <SelectItem value="pst">PST (Pacific Standard Time)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button onClick={handleSavePreferences} disabled={isLoading}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Notifications Section */}
                    {activeTab === 'notifications' && (
                        <div className="animation-fade-in space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notifications</CardTitle>
                                    <CardDescription>
                                        Manage how you receive updates and alerts.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-1">
                                            <Label className="text-base">Email Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive daily summaries and important alerts via email.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.emailNotifications}
                                            onCheckedChange={(c) => setPreferences({ ...preferences, emailNotifications: c })}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-1">
                                            <Label className="text-base">Push Notifications</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive real-time alerts on your device.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.pushNotifications}
                                            onCheckedChange={(c) => setPreferences({ ...preferences, pushNotifications: c })}
                                        />
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between space-x-2">
                                        <div className="space-y-1">
                                            <Label className="text-base">Marketing Updates</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Receive news about new features and updates.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.marketingEmails}
                                            onCheckedChange={(c) => setPreferences({ ...preferences, marketingEmails: c })}
                                        />
                                    </div>
                                    <div className="flex justify-end pt-4">
                                        <Button onClick={handleSavePreferences} disabled={isLoading}>
                                            <Save className="mr-2 h-4 w-4" />
                                            {isLoading ? 'Saving...' : 'Save Preferences'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* System Info Section */}
                    {activeTab === 'system' && (
                        <div className="animation-fade-in space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Information</CardTitle>
                                    <CardDescription>
                                        Technical details about your account and session.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">User ID</p>
                                            <p className="font-mono text-sm">{user.id}</p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Account Created</p>
                                            <p className="font-medium text-sm">
                                                {new Date(user.created_at).toLocaleDateString(undefined, {
                                                    dateStyle: 'long',
                                                })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Last Updated</p>
                                            <p className="font-medium text-sm">
                                                {new Date(user.updated_at).toLocaleDateString(undefined, {
                                                    dateStyle: 'long',
                                                })}
                                            </p>
                                        </div>
                                        <div className="p-4 rounded-lg bg-muted/50 border space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground uppercase">Version</p>
                                            <p className="font-medium text-sm">v1.0.0 (Internal Release)</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
