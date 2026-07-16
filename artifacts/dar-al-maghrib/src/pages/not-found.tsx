import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-6">
        <h1 className="text-8xl font-serif font-bold text-primary">404</h1>
        <h2 className="text-2xl font-bold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          The oasis you are looking for has vanished in the desert sands.
        </p>
        <Link href="/">
          <Button size="lg">Return to Safety</Button>
        </Link>
      </div>
    </div>
  );
}
