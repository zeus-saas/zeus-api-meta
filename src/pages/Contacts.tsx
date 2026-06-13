import { useState } from "react";
import AuthLayout from "@/components/AuthLayout";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  Tag,
  Trash2,
  Edit,
  Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsPage() {
  const [companyId] = useState(1);
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: contacts, isLoading, refetch } = trpc.contact.list.useQuery({
    companyId,
    search: search || undefined,
  });

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8" />
              Contatos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus contatos e listas de segmentação
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Contato</DialogTitle>
              </DialogHeader>
              <CreateContactForm
                companyId={companyId}
                onSuccess={() => {
                  setIsCreateOpen(false);
                  refetch();
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Contatos</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                    <TableHead>Telefone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!contacts || contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum contato encontrado</p>
                        <Button
                          variant="outline"
                          className="mt-3"
                          onClick={() => setIsCreateOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Contato
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {contact.phone}
                          </span>
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {contact.email}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(contact.tags as string[] || []).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                <Tag className="h-3 w-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={contact.status === "active" ? "default" : contact.status === "blocked" ? "destructive" : "secondary"}
                          >
                            {contact.status === "active" ? "Ativo" : contact.status === "blocked" ? "Bloqueado" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <DeleteContactButton contactId={contact.id} onDelete={refetch} />
                        </TableCell>
                      </TableRow>
                    ))
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

function CreateContactForm({ companyId, onSuccess }: { companyId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tags, setTags] = useState("");

  const utils = trpc.useUtils();
  const mutation = trpc.contact.create.useMutation({
    onSuccess: () => {
      utils.contact.list.invalidate();
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      companyId,
      name,
      phone,
      email: email || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefone (WhatsApp) *</Label>
        <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cliente, vip, prospect" />
      </div>
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
        Adicionar
      </Button>
    </form>
  );
}

function DeleteContactButton({ contactId, onDelete }: { contactId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.contact.delete.useMutation({
    onSuccess: () => onDelete(),
  });

  if (confirming) {
    return (
      <div className="flex gap-1">
        <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: contactId })}>
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
