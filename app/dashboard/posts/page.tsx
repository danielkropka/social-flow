"use client";

import PostsContent from "@/components/PostsContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PostsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Posty</CardTitle>
      </CardHeader>
      <CardContent>
        <PostsContent />
      </CardContent>
    </Card>
  );
}
