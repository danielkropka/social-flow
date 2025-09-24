import { buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Session } from "next-auth";
import Link from "next/link";

interface UserButtonProps {
  session: Session | null;
  isMobile?: boolean;
}

export default function UserButton({
  session,
  isMobile = false,
}: UserButtonProps) {
  if (!session) {
    return (
      <Link
        href="/log-in"
        className={`${buttonVariants()} ${
          isMobile ? "w-full justify-center" : ""
        }`}
      >
        Zaloguj się
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard"
      className={`flex items-center gap-2 ${
        isMobile ? "p-2 rounded-lg" : "px-3 py-2 rounded-full"
      } hover:bg-gray-100 transition-colors`}
    >
      <Avatar className="h-8 w-8">
        {session.user?.image ? (
          <AvatarImage
            src={session.user.image}
            alt={session.user?.name ?? undefined}
          />
        ) : null}
        <AvatarFallback>{session.user?.name?.charAt(0) ?? "U"}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium text-gray-700">
        {session.user?.name ?? "Użytkownik"}
      </span>
    </Link>
  );
}