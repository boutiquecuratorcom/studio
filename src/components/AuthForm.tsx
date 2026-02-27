"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useFirestore } from "@/firebase";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function AuthForm() {
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleAuthError = (error: any) => {
    console.error("Firebase Auth Error:", error);
    let description = "An unexpected error occurred. Please try again.";
    switch (error.code) {
        case 'auth/user-not-found':
            description = "No account found with this email. Please sign up.";
            break;
        case 'auth/wrong-password':
            description = "Incorrect password. Please try again.";
            break;
        case 'auth/email-already-in-use':
            description = "This email is already in use. Please sign in.";
            break;
        case 'auth/weak-password':
            description = "The password is too weak. Please use at least 6 characters.";
            break;
        case 'auth/invalid-email':
            description = "The email address is not valid.";
            break;
    }
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description,
    });
  };

  const handleSignUp = async (values: FormValues) => {
    if (!auth || !firestore) return;
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;
      
      await setDoc(doc(firestore, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        createdAt: serverTimestamp(),
        displayName: user.email?.split('@')[0] || 'New User',
      });

      toast({
        title: "Account Created!",
        description: "You have been successfully signed up.",
      });
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSignIn = async (values: FormValues) => {
    if (!auth) return;
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: "Signed In",
        description: "Welcome back!",
      });
    } catch (error: any) {
        handleAuthError(error);
    } finally {
        setIsLoading(false);
    }
  };
  
  const onSubmit = (values: FormValues) => {
    if (activeTab === 'signin') {
      handleSignIn(values);
    } else {
      handleSignUp(values);
    }
  }

  return (
    <Card className="w-full max-w-md bg-card/80 backdrop-blur-lg shadow-2xl">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center gap-3 mb-4">
            <Sparkles className="h-7 w-7 text-accent" />
            <h1 className="text-xl font-headline font-semibold tracking-wide text-foreground">
                Boutique Curator
            </h1>
        </div>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>
          Sign in or create an account to access your studio.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="signin" onValueChange={(value) => setActiveTab(value)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                <AuthFormFields form={form} />
                <Button type="submit" size="lg" className="w-full text-base py-6 rounded-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {activeTab === 'signin' ? 'Sign In' : 'Create Account'}
                </Button>
              </form>
            </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}

const AuthFormFields = ({ form }: { form: any }) => (
    <>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email Address</FormLabel>
            <FormControl>
              <Input placeholder="name@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <Input type="password" placeholder="••••••••" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
