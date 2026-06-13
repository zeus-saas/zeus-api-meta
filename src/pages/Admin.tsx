import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { useAuth } from "@/hooks/useAuth";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Building2,
  Users,
  Plus,
  Loader2,
  TrendingUp,
  BarChart3,
  Trash2,
  Edit,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirecionar se não for saas_admin
  if (user && user.role !== "saas_admin") {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <Shield className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold">Acesso Restrito</h1>
          <p className="text-muted-foreground mt-2">
            Apenas administradores do sistema podem acessar esta página.
          </p>
          <Button className="mt-6" onClick={() => navigate("/")}>
            Voltar ao Dashboard
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="h-8 w-8" />
            Administração SaaS
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie empresas, usuários e monitore o sistema
          </p>
        </div>

        <GlobalStats />

        <TabsSection />
      </div>
    </AuthLayout>
  );
}

function GlobalStats() {
  const { data, isLoading } = trpc.dashboard.globalStats.useQuery();

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const stats = [
    { title: "Empresas", value: data.companies, icon: Building2, active: data.activeCompanies },
    { title: "Contatos", value: data.contacts, icon: Users },
    { title: "Campanhas", value: data.campaigns, icon: TrendingUp },
    { title: "Mensagens", value: data.messages, icon: BarChart3 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value.toLocaleString("pt-BR")}</p>
                {"active" in stat && (
                  <p className="text-xs text-green-600">{stat.active} ativas</p>
                )}
              </div>
              <stat.icon className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TabsSection() {
  const [activeTab, setActiveTab] = useState("companies");

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex gap-2 mb-6 border-b pb-4">
          <Button
            variant={activeTab === "companies" ? "default" : "ghost"}
            onClick={() => setActiveTab("companies")}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Empresas
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "ghost"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </Button>
        </div>

        {activeTab === "companies" ? <CompaniesTab /> : <UsersTab />}
      </CardContent>
    </Card>
  );
}

function CompaniesTab() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { data: companies, isLoading, refetch } = trpc.company.list.useQuery();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Empresas Cadastradas</h3>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Empresa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Empresa</DialogTitle>
            </DialogHeader>
            <CreateCompanyForm onSuccess={() => { setIsCreateOpen(false); refetch(); }} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!companies || companies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  <Building2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma empresa cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{company.name}</p>
                      <p className="text-xs text-muted-foreground">{company.document}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{company.plan}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={company.isActive ? "default" : "secondary"}>
                      {company.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {company.whatsappPhoneNumber ? (
                      <span className="text-green-600 text-sm">Conectado</span>
                    ) : (
                      <span className="text-muted-foreground text-sm">Não configurado</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <DeleteCompanyButton companyId={company.id} onDelete={refetch} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

function UsersTab() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Usuários do Sistema</h3>
      <div className="p-8 text-center text-muted-foreground">
        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Gerenciamento de usuários por empresa</p>
        <p className="text-sm mt-1">Acesse a página da empresa para gerenciar seus usuários</p>
      </div>
    </div>
  );
}

function CreateCompanyForm({ onSuccess }: { onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState<"free" | "basic" | "pro" | "enterprise">("free");

  const utils = trpc.useUtils();
  const mutation = trpc.company.create.useMutation({
    onSuccess: () => {
      utils.company.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, document, phone, email, plan });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Nome da Empresa *</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label>CNPJ/Documento</Label>
        <Input value={document} onChange={(e) => setDocument(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Plano</Label>
        <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Gratuito</SelectItem>
            <SelectItem value="basic">Básico</SelectItem>
            <SelectItem value="pro">Profissional</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Criar Empresa
      </Button>
    </form>
  );
}

function DeleteCompanyButton({ companyId, onDelete }: { companyId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.company.delete.useMutation({
    onSuccess: () => onDelete(),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: companyId })}>
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Não</Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
