"use client";

import React from "react";
import { useFirebaseApp, useUser, useFirestore } from "@/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "./ui/badge";

export function ConnectionStatus() {
  const firebaseApp = useFirebaseApp();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const projectId = firebaseApp?.options.projectId;

  const handleWriteTestDoc = async () => {
    if (!firestore || !user) {
      toast({
        variant: "destructive",
        title: "Not signed in",
        description: "You must be signed in to write a test document.",
      });
      return;
    }
    try {
      const testDoc = {
        uid: user.uid,
        email: user.email,
        message: "This is a test document.",
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, `users/${user.uid}/uploads`), testDoc);
      toast({
        title: "Test Document Written",
        description: `Successfully wrote document with ID: ${docRef.id}`,
      });
    } catch (error: any) {
      console.error("Error writing test document:", error);
      toast({
        variant: "destructive",
        title: "Write Failed",
        description: error.message || "Could not write test document.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Status</CardTitle>
        <CardDescription>
          Verify your Firebase connection and user status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">Firebase Project ID</span>
          <Badge variant="secondary">{projectId || "N/A"}</Badge>
        </div>
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium text-muted-foreground">User Status</span>
          <Badge variant={user ? "default" : "destructive"}>
            {user ? "Signed In" : "Signed Out"}
          </Badge>
        </div>
        {user && (
          <>
            <div className="flex flex-col space-y-1 p-3 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Email</span>
                <span className="text-sm font-mono">{user.email}</span>
            </div>
            <div className="flex flex-col space-y-1 p-3 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">User ID (UID)</span>
                <span className="text-sm font-mono">{user.uid}</span>
            </div>
          </>
        )}
        <Button onClick={handleWriteTestDoc} variant="outline" disabled={!user}>
          Write Test Document
        </Button>
      </CardContent>
    </Card>
  );
}
