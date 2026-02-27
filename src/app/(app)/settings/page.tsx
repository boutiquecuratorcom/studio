import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-16">
            <h1 className="text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl">Manage your account and preferences.</p>
        </header>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Account settings and application preferences will be available here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
