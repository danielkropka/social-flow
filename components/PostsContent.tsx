import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Post {
  id: number;
  title: string;
  content: string;
  date: string;
}

export default function PostsContent() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    // Przykładowe dane, w rzeczywistej aplikacji możesz pobierać dane z API
    const fetchPosts = async () => {
      const examplePosts: Post[] = [
        {
          id: 1,
          title: "Pierwszy post",
          content: "To jest pierwszy post",
          date: "2023-10-01",
        },
        {
          id: 2,
          title: "Drugi post",
          content: "To jest drugi post",
          date: "2023-10-02",
        },
        {
          id: 3,
          title: "Trzeci post",
          content: "To jest trzeci post",
          date: "2023-10-03",
        },
      ];
      setPosts(examplePosts);
    };

    fetchPosts();
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {posts.map((post) => (
        <Card
          key={post.id}
          className="border border-gray-200 rounded-lg shadow-sm"
        >
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {post.title}
            </CardTitle>
            <p className="text-sm text-gray-500">{post.date}</p>
          </CardHeader>
          <CardContent>
            <p>{post.content}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
