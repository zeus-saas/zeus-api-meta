import { useState, useRef } from "react";
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
  Upload,
  Download,
  Building2,
  FileText,
  FileDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import * as XLSX from "xlsx";

export default function ContactsPage() {
  const [companyId] = useState(1); // TODO: Pegar do contexto do usuário logado
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: contacts, isLoading, refetch } = trpc.contact.list.useQuery({
    companyId,
    search: search || undefined,
  });

  const bulkImportMutation = trpc.contact.bulkImport.useMutation({
    onSuccess: (data) => {
      alert(`${data.count} contatos importados com sucesso!`);
      utils.contact.list.invalidate();
      refetch();
    },
    onError: (err) => {
      alert("Erro ao importar: " + err.message);
    },
  });

  // =========================================================================
  // BAIXAR PLANILHA PADRÃO (MODELO)
  // =========================================================================
  const handleDownloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        Nome: "Exemplo Silva",
        Telefone: "5511999999999",
        "Telefone 2": "5511888888888",
        Email: "exemplo@empresa.com",
        Empresa: "Acme Corp",
        CNPJ: "00.000.000/0000-00",
        Origem: "Feira de Negócios"
      }
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, "Planilha_Padrao_WhatsCloud.xlsx");
  };

  // =========================================================================
  // EXPORTAR CONTATOS EXISTENTES
  // =========================================================================
  const handleExportExcel = () => {
    if (!contacts || contacts.length === 0) {
      alert("Nenhum contato para exportar.");
      return;
    }

    const ws = XLSX.utils.json_to_sheet(
      contacts.map((c) => ({
        Nome: c.name,
        Email: c.email || "-",
        Telefone: c.phone,
        "Telefone 2": c.phone2 || "-",
        Empresa: c.company || "-",
        CNPJ: c.cnpj || "-",
        Origem: c.source || "Manual",
        Tags: Array.isArray(c.tags) ? c.tags.join(", ") : "-",
        "Data Importação": c.importedAt
          ? new Date(c.importedAt).toLocaleString("pt-BR")
          : "-",
        "IP Importação": c.importIp || "-",
      }))
    );

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contatos");
    XLSX.writeFile(wb, "Contatos_WhatsCloud.xlsx");
  };

  // =========================================================================
  // IMPORTAR PLANILHA
  // =========================================================================
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const bstr = event.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const formattedData = data
          .map((row) => ({
            name: String(row.Nome || row.name || ""),
            phone: String(row.Telefone || row.telefone || row.phone || ""),
            phone2: row["Telefone 2"] || row.telefone2 ? String(row["Telefone 2"] || row.telefone2) : undefined,
            email: row.Email || row.email ? String(row.Email || row.email) : undefined,
            company: row.Empresa || row.empresa ? String(row.Empresa || row.empresa) : undefined,
            cnpj: row.CNPJ || row.cnpj ? String(row.CNPJ || row.cnpj) : undefined,
            source: row.Origem || row.origem ? String(row.Origem || row.origem) : "Planilha Excel",
            importIp: "Interface Web", 
          }))
          .filter((c) => c.name && c.phone && c.name !== "Exemplo Silva"); // Ignora linha de exemplo e vazias

        if (formattedData.length === 0) {
          alert("O arquivo não possui contatos válidos. Certifique-se de usar a Planilha Padrão.");
          setIsImporting(false);
          return;
        }

        bulkImportMutation.mutate({
          companyId,
          contacts: formattedData,
        });
      } catch (error) {
        console.error(error);
        alert("Erro ao ler o arquivo Excel.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3 text-primary">
              <Users className="h-8 w-8" />
              Contatos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus contatos, empresas e importe listas.
            </p>
          </div>
          
          {/* Botões de Ação Global */}
          <div className="flex flex-wrap gap-2">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImportExcel}
            />
            
            <Button
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10 bg-background"
              onClick={handleDownloadTemplate}
            >
              <FileDown className="h-4 w-4 mr-2" />
              Planilha Padrão
            </Button>

            <Button
              variant="outline"
              className="border-primary/50 text-primary hover:bg-primary/10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
            >
              {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Importar
            </Button>
            <Button
              variant="outline"
              className="border-secondary/50 text-secondary-foreground hover:bg-secondary/10"
              onClick={handleExportExcel}
              disabled={!contacts || contacts.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Contato
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Contato</DialogTitle>
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
        </div>

        <Card className="border-primary/20 shadow-lg">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <CardTitle className="text-lg">Tabela de Contatos</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, empresa..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 border-primary/30 focus-visible:ring-primary"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            {isLoading ? (
              <div className="p-6 space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <Table className="min-w-[1000px]">
                <TableHeader className="bg-background">
                  <TableRow className="border-border">
                    <TableHead className="font-semibold text-primary">Nome</TableHead>
                    <TableHead className="font-semibold">Telefones</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Empresa / CNPJ</TableHead>
                    <TableHead className="font-semibold">Origem</TableHead>
                    <TableHead className="font-semibold">Tags</TableHead>
                    <TableHead className="font-semibold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {!contacts || contacts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Nenhum contato encontrado.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    contacts.map((contact) => (
                      <TableRow key={contact.id} className="hover:bg-primary/5 transition-colors border-border">
                        <TableCell className="font-medium text-foreground">
                          {contact.name}
                          <div className="text-[10px] text-muted-foreground font-normal mt-1">
                            {contact.importedAt ? new Date(contact.importedAt).toLocaleDateString("pt-BR") : ""}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {contact.phone}
                            </span>
                            {contact.phone2 && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3 opacity-50" />
                                {contact.phone2}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {contact.email ? (
                            <span className="flex items-center gap-1 text-sm">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {contact.email}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <span className="flex items-center gap-1 font-medium">
                              <Building2 className="h-3 w-3 text-secondary" />
                              {contact.company || "-"}
                            </span>
                            {contact.cnpj && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <FileText className="h-3 w-3 opacity-50" />
                                {contact.cnpj}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-background">
                            {contact.source || "Manual"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap max-w-[150px]">
                            {(contact.tags as string[] || []).length > 0 ? (
                              (contact.tags as string[]).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary/20 text-secondary-foreground border-secondary/30">
                                  <Tag className="h-3 w-3 mr-1 opacity-70" />
                                  {tag}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="hover:text-primary">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <DeleteContactButton contactId={contact.id} onDelete={refetch} />
                          </div>
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

// =========================================================================
// FORMULÁRIO DE CRIAÇÃO
// =========================================================================
function CreateContactForm({ companyId, onSuccess }: { companyId: number; onSuccess: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phone2, setPhone2] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [cnpj, setCnpj] = useState("");
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
      phone2: phone2 || undefined,
      email: email || undefined,
      company: company || undefined,
      cnpj: cnpj || undefined,
      source: "Manual",
      importIp: "Interface Web", 
      tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome <span className="text-destructive">*</span></Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: João Silva" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="joao@exemplo.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (WhatsApp) <span className="text-destructive">*</span></Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="5511999999999" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone2">Telefone 2 (Opcional)</Label>
          <Input id="phone2" value={phone2} onChange={(e) => setPhone2(e.target.value)} placeholder="5511888888888" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Empresa do Contato</Label>
          <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Ex: Acme Corp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cliente, vip, prospect" />
      </div>

      <div className="pt-4 flex justify-end">
        <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground" disabled={mutation.isPending}>
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
          Adicionar Contato
        </Button>
      </div>
    </form>
  );
}

// =========================================================================
// BOTÃO DE EXCLUIR CONTATO
// =========================================================================
function DeleteContactButton({ contactId, onDelete }: { contactId: number; onDelete: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const mutation = trpc.contact.delete.useMutation({
    onSuccess: () => {
      setConfirming(false);
      onDelete();
    },
  });

  if (confirming) {
    return (
      <div className="flex items-center gap-1 bg-destructive/10 p-1 rounded-md">
        <Button variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => mutation.mutate({ id: contactId })}>
          {mutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Sim"}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs hover:bg-background" onClick={() => setConfirming(false)}>Não</Button>
      </div>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => setConfirming(true)} className="hover:text-destructive hover:bg-destructive/10">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}