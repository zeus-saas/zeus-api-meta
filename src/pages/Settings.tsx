import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Shield,
  Key,
  Smartphone,
  Loader2,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Eye,
  EyeOff,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Configurações
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas configurações de conta e segurança
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp API</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileSettings />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="whatsapp">
            <WhatsAppSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AuthLayout>
  );
}

function ProfileSettings() {
  const { user } = useAuth();

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Informações do Perfil</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="profile-name">Nome</Label>
          <Input id="profile-name" defaultValue={user?.name || ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" defaultValue={user?.email || ""} disabled />
          <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
        </div>
        <div className="space-y-2">
          <Label>Provedor de Autenticação</Label>
          <div className="p-3 rounded-lg border bg-muted">
            <span className="capitalize font-medium">{user?.authProvider || "local"}</span>
          </div>
        </div>
        <Button>Salvar Alterações</Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  const { user, token } = useAuth();
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const setupMfa = trpc.auth.setupMfa.useQuery(
    { token: token || "" },
    { enabled: showMfaSetup && !!token && !user?.mfaEnabled }
  );

  const enableMfa = trpc.auth.enableMfa.useMutation({
    onSuccess: () => {
      toast.success("MFA ativado com sucesso!");
      window.location.reload();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const disableMfa = trpc.auth.disableMfa.useMutation({
    onSuccess: () => {
      toast.success("MFA desativado com sucesso!");
      window.location.reload();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (setupMfa.data && !qrCode && showMfaSetup) {
    setQrCode(setupMfa.data.qrCode);
    setSecret(setupMfa.data.secret);
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Autenticação em Duas Etapas (MFA)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${user?.mfaEnabled ? "bg-green-100" : "bg-gray-100"}`}>
                <Shield className={`h-5 w-5 ${user?.mfaEnabled ? "text-green-600" : "text-gray-500"}`} />
              </div>
              <div>
                <p className="font-medium">{user?.mfaEnabled ? "Protegido" : "Não Protegido"}</p>
                <p className="text-sm text-muted-foreground">
                  {user?.mfaEnabled
                    ? "Sua conta está protegida com autenticação em duas etapas"
                    : "Ative o MFA para aumentar a segurança da sua conta"}
                </p>
              </div>
            </div>
            {user?.mfaEnabled ? (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">Desativar</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Desativar MFA</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Insira o código do seu autenticador para confirmar.
                    </p>
                    <Input
                      placeholder="000000"
                      maxLength={6}
                      value={mfaCode}
                      onChange={(e) => setMfaCode(e.target.value)}
                      className="text-center text-2xl tracking-[0.5em]"
                    />
                    <Button
                      className="w-full"
                      variant="destructive"
                      disabled={disableMfa.isPending || mfaCode.length !== 6}
                      onClick={() => token && disableMfa.mutate({ token, code: mfaCode })}
                    >
                      {disableMfa.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Desativar MFA"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" onClick={() => setShowMfaSetup(true)}>Ativar</Button>
            )}
          </div>

          {showMfaSetup && !user?.mfaEnabled && (
            <Card className="border-primary">
              <CardContent className="pt-6 space-y-4">
                {isLoading || !qrCode ? (
                  <div className="flex flex-col items-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">Gerando QR Code...</p>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col items-center">
                      <p className="text-sm font-medium mb-2">Escaneie o QR Code com seu app autenticador</p>
                      <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 rounded-lg border" />
                    </div>

                    <div className="space-y-2">
                      <Label>Ou insira o código manualmente</Label>
                      <div className="flex gap-2">
                        <Input
                          value={secret}
                          readOnly
                          type={showSecret ? "text" : "password"}
                          className="font-mono"
                        />
                        <Button variant="outline" size="icon" onClick={() => setShowSecret(!showSecret)}>
                          {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            navigator.clipboard.writeText(secret);
                            toast.success("Copiado!");
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="verify-code">Código de Verificação</Label>
                      <Input
                        id="verify-code"
                        placeholder="000000"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value)}
                        className="text-center text-2xl tracking-[0.5em]"
                      />
                    </div>

                    <Button
                      className="w-full"
                      disabled={enableMfa.isPending || mfaCode.length !== 6}
                      onClick={() => token && enableMfa.mutate({ token, code: mfaCode })}
                    >
                      {enableMfa.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Shield className="h-4 w-4 mr-2" />}
                      Verificar e Ativar
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Alterar Senha
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Senha Atual</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <Input id="new-password" type="password" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
            <Input id="confirm-password" type="password" />
          </div>
          <Button>Alterar Senha</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function WhatsAppSettings() {
  const [companyId] = useState(1);
  const { data: company, isLoading } = trpc.company.getById.useQuery({ id: companyId });
  const updateMutation = trpc.company.update.useMutation({
    onSuccess: () => {
      toast.success("Configurações salvas com sucesso!");
    },
  });

  const [form, setForm] = useState({
    whatsappBusinessId: "",
    whatsappPhoneId: "",
    whatsappApiToken: "",
    whatsappPhoneNumber: "",
  });

  if (company && !form.whatsappBusinessId && !isLoading) {
    setForm({
      whatsappBusinessId: company.whatsappBusinessId || "",
      whatsappPhoneId: company.whatsappPhoneId || "",
      whatsappApiToken: company.whatsappApiToken || "",
      whatsappPhoneNumber: company.whatsappPhoneNumber || "",
    });
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id: companyId,
      ...form,
    });
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Configurações da API WhatsApp (Meta)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Credenciais da API Oficial da Meta
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                  Estas credenciais são fornecidas pelo Facebook Business Manager.
                  Mantenhas em segurança e nunca compartilhe com terceiros.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="waba-id">WhatsApp Business Account ID</Label>
            <Input
              id="waba-id"
              value={form.whatsappBusinessId}
              onChange={(e) => setForm({ ...form, whatsappBusinessId: e.target.value })}
              placeholder="123456789012345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-id">Phone Number ID</Label>
            <Input
              id="phone-id"
              value={form.whatsappPhoneId}
              onChange={(e) => setForm({ ...form, whatsappPhoneId: e.target.value })}
              placeholder="123456789012345"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-token">API Access Token</Label>
            <Input
              id="api-token"
              type="password"
              value={form.whatsappApiToken}
              onChange={(e) => setForm({ ...form, whatsappApiToken: e.target.value })}
              placeholder="EAAB..."
            />
            <p className="text-xs text-muted-foreground">
              Token de acesso permanente gerado no Facebook Developers
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de Telefone</Label>
            <Input
              id="phone-number"
              value={form.whatsappPhoneNumber}
              onChange={(e) => setForm({ ...form, whatsappPhoneNumber: e.target.value })}
              placeholder="5511999999999"
            />
            <p className="text-xs text-muted-foreground">
              Formato internacional: código do país + DDD + número
            </p>
          </div>

          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Salvar Configurações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
