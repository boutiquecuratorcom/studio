import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
            <h1 className="text-4xl lg:text-5xl font-headline font-bold text-foreground tracking-normal">Profile</h1>
            <p className="text-lg text-muted-foreground mt-3 max-w-2xl">View and edit your user profile.</p>
        </header>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Your user profile management page will be available here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
