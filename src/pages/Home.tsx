import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageSquare,
  Send,
  Workflow,
  TrendingUp,
  TrendingDown,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Skeleton } from "@/components/ui/skeleton";

function DashboardStats({ companyId }: { companyId: number }) {
  const { data, isLoading } = trpc.dashboard.stats.useQuery({ companyId });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Contatos",
      value: data.counts.contacts.toLocaleString("pt-BR"),
      icon: Users,
      trend: "+12%",
      positive: true,
    },
    {
      title: "Templates",
      value: data.counts.templates.toString(),
      icon: MessageSquare,
      trend: "+5",
      positive: true,
    },
    {
      title: "Campanhas",
      value: data.counts.campaigns.toString(),
      icon: Send,
      trend: data.counts.activeCampaigns > 0 ? `${data.counts.activeCampaigns} ativas` : "0 ativas",
      positive: data.counts.activeCampaigns > 0,
    },
    {
      title: "Fluxos Ativos",
      value: data.counts.flows.toString(),
      icon: Workflow,
      trend: "Automatizado",
      positive: true,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className={`text-xs flex items-center gap-1 mt-1 ${stat.positive ? "text-green-600" : "text-muted-foreground"}`}>
              {stat.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {stat.trend}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function MessageStats({ companyId }: { companyId: number }) {
  const { data, isLoading } = trpc.dashboard.stats.useQuery({ companyId });
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  const { messages } = data;
  const deliveryRate = messages.sent > 0 ? Math.round((messages.delivered / messages.sent) * 100) : 0;
  const readRate = messages.delivered > 0 ? Math.round((messages.read / messages.delivered) * 100) : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Mensagens</CardTitle>
          <p className="text-sm text-muted-foreground">Resumo de entregas</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-3xl font-bold">{messages.total.toLocaleString("pt-BR")}</p>
            <p className="text-xs text-muted-foreground">Total enviada</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-green-600">{deliveryRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa de entrega</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Entregues</span>
            <span className="font-medium">{messages.delivered.toLocaleString("pt-BR")}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${deliveryRate}%` }} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500" /> Lidas</span>
            <span className="font-medium">{messages.read.toLocaleString("pt-BR")}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${readRate}%` }} />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2"><XCircle className="h-4 w-4 text-red-500" /> Falhas</span>
            <span className="font-medium">{messages.failed.toLocaleString("pt-BR")}</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-red-500 h-2 rounded-full transition-all" style={{ width: `${messages.total > 0 ? (messages.failed / messages.total) * 100 : 0}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentCampaigns({ companyId }: { companyId: number }) {
  const { data, isLoading } = trpc.dashboard.stats.useQuery({ companyId });
  const navigate = useNavigate();

  if (isLoading || !data) {
    return <Skeleton className="h-64" />;
  }

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    scheduled: { label: "Agendada", variant: "outline" },
    running: { label: "Em andamento", variant: "default" },
    paused: { label: "Pausada", variant: "outline" },
    completed: { label: "Concluída", variant: "secondary" },
    cancelled: { label: "Cancelada", variant: "destructive" },
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Campanhas Recentes</CardTitle>
          <p className="text-sm text-muted-foreground">Últimas campanhas criadas</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate("/campaigns")}>
          Ver Todas
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.recentCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma campanha criada ainda</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/campaigns")}>
                Criar Campanha
              </Button>
            </div>
          ) : (
            data.recentCampaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => navigate("/campaigns")}
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Send className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{campaign.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {campaign.sentCount} / {campaign.totalContacts} enviados
                    </p>
                  </div>
                </div>
                <Badge variant={statusMap[campaign.status]?.variant || "secondary"}>
                  {statusMap[campaign.status]?.label || campaign.status}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [companyId] = useState(1); // TODO: Selecionar empresa atual

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua operação de WhatsApp
          </p>
        </div>

        <DashboardStats companyId={companyId} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MessageStats companyId={companyId} />
          <RecentCampaigns companyId={companyId} />
        </div>

        {/* Recent Messages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Logs de Mensagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MessageLogsTable companyId={companyId} />
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

function MessageLogsTable({ companyId }: { companyId: number }) {
  const { data, isLoading } = trpc.dashboard.stats.useQuery({ companyId });

  if (isLoading || !data) {
    return <Skeleton className="h-48" />;
  }

  const statusIcon: Record<string, { icon: typeof CheckCircle; color: string }> = {
    sent: { icon: Clock, color: "text-yellow-500" },
    delivered: { icon: CheckCircle, color: "text-green-500" },
    read: { icon: Eye, color: "text-blue-500" },
    failed: { icon: XCircle, color: "text-red-500" },
    pending: { icon: Clock, color: "text-gray-400" },
  };

  return (
    <div className="rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Tipo</th>
            <th className="text-left p-3 font-medium">Conteúdo</th>
            <th className="text-left p-3 font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {data.recentMessages.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center p-8 text-muted-foreground">
                Nenhuma mensagem enviada ainda
              </td>
            </tr>
          ) : (
            data.recentMessages.map((msg) => {
              const st = statusIcon[msg.status] || statusIcon.pending;
              const Icon = st.icon;
              return (
                <tr key={msg.id} className="border-b last:border-0 hover:bg-accent/30">
                  <td className="p-3">
                    <span className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${st.color}`} />
                      <span className="capitalize">{msg.status}</span>
                    </span>
                  </td>
                  <td className="p-3 capitalize">{msg.type}</td>
                  <td className="p-3 max-w-xs truncate">{msg.content || "-"}</td>
                  <td className="p-3 text-muted-foreground">
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleString("pt-BR") : "-"}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
