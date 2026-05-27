import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { LogoWordmark } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

type Mode = "login" | "register";
const loginFormSchema = loginSchema;

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const [fullName, setFullName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  const auth = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginFormSchema>>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "demo@tempotrack.app", password: "demo123" },
  });

  async function submitLogin(values: z.infer<typeof loginFormSchema>) {
    try {
      await auth.login(values.email, values.password);
      toast({ title: "Welcome back", description: "Your saved tracking data is loaded." });
    } catch (error) {
      toast({ title: "Login failed", description: cleanError(error), variant: "destructive" });
    }
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();

    if (!fullName.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (!userEmail.trim() || !/^\S+@\S+\.\S+$/.test(userEmail)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }

    if (registerPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    try {
      setRegisterLoading(true);
      await auth.register(fullName.trim(), userEmail.trim().toLowerCase(), registerPassword);
      toast({ title: "Account created", description: "Your private workspace is ready." });
    } catch (error) {
      toast({ title: "Could not create account", description: cleanError(error), variant: "destructive" });
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground grid lg:grid-cols-[1fr_420px]">
      <section className="hidden lg:flex flex-col justify-between border-r border-border bg-sidebar p-10">
        <LogoWordmark />
        <div className="max-w-xl">
          <p className="text-xs uppercase tracking-[0.24em] text-primary">Private productivity tracking</p>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">
            Track your day, month, and year in one saved workspace.
          </h1>
          <p className="mt-3 text-sm leading-6 text-sidebar-foreground/70">
            Each account has its own tasks, progress, charts, and timeline. Register a user, log out, then log in again and your data stays on the server.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-xs text-sidebar-foreground/70">
          <div className="rounded-xl border border-sidebar-border bg-background/40 p-3">
            <span className="block text-lg font-semibold text-primary">3</span>
            Horizons
          </div>
          <div className="rounded-xl border border-sidebar-border bg-background/40 p-3">
            <span className="block text-lg font-semibold text-primary">4</span>
            Analytics views
          </div>
          <div className="rounded-xl border border-sidebar-border bg-background/40 p-3">
            <span className="block text-lg font-semibold text-primary">∞</span>
            User workspaces
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center p-5">
        <Card className="w-full max-w-md border-card-border bg-card" data-testid="card-auth">
          <CardHeader>
            <div className="lg:hidden mb-4">
              <LogoWordmark />
            </div>
            <CardTitle>{mode === "login" ? "Sign in" : "Create account"}</CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Use the demo account or your own account to load saved tasks."
                : "New users get their own private task database view."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "login" ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(submitLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" autoComplete="email" data-testid="input-login-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" autoComplete="current-password" data-testid="input-login-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting} data-testid="button-login">
                    {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
                  </Button>
                </form>
              </Form>
            ) : (
              <form onSubmit={submitRegister} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Name</label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Your name"
                    data-testid="input-register-name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Email</label>
                  <Input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="you@example.com"
                    data-testid="input-register-email"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none">Password</label>
                  <Input
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    data-testid="input-register-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={registerLoading} data-testid="button-register">
                  {registerLoading ? "Creating..." : "Create account"}
                </Button>
              </form>
            )}

            <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              Demo login: <span className="font-medium text-foreground">demo@tempotrack.app</span> / <span className="font-medium text-foreground">demo123</span>
            </div>
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              data-testid="button-toggle-auth-mode"
            >
              {mode === "login" ? "Create a new account" : "I already have an account"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

function cleanError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Something went wrong.";
  try {
    const parsed = JSON.parse(message.replace(/^\d+:\s*/, ""));
    return parsed.message ?? message;
  } catch {
    return message.replace(/^\d+:\s*/, "");
  }
}
