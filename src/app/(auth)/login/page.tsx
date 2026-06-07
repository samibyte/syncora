"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth.schema";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/constants";
import { Zap, Target } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Login failed");
        return;
      }
      setUser(data.data);
      toast.success(`Welcome back, ${data.data.name}!`);
      router.push("/dashboard");
    } catch {
      toast.error("Something went wrong");
    }
  };

  const handleDemoLogin = (email: string) => {
    setValue("email", email);
    setValue("password", "demo1234");
    setTimeout(() => handleSubmit(onSubmit)(), 100);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-[-120px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-accent/10 blur-3xl rounded-full" />
      </div>

      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-primary text-primary-foreground rounded-2xl p-3 shadow-md">
            <Target className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-xl font-semibold tracking-tight">Syncora</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Smart Project & Task Collaboration
          </p>
        </div>

        {/* Card */}
        <div className="bg-card/80 backdrop-blur-xl border shadow-xl rounded-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sign in to manage your workspace
            </p>
          </div>

          {/* Demo Logins */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Quick Demo Access</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("admin@example.com")}
                className="flex items-center justify-between gap-2 bg-secondary hover:bg-secondary/80 border rounded-xl px-4 py-2 transition group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">Demo Admin</span>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">Full Access</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleDemoLogin("pm@example.com")}
                className="flex items-center justify-between gap-2 bg-secondary hover:bg-secondary/80 border rounded-xl px-4 py-2 transition group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">Demo Manager</span>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">Project Focus</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("member@example.com")}
                className="flex items-center justify-between gap-2 bg-secondary hover:bg-secondary/80 border rounded-xl px-4 py-2 transition group"
              >
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold">Demo Team Member</span>
                </div>
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100">Task Focus</span>
              </button>
            </div>
          </div>


          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="h-10 bg-muted focus:bg-background rounded-xl"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="h-10 bg-muted focus:bg-background rounded-xl"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-xl font-semibold"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
