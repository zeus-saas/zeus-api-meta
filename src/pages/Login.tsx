import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/providers/trpc";
import { Shield, Mail, Lock, User, Loader2, Play } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.mfaRequired) {
        setTempToken(data.tempToken || "");
        setMfaRequired(true);
        setLoading(false);
      } else {
        localStorage.setItem("auth_token", data.token);
        setLoading(false);
        navigate("/");
      }
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      setLoading(false);
      navigate("/");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const verifyMfaMutation = trpc.auth.verifyMfa.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      setLoading(false);
      navigate("/");
    },
    onError: (err) => {
      setError(err.message);
      setLoading(false);
    },
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    loginMutation.mutate({ email: loginEmail, password: loginPassword });
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    registerMutation.mutate({
      name: registerName,
      email: registerEmail,
      password: registerPassword,
    });
  };

  const handleMfaVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    verifyMfaMutation.mutate({ tempToken, code: mfaCode });
  };

  // Redirecionamento real para o backend processar o OAuth
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || ""}/api/auth/google`;
  };

  const handleMicrosoftLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || ""}/api/auth/microsoft`;
  };

  if (mfaRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md shadow-2xl border-primary/20 bg-card">
          <CardHeader className="text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-foreground">Verificação em Duas Etapas</CardTitle>
            <CardDescription className="text-muted-foreground">
              Insira o código de 6 dígitos do seu aplicativo autenticador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMfaVerify} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/20 text-destructive-foreground text-sm border border-destructive/50">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="mfa-code" className="text-muted-foreground">Código de Verificação</Label>
                <Input
                  id="mfa-code"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] focus-visible:ring-primary"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg" size="lg" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                <span>Verificar Código</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full hover:bg-muted"
                onClick={() => {
                  setMfaRequired(false);
                  setTempToken("");
                  setMfaCode("");
                }}
              >
                <span>Voltar</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4">
        
        {/* LOGO DA PLATAFORMA */}
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 mb-4 rounded-xl flex items-center justify-center overflow-hidden border-2 border-primary shadow-[0_0_15px_rgba(34,197,94,0.3)] bg-black/40 relative">
             {/* Substitua 'logo.png' pelo nome do arquivo da sua imagem enviada (coloque a imagem na pasta 'public') */}
             <img src="/logo.png" alt="Logo WhatsCloud" className="w-full h-full object-contain z-10" onError={(e) => e.currentTarget.style.display = 'none'} />
             {/* Ícone de fallback caso a logo não carregue */}
             <Play className="w-10 h-10 text-primary absolute z-0 opacity-50" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Whats<span className="text-primary">Cloud</span>
          </h1>
          <p className="text-secondary mt-2 font-medium">
            Automação de Alta Performance
          </p>
        </div>

        <Card className="shadow-2xl border-primary/20 bg-card">
          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/20 text-destructive-foreground text-sm border border-destructive/50">
                {error}
              </div>
            )}

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Entrar</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all">Criar Conta</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-muted-foreground">
                      <Mail className="w-4 h-4 inline mr-1 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-muted-foreground">
                      <Lock className="w-4 h-4 inline mr-1 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg" size="lg" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <span>Acessar Painel</span>
                  </Button>
                </form>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground font-semibold">
                      Ou continue com
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleGoogleLogin}
                    className="w-full border-muted hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#ea4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#4285f4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Google</span>
                  </Button>
                  <Button
                    variant="outline"
                    type="button"
                    onClick={handleMicrosoftLogin}
                    className="w-full border-muted hover:border-secondary/50 hover:bg-secondary/5 transition-all"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="#f25022" d="M11 3H3v8h8V3z" />
                      <path fill="#7fba00" d="M21 3h-8v8h8V3z" />
                      <path fill="#00a4ef" d="M11 13H3v8h8v-8z" />
                      <path fill="#ffb900" d="M21 13h-8v8h8v-8z" />
                    </svg>
                    <span>Microsoft</span>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-muted-foreground">
                      <User className="w-4 h-4 inline mr-1 text-primary" />
                      Nome Completo
                    </Label>
                    <Input
                      id="register-name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      placeholder="Seu nome"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-muted-foreground">
                      <Mail className="w-4 h-4 inline mr-1 text-primary" />
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-muted-foreground">
                      <Lock className="w-4 h-4 inline mr-1 text-primary" />
                      Senha
                    </Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="focus-visible:ring-primary"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg mt-2" size="lg" disabled={loading}>
                    {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    <span>Criar Conta</span>
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}