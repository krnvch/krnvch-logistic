import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found.</p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  );
}
