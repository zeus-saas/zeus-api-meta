import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
import { trpc } from "@/providers/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  MessageSquare,
  Plus,
  Trash2,
  FileText,
  Image,
  Video,
  File,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TemplatesPage() {
  const [companyId] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: templates, isLoading, refetch } = trpc.template.list.useQuery({ companyId });

  const categoryColors: Record<string, string> = {
    MARKETING: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    UTILITY: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    AUTHENTICATION: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  };

  const metaStatusMap: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
    APPROVED: { label: "Aprovado", color: "bg-green-100 text-green-800" },
    REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
    NOT_SUBMITTED: { label: "Não Enviado", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              Templates
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie templates de mensagens para aprovação na Meta
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Template</DialogTitle>
              </DialogHeader>
              <CreateTemplateForm
                companyId={companyId}
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
        ) : !templates || templates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Nenhum template criado</p>
              <p className="text-sm mb-4">Crie seu primeiro template de mensagem</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                    <Badge className={categoryColors[template.category]} variant="secondary">
                      {template.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg bg-muted text-sm whitespace-pre-wrap">
                    {template.body}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {template.headerType === "TEXT" && <FileText className="h-4 w-4 text-muted-foreground" />}
                      {template.headerType === "IMAGE" && <Image className="h-4 w-4 text-muted-foreground" />}
                      {template.headerType === "VIDEO" && <Video className="h-4 w-4 text-muted-foreground" />}
                      {template.headerType === "DOCUMENT" && <File className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground capitalize">{template.headerType?.toLowerCase()}</span>
                    </div>
                    <Badge variant="outline" className={metaStatusMap[template.metaStatus]?.color}>
                      {metaStatusMap[template.metaStatus]?.label}
                    </Badge>
                  </div>

                  {template.variables && (template.variables as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {(template.variables as string[]).map((v) => (
                        <Badge key={v} variant="outline" className="text-xs">{`{{${v}}}`}</Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <DeleteTemplateButton templateId={template.id} onDelete={refetch} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

function CreateTemplateForm({ companyId, onSuccess }: { companyId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"MARKETING" | "UTILITY" | "AUTHENTICATION">("MARKETING");
  const [body, setBody] = useState("");
  const [headerType, setHeaderType] = useState<"NONE" | "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT">("NONE");
  const [headerText, setHeaderText] = useState("");
  const [footer, setFooter] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.template.create.useMutation({
    onSuccess: () => {
      utils.template.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Extrair variáveis do body ({{1}}, {{2}}, etc.)
    const varMatches = body.match(/\{\{(\d+)\}\}/g);
    const variables = varMatches ? varMatches.map((v) => v.replace(/[{}]/g, "")) : [];

    mutation.mutate({
      companyId,
      name,
      description: description || undefined,
      category,
      body,
      headerType,
      headerText: headerText || undefined,
      footer: footer || undefined,
      variables: variables.length > 0 ? variables : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="t-name">Nome do Template *</Label>
        <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-desc">Descrição</Label>
        <Input id="t-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Categoria</Label>
        <Select value={category} onValueChange={(v) => setCategory(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MARKETING">Marketing</SelectItem>
            <SelectItem value="UTILITY">Utilitário</SelectItem>
            <SelectItem value="AUTHENTICATION">Autenticação</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-header-type">Tipo do Cabeçalho</Label>
        <Select value={headerType} onValueChange={(v) => setHeaderType(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">Nenhum</SelectItem>
            <SelectItem value="TEXT">Texto</SelectItem>
            <SelectItem value="IMAGE">Imagem</SelectItem>
            <SelectItem value="VIDEO">Vídeo</SelectItem>
            <SelectItem value="DOCUMENT">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {headerType === "TEXT" && (
        <div className="space-y-2">
          <Label htmlFor="t-header-text">Texto do Cabeçalho</Label>
          <Input id="t-header-text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} />
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="t-body">Conteúdo da Mensagem *</Label>
        <Textarea
          id="t-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Olá {{1}}, sua fatura no valor de {{2}} vence amanhã."
          rows={4}
          required
        />
        <p className="text-xs text-muted-foreground">
          Use {"{{1}}"}, {"{{2}}"}, etc. para variáveis de personalização
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="t-footer">Rodapé</Label>
        <Input id="t-footer" value={footer} onChange={(e) => setFooter(e.target.value)} placeholder="Responda STOP para cancelar" />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Criar Template
      </Button>
    </form>
  );
}

function DeleteTemplateButton({ templateId, onDelete }: { templateId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.template.delete.useMutation({
    onSuccess: () => onDelete(),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: templateId })}>
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirmar"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>Cancelar</Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
