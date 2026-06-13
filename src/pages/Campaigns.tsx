import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Send,
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  Target,
  CheckCircle,
  Clock,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsPage() {
  const [companyId] = useState(1);
  const [userId] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: campaigns, isLoading, refetch } = trpc.campaign.list.useQuery({ companyId });
  const { data: stats } = trpc.campaign.stats.useQuery({ companyId });

  const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | null }> = {
    draft: { label: "Rascunho", variant: "secondary" },
    scheduled: { label: "Agendada", variant: "outline" },
    running: { label: "Em Andamento", variant: "default" },
    paused: { label: "Pausada", variant: "outline" },
    completed: { label: "Concluída", variant: "secondary" },
    cancelled: { label: "Cancelada", variant: "destructive" },
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Send className="h-8 w-8" />
              Campanhas
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie campanhas de disparo de mensagens
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Campanha
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Campanha</DialogTitle>
              </DialogHeader>
              <CreateCampaignForm
                companyId={companyId}
                userId={userId}
                onSuccess={() => {
                  setIsCreateOpen(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                  <p className="text-2xl font-bold text-green-600">{stats?.running || 0}</p>
                </div>
                <Play className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Agendadas</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {campaigns?.filter((c) => c.status === "scheduled").length || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Concluídas</p>
                  <p className="text-2xl font-bold text-muted-foreground">
                    {campaigns?.filter((c) => c.status === "completed").length || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Métricas</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!campaigns || campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        <Send className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma campanha criada</p>
                        <Button variant="outline" className="mt-3" onClick={() => setIsCreateOpen(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Campanha
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => {
                      const progress = campaign.totalContacts > 0
                        ? Math.round((campaign.sentCount / campaign.totalContacts) * 100)
                        : 0;
                      const st = statusMap[campaign.status];
                      return (
                        <TableRow key={campaign.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <p className="text-xs text-muted-foreground">{campaign.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={st?.variant || "secondary"}>{st?.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="w-32">
                              <Progress value={progress} className="h-2" />
                              <span className="text-xs text-muted-foreground">{progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <span className="flex items-center gap-1">
                                <Target className="h-3 w-3" /> {campaign.totalContacts} contatos
                              </span>
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-3 w-3" /> {campaign.deliveredCount} entregues
                              </span>
                              <span className="flex items-center gap-1 text-blue-600">
                                <BarChart3 className="h-3 w-3" /> {campaign.readCount} lidos
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {campaign.status === "draft" && (
                                <Button variant="ghost" size="icon" title="Iniciar">
                                  <Play className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {campaign.status === "running" && (
                                <Button variant="ghost" size="icon" title="Pausar">
                                  <Pause className="h-4 w-4 text-yellow-600" />
                                </Button>
                              )}
                              <DeleteCampaignButton campaignId={campaign.id} onDelete={refetch} />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
}

function CreateCampaignForm({ companyId, userId, onSuccess }: { companyId: number; userId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.campaign.create.useMutation({
    onSuccess: () => {
      utils.campaign.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      companyId,
      userId,
      name,
      description: description || undefined,
      scheduledAt: scheduledAt || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="c-name">Nome da Campanha *</Label>
        <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-desc">Descrição</Label>
        <Textarea id="c-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-schedule">Agendamento (opcional)</Label>
        <Input
          id="c-schedule"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Deixe em branco para salvar como rascunho</p>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Criar Campanha
      </Button>
    </form>
  );
}

function DeleteCampaignButton({ campaignId, onDelete }: { campaignId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.campaign.delete.useMutation({
    onSuccess: () => onDelete(),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: campaignId })}>
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
