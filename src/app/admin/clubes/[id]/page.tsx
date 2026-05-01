import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { 
    Calendar, MapPin, ShieldCheck, Plus, 
    Trash2, Edit, Building2, Users, 
    Trophy, ChevronRight, Globe, Info,
    LayoutDashboard, UserCheck, Settings,
    AlertTriangle, Clock, ShieldAlert,
    ArrowLeft, User, Search
} from "lucide-react";
import Link from "next/link";
import { format, isAfter, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Card, CardContent, CardDescription, 
    CardHeader, CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Table, TableBody, TableCell, 
    TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { parseLegalStatus } from "@/lib/utils";

// Diálogos de Gestión
import { EditClubDetailsDialog } from "@/components/admin/EditClubDetailsDialog";
import { ManageBoardDialog } from "@/components/admin/ManageBoardDialog";
import { ManageInfrastructureDialog } from "@/components/admin/ManageInfrastructureDialog";
import { ManageClubPlayerDialog } from "@/components/admin/ManageClubPlayerDialog";
import { ClaimPlayerDialog } from "@/components/admin/ClaimPlayerDialog";
import { BulkImportTool } from "@/components/admin/BulkImportTool";

export default async function ClubMasterFile({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ q?: string }> }) {
    const { id } = await params;
    const { q } = await searchParams;
    const searchQuery = q?.toLowerCase() || "";
    const session = await auth();
    
    // Nueva lógica RBAC: SuperAdmins, Federación y Delegados del mismo club
    const userRole = (session?.user as any)?.role;
    const isAdmin = ["SUPERADMIN", "FEDERATION_ADMIN"].includes(userRole);
    const isAuthorized = isAdmin || (userRole === "CLUB_DELEGATE" && (session?.user as any).managedClubId === id);

    if (!session || !isAuthorized) {
        redirect('/login');
    }

    let allClubs: { id: string, name: string, slug: string }[] = [];
    let club = null;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            if (isAdmin) {
                allClubs = await prisma.club.findMany({ 
                    select: { id: true, name: true, slug: true },
                    orderBy: { name: 'asc' }
                });
            }

            club = await prisma.club.findUnique({
                where: { id },
                include: {
                    boardMembers: { orderBy: { role: 'asc' } },
                    delegates: { select: { id: true, name: true, email: true } },
                    players: {
                        include: {
                            user: { select: { name: true, email: true } },
                            rankings: { take: 1 }
                        },
                        orderBy: { updatedAt: 'desc' }
                    },
                    _count: {
                        select: {
                            players: true,
                            hostedTournaments: true
                        }
                    }
                }
            });
            break; // Éxito
        } catch (error: any) {
            attempts++;
            if (error.message.includes("Timed out") && attempts < maxAttempts) {
                console.warn(`⚠️ Pool saturado. Reintentando consulta (${attempts}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, 500)); // Esperar 500ms
                continue;
            }
            throw error;
        }
    }

    if (!club) notFound();

    const infrastructure = (club.infrastructure as any)?.tables || [];

    // Lógica de Cumplimiento Federativo (PDF Vigilance)
    const compliance = parseLegalStatus(club.legalStatus);

    const now = new Date();
    const isVigente = compliance.expiryDate ? isAfter(new Date(compliance.expiryDate), now) : false;
    const isDeferred = compliance.deferredUntil ? isAfter(new Date(compliance.deferredUntil), now) : false;
    
    // Status Final
    let complianceStatus: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (!isVigente) {
        complianceStatus = isDeferred ? 'WARNING' : 'CRITICAL';
    }

    return (
        <main className="min-h-screen bg-[#070b14] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-[1400px] mx-auto space-y-8">
                
                {/* Navegación Superior */}
                <nav className="flex items-center gap-4">
                    <Link 
                        href="/dashboard" 
                        className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-400 transition-colors"
                    >
                        <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-blue-500/30 transition-all">
                            <ArrowLeft className="w-3 h-3" />
                        </div>
                        Volver al Home
                    </Link>
                </nav>

                {/* Header Táctico Alineado con Grid */}
                <header className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-slate-800 pb-8">
                    {/* Identidad de Marca (2 Columnas) */}
                    <div className="lg:col-span-2 flex items-center gap-6">
                        <div className="w-24 h-24 rounded-2xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-500/10 shrink-0">
                            {club.logoUrl ? (
                                <img src={club.logoUrl} alt={club.name} className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 className="w-12 h-12 text-slate-700" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                                    {club.name}
                                </h1>
                                <Badge className={
                                    club.membershipStatus === 'VIGENTE' 
                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                                    : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                }>
                                    {club.membershipStatus}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 font-mono text-xs uppercase tracking-widest">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                                    {club.address}, {club.city}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                                    Fundado: {club.foundedDate ? format(new Date(club.foundedDate), "dd MMM yyyy", { locale: es }) : 'No registrado'}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <ShieldCheck className={`w-3.5 h-3.5 ${complianceStatus === 'CRITICAL' ? 'text-red-500' : complianceStatus === 'WARNING' ? 'text-amber-500' : 'text-emerald-500'}`} />
                                    Vigencia Doc: {compliance.expiryDate ? format(new Date(compliance.expiryDate), "dd MMM yyyy", { locale: es }) : 'No definida'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Acciones y Alertas (1 Columna - Alineada con Infraestructura) */}
                    <div className="lg:col-span-1 flex flex-col justify-end items-end gap-4 min-w-fit">
                        {/* Contenedor de Alertas con Altura Fija para evitar saltos */}
                        <div className="flex h-8 items-center justify-end">
                            {complianceStatus === 'CRITICAL' && (
                                <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 animate-pulse shadow-[0_0_15px_-5px_rgba(239,68,68,0.3)]">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    <span className="text-[9px] font-black text-red-400 uppercase tracking-tighter">Vigencia Expirada</span>
                                </div>
                            )}
                            {complianceStatus === 'WARNING' && (
                                <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-tighter">Prórroga Activa</span>
                                </div>
                            )}
                        </div>
                        
                        {/* Contenedor de Botones con Control de Wrappeo */}
                        <div className="flex flex-wrap items-center justify-end gap-2 w-full">
                            <div className="shrink-0">
                                <EditClubDetailsDialog club={club as any} />
                            </div>
                            {club.certificateUrl ? (
                                <a 
                                    href={club.certificateUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center border border-slate-800 bg-slate-900 hover:bg-slate-800 h-10 text-[10px] uppercase font-black tracking-widest px-4 shrink-0 shadow-xl rounded-md transition-colors"
                                >
                                     Descargar Certificado
                                </a>
                            ) : (
                                <div className="inline-flex items-center justify-center border border-slate-800 bg-slate-900 h-10 text-[10px] uppercase font-black tracking-widest px-4 shrink-0 opacity-30 cursor-not-allowed rounded-md">
                                     Descargar Certificado
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Dashboard de Gestión */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Panel Central: Dirigentes y Autoridades */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Directiva Oficial */}
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 uppercase">
                                        <UserCheck className="w-5 h-5 text-blue-500" />
                                        Directiva Oficial
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1">Autoridades registradas ante la federación</p>
                                </div>
                                <ManageBoardDialog clubId={club.id} currentBoard={club.boardMembers as any} />
                            </div>
                            
                            {!club.certificateUrl && (
                                <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                                        <ShieldAlert className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-red-400 uppercase tracking-tight">Bloqueo de Validación Pendiente</p>
                                        <p className="text-[10px] text-red-500/70 font-mono uppercase tracking-widest mt-0.5">
                                            Falta Certificado de Vigencia. La directiva no puede ser validada oficialmente sin el documento.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-950/50">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-6">Cargo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nombre Completo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Contacto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {club.boardMembers.length > 0 ? (
                                            club.boardMembers.map((member: any) => (
                                                <TableRow key={member.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                                                    <TableCell className="pl-6 py-4">
                                                        <Badge variant="outline" className="text-[9px] font-black tracking-tighter uppercase border-blue-500/20 text-blue-400 bg-blue-500/5">
                                                            {member.role.replace('_', ' ')}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-bold text-white uppercase text-sm flex items-center gap-2">
                                                        {member.isValidated ? (
                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" aria-label="Validado" />
                                                        ) : (
                                                            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" aria-label="Pendiente" />
                                                        )}
                                                        {member.name}
                                                    </TableCell>
                                                    <TableCell className="text-slate-400 font-mono text-xs">
                                                        <div className="flex flex-col">
                                                            <span>{member.email || '-'}</span>
                                                            <span className="text-slate-600">{member.phone || '-'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-tighter ${member.isValidated ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                            {member.isValidated ? 'Oficial' : 'Pendiente'}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-slate-600 font-mono text-xs italic">
                                                    No hay miembros de directiva registrados.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>

                        {/* Padrón del Club - Gestión Descentralizada */}
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-800 flex flex-col gap-5 bg-slate-900/80">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2 uppercase">
                                        <Users className="w-5 h-5 text-emerald-500" />
                                        Padrón del Club
                                    </h2>
                                    <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-1 text-emerald-500/50">Gestión de deportistas federados y asociados</p>
                                </div>
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <form method="GET" className="relative flex items-center w-full sm:w-auto">
                                        <Search className="absolute left-3 w-4 h-4 text-slate-500" />
                                        <Input 
                                            name="q" 
                                            defaultValue={searchQuery}
                                            placeholder="Buscar deportista..." 
                                            className="w-full sm:w-64 pl-10 h-10 bg-slate-950 border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500/50 transition-colors"
                                        />
                                    </form>
                                    <BulkImportTool fixedClubId={club.id} fixedClubName={club.name} />
                                    <ManageClubPlayerDialog clubId={club.id} allClubs={isAdmin ? allClubs : undefined} />
                                </div>
                            </div>

                            <div className="p-0">
                                <Table>
                                    <TableHeader className="bg-slate-950/50">
                                        <TableRow className="border-slate-800 hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest pl-6">Deportista</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">IDC / RUT</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Nivel Federativo</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Estado</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {(() => {
                                            const filteredPlayers = club.players.filter(p => {
                                                if (!searchQuery) return true;
                                                const fullName = `${p.firstName || ''} ${p.lastName || ''}`.toLowerCase();
                                                const userName = p.user?.name?.toLowerCase() || '';
                                                return fullName.includes(searchQuery) || userName.includes(searchQuery) || p.rut?.includes(searchQuery);
                                            });

                                            if (filteredPlayers.length === 0) {
                                                return (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="h-32 text-center text-slate-600 font-mono text-xs italic">
                                                            {searchQuery ? "No se encontraron deportistas que coincidan con la búsqueda." : "No hay deportistas vinculados a esta sede."}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }

                                            return filteredPlayers.map((player: any) => (
                                                <TableRow key={player.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors group">
                                                    <TableCell className="pl-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                                                                <User className="w-4 h-4" />
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-bold text-white uppercase">
                                                                    {player.user?.name || (player.firstName ? `${player.firstName} ${player.lastName}` : player.slug.split('-').slice(0, 2).join(' ').toUpperCase())}
                                                                </p>
                                                                <p className="text-[9px] text-slate-600 font-mono">
                                                                    {player.user?.email || player.email || "📧 SIN CORREO REGISTRADO"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-mono text-xs text-slate-400">
                                                        {player.rut || player.id.substring(0,8).toUpperCase()}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col gap-2">
                                                            {player.rankings?.map((ranking: any) => (
                                                                <div key={`${ranking.discipline}-${ranking.category}`} className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-500/20 text-emerald-400 bg-emerald-500/5">
                                                                        {ranking.category || 'SIN CATEGORÍA'}
                                                                    </Badge>
                                                                    <span className="text-[9px] text-slate-500 font-bold uppercase">{ranking.discipline.replace('_', ' ')}</span>
                                                                </div>
                                                            ))}
                                                            {(!player.rankings || player.rankings.length === 0) && (
                                                                <span className="text-[9px] text-slate-600 italic">Sin disciplinas registradas</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {player.userId ? (
                                                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none text-[8px] font-black uppercase px-2 py-0.5">
                                                                Activo
                                                            </Badge>
                                                        ) : (
                                                            <ClaimPlayerDialog 
                                                                playerId={player.id} 
                                                                playerName={player.user?.name || player.slug.split('-').slice(0, 2).join(' ').toUpperCase()} 
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="pr-6">
                                                        <ManageClubPlayerDialog clubId={club.id} player={player} allClubs={isAdmin ? allClubs : undefined} />
                                                    </TableCell>
                                                </TableRow>
                                            ));
                                        })()}
                                    </TableBody>
                                </Table>
                            </div>
                        </section>
                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-slate-900/50 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <CardHeader className="border-b border-slate-800 bg-slate-900/80">
                                    <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                        Delegados SGF
                                    </CardTitle>
                                    <CardDescription className="text-[10px] uppercase font-mono tracking-tighter">Usuarios con acceso al sistema</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {club.delegates.length > 0 ? (
                                        club.delegates.map((d) => (
                                            <div key={d.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                                                        {d.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-white uppercase">{d.name}</p>
                                                        <p className="text-[9px] text-slate-600 font-mono">{d.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-slate-600 text-xs py-4 font-mono italic">Sin delegados asignados.</p>
                                    )}
                                    <Button variant="ghost" className="w-full text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] hover:bg-blue-500/5">
                                        Gestionar Accesos <ChevronRight className="w-3 h-3 ml-1" />
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-slate-900/50 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                                <CardHeader className="border-b border-slate-800 bg-slate-900/80">
                                    <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                        <Trophy className="w-4 h-4 text-amber-500" />
                                        Métricas Activas
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Jugadores</p>
                                        <p className="text-2xl font-black text-white">{club._count.players}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Torneos</p>
                                        <p className="text-2xl font-black text-white">{club._count.hostedTournaments}</p>
                                    </div>
                                    <div className="col-span-2 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                                        <p className="text-[9px] font-black text-slate-600 uppercase mb-1">Status Federativo</p>
                                        <p className="text-xs font-black text-emerald-500 tracking-[0.2em] uppercase">Club al día</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </section>
                    </div>

                    {/* Sidebar: Infraestructura Técnica */}
                    <aside className="space-y-8">
                        <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80">
                                <div>
                                    <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 uppercase">
                                        <Building2 className="w-5 h-5 text-blue-500" />
                                        Infraestructura
                                    </h2>
                                    <p className="text-[9px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">Stock de Mesas</p>
                                </div>
                                <div className="shrink-0">
                                    <ManageInfrastructureDialog clubId={club.id} currentInfrastructure={infrastructure} />
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                {infrastructure.length > 0 ? (
                                    infrastructure.map((item: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800 group hover:border-blue-500/30 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-500/5 flex items-center justify-center text-blue-500">
                                                    <Info className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase">{item.type}</p>
                                                    <p className="text-[10px] text-slate-500 font-mono">Mesas oficiales</p>
                                                </div>
                                            </div>
                                            <span className="text-2xl font-black text-blue-500">{item.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-600 text-xs font-mono italic">Sin inventario registrado.</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Panel de Ayuda / Info */}
                        <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                            <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                SGF Federación
                            </h4>
                            <p className="text-[10px] text-slate-500 leading-relaxed font-mono uppercase">
                                Esta ficha maestra centraliza la información técnica y administrativa del club. Cualquier cambio en la directiva debe ser validado con el acta correspondiente subida al sistema.
                            </p>
                        </div>
                    </aside>

                </div>
            </div>
        </main>
    );
}
