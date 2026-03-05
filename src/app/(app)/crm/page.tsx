import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CrmPage() {
  return (
    <div className="flex-1 p-8 sm:p-10 lg:p-12">
        <header className="mb-12">
            <h1 className="text-5xl lg:text-6xl font-headline font-bold text-foreground tracking-tight">CRM</h1>
            <p className="text-xl text-muted-foreground mt-4 max-w-2xl">Customer relationship management dashboard.</p>
        </header>
        <Card>
            <CardHeader>
                <CardTitle>Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
                <p>A customer relationship management dashboard will be available here.</p>
            </CardContent>
        </Card>
    </div>
  );
}
