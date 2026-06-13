import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  Workflow,
  Plus,
  Play,
  Pause,
  Trash2,
  Loader2,
  GitBranch,
  Zap,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function FlowsPage() {
  const [companyId] = useState(1);
  const [userId] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: flows, isLoading, refetch } = trpc.flow.list.useQuery({ companyId });

  const statusMap: Record<string, { label: string; color: string; icon: typeof Play }> = {
    draft: { label: "Rascunho", color: "bg-gray-100 text-gray-800", icon: Clock },
    active: { label: "Ativo", color: "bg-green-100 text-green-800", icon: Play },
    paused: { label: "Pausado", color: "bg-yellow-100 text-yellow-800", icon: Pause },
    inactive: { label: "Inativo", color: "bg-red-100 text-red-800", icon: Pause },
  };

  const triggerMap: Record<string, { label: string; icon: typeof Zap }> = {
    manual: { label: "Manual", icon: Zap },
    webhook: { label: "Webhook", icon: GitBranch },
    schedule: { label: "Agendado", icon: Clock },
    inbound_message: { label: "Mensagem Recebida", icon: MessageCircle },
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Workflow className="h-8 w-8" />
              Automações
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie fluxos automatizados de mensagens
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Fluxo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Criar Fluxo de Automação</DialogTitle>
              </DialogHeader>
              <CreateFlowForm
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

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : !flows || flows.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Workflow className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum fluxo criado</p>
              <p className="text-sm mb-4">Crie seu primeiro fluxo de automação</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Fluxo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {flows.map((flow) => {
              const st = statusMap[flow.status];
              const tr = triggerMap[flow.trigger];
              const TriggerIcon = tr?.icon || Zap;
              return (
                <Card key={flow.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{flow.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">{flow.description}</p>
                      </div>
                      <Badge className={st?.color} variant="secondary">
                        {st?.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <TriggerIcon className="h-4 w-4" />
                      <span>Gatilho: {tr?.label}</span>
                    </div>

                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageCircle className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs mt-1">Início</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-border" />
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <GitBranch className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-xs mt-1">{flow.nodes ? (flow.nodes as any[]).length : 0} passos</span>
                      </div>
                      <div className="flex-1 h-0.5 bg-border" />
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                          <Zap className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-xs mt-1">Fim</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={flow.status === "active"} />
                        <span className="text-sm">{flow.status === "active" ? "Ativo" : "Inativo"}</span>
                      </div>
                      <div className="flex gap-1">
                        {flow.status === "draft" && (
                          <Button variant="ghost" size="sm">
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                        <DeleteFlowButton flowId={flow.id} onDelete={refetch} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

function CreateFlowForm({ companyId, userId, onSuccess }: { companyId: number; userId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trigger, setTrigger] = useState<"manual" | "webhook" | "schedule" | "inbound_message">("manual");

  const utils = trpc.useUtils();
  const mutation = trpc.flow.create.useMutation({
    onSuccess: () => {
      utils.flow.list.invalidate();
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
      trigger,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="f-name">Nome do Fluxo *</Label>
        <Input id="f-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="f-desc">Descrição</Label>
        <Textarea id="f-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Gatilho de Ativação</Label>
        <Select value={trigger} onValueChange={(v) => setTrigger(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="webhook">Webhook</SelectItem>
            <SelectItem value="schedule">Agendado</SelectItem>
            <SelectItem value="inbound_message">Mensagem Recebida</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Criar Fluxo
      </Button>
    </form>
  );
}

function DeleteFlowButton({ flowId, onDelete }: { flowId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.flow.delete.useMutation({
    onSuccess: () => onDelete(),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: flowId })}>
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Não</Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
