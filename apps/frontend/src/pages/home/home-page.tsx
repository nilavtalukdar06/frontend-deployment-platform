import { FolderGit2 } from "lucide-react";
import { AppShell } from "@/components/deploy/app-shell";
import { NavItem } from "@/components/deploy/nav-item";
import { useAuthenticatedSession } from "@/components/auth/session-context";

export default function HomePage() {
  const { user } = useAuthenticatedSession();

  return (
    <AppShell
      title="Projects"
      nav={
        <NavItem href="/" active>
          <FolderGit2 />
          Projects
        </NavItem>
      }
    >
      <h1 className="text-heading font-medium">
        Welcome, {user.name ?? user.githubLogin}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your projects will appear here.
      </p>
    </AppShell>
  );
}
