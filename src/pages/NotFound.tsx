import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <LogoMark className="h-14 w-14 animate-float" animated />
      <h1 className="mt-6 font-display text-3xl font-semibold text-text">Signal lost.</h1>
      <p className="mt-2 max-w-sm text-text-muted">This page doesn't exist — but your next meeting still will. Let's get you back.</p>
      <Link to="/"><Button className="mt-6">Back to home</Button></Link>
    </div>
  );
}
