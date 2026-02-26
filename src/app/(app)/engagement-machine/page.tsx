'use client';

import { generateEngagementIdeas, type EngagementIdea } from '@/ai/flows/generate-engagement-ideas-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { AlertTriangle, Copy, Cpu, Lightbulb, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';

type Intensity = 'Safe' | 'Bold' | 'Viral';
type Goal = 'Engagement' | 'Sales' | 'Both';
type Platform = 'Facebook' | 'Instagram' | 'Both';

interface EngagementDropDoc {
  createdAt: any;
  intensity: Intensity;
  goal: Goal;
  platform: Platform;
  ideas: EngagementIdea[];
}

const IdeaCard = ({ idea, onCreatePost }: { idea: EngagementIdea; onCreatePost: (idea: EngagementIdea) => void; }) => {
    const { toast } = useToast();

    const handleCopy = () => {
        navigator.clipboard.writeText(idea.caption);
        toast({ title: 'Caption Copied!' });
    };
    
    return (
        <Card className="flex flex-col h-full shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
                <CardTitle className="text-xl leading-tight">{idea.title}</CardTitle>
                <CardDescription>{idea.recommendedFormat}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <p className="text-sm text-foreground/80 whitespace-pre-wrap font-body">{idea.caption}</p>
                <div className="border-t pt-3">
                    <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-accent" />
                        Why it Works
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{idea.whyItWorks}</p>
                </div>
            </CardContent>
            <CardFooter className="flex gap-2 bg-muted/50 p-3">
                <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1">
                    <Copy className="mr-2 h-4 w-4" /> Copy Caption
                </Button>
                <Button size="sm" onClick={() => onCreatePost(idea)} className="flex-1">
                    <Send className="mr-2 h-4 w-4" /> Create Post
                </Button>
            </CardFooter>
        </Card>
    );
};

const EngagementMachineClient = () => {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const router = useRouter();

    // --- State for controls ---
    const [intensity, setIntensity] = useState<Intensity>('Bold');
    const [goal, setGoal] = useState<Goal>('Both');
    const [platform, setPlatform] = useState<Platform>('Facebook');
    
    // --- State for data & UI ---
    const [ideas, setIdeas] = useState<EngagementIdea[] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Memoized values for data fetching ---
    const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const brandProfileRef = useMemo(() => {
        if (!user || !firestore) return null;
        return doc(firestore, `users/${user.uid}/brandProfile/main`);
    }, [user, firestore]);
    const { data: brandProfile } = useDoc(brandProfileRef);

    // --- Core data fetching and generation logic ---
    const getIdeas = useCallback(async () => {
        if (!user || !firestore) return;
        
        setIsLoading(true);
        setError(null);

        const dropRef = doc(firestore, `users/${user.uid}/engagementDrops/${today}`);

        try {
            const docSnap = await getDoc(dropRef);
            if (docSnap.exists()) {
                const data = docSnap.data() as EngagementDropDoc;
                // Check if cached settings match current controls
                if (data.intensity === intensity && data.goal === goal && data.platform === platform) {
                    setIdeas(data.ideas);
                    setIsLoading(false);
                    toast({ title: "Today's ideas loaded from cache ✨" });
                    return;
                }
            }

            // If no cache or settings mismatch, generate new ideas
            toast({ title: 'Generating fresh ideas... 🤖' });
            
            const result = await generateEngagementIdeas({
                intensity,
                goal,
                platform,
                brandProfile: brandProfile || {},
            });

            if (result.ideas) {
                const newDrop: EngagementDropDoc = {
                    createdAt: serverTimestamp(),
                    intensity,
                    goal,
                    platform,
                    ideas: result.ideas,
                };
                await setDoc(dropRef, newDrop);
                setIdeas(result.ideas);
            } else {
                throw new Error("AI did not return any ideas.");
            }
        } catch (e: any) {
            console.error("Failed to get or generate engagement ideas:", e);
            setError(e.message || 'An unknown error occurred.');
            toast({ variant: 'destructive', title: 'Generation Failed', description: e.message });
        } finally {
            setIsLoading(false);
        }
    }, [user, firestore, today, intensity, goal, platform, brandProfile, toast]);

    // --- Effect to trigger generation when controls change ---
    useEffect(() => {
        // Only run if user is loaded. brandProfile is optional.
        if(user) {
            getIdeas();
        }
    }, [user, intensity, goal, platform, getIdeas]);
    
    const handleCreatePost = (idea: EngagementIdea) => {
        const prefillData = {
            headline: idea.title,
            cta: idea.ctaSuggestion,
            fullCaption: idea.caption
        };
        localStorage.setItem('postCreatorPrefill', JSON.stringify(prefillData));
        router.push('/post-creator');
    };

    // --- Render logic ---
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Card key={i}>
                            <CardHeader>
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <Skeleton className="h-20 w-full" />
                            </CardContent>
                            <CardFooter>
                                <Skeleton className="h-10 w-full" />
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            );
        }

        if (error) {
            return (
                 <div className="text-center py-16 border-2 border-dashed rounded-xl bg-card text-destructive flex flex-col items-center gap-4 mt-8">
                    <AlertTriangle className="h-10 w-10" />
                    <div>
                        <p className="font-semibold">Error generating ideas.</p>
                        <p className="text-sm">{error}</p>
                    </div>
                     <Button onClick={() => getIdeas()}>Try Again</Button>
                </div>
            );
        }

        if (ideas) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mt-8">
                    {ideas.map((idea, i) => (
                        <IdeaCard key={i} idea={idea} onCreatePost={handleCreatePost} />
                    ))}
                </div>
            );
        }

        return null;
    };


    return (
        <div className="flex-1 p-8 sm:p-10 lg:p-12">
            <header className="mb-10">
                <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">
                    Today&apos;s Engagement Drop
                </h1>
                <p className="text-lg text-muted-foreground mt-2 max-w-2xl">
                    Your daily dose of 5 AI-powered ideas to connect with your audience.
                </p>
            </header>
            
            <Card className="p-4 sm:p-6 bg-card/80">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Intensity</Label>
                        <Tabs value={intensity} onValueChange={(v) => setIntensity(v as Intensity)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="Safe">Safe</TabsTrigger>
                                <TabsTrigger value="Bold">Bold</TabsTrigger>
                                <TabsTrigger value="Viral">Viral</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                     <div className="space-y-2">
                        <Label>Goal</Label>
                        <Tabs value={goal} onValueChange={(v) => setGoal(v as Goal)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="Engagement">Engagement</TabsTrigger>
                                <TabsTrigger value="Sales">Sales</TabsTrigger>
                                <TabsTrigger value="Both">Both</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                     <div className="space-y-2">
                        <Label>Platform</Label>
                         <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="Facebook">Facebook</TabsTrigger>
                                <TabsTrigger value="Instagram">Instagram</TabsTrigger>
                                <TabsTrigger value="Both">Both</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                </div>
            </Card>

            {renderContent()}

        </div>
    );
};

export default EngagementMachineClient;
