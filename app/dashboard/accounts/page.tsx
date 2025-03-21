"use client";

import AccountsContent from "@/components/AccountsContent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Połączone konta</CardTitle>
      </CardHeader>
      <CardContent>
        <AccountsContent />
      </CardContent>
    </Card>
  );
}
