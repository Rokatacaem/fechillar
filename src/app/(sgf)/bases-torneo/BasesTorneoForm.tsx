"use client";

import { useState, useCallback } from "react";
import { ChevronDown, ChevronUp, Download, Loader2 } from "lucide-react";

const DIAS = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

function diaSemana(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return DIAS[new Date(y, m - 1, d).getDay()];
}

function Section({ title, open, toggle, children }: {
  title: string; open: boolean; toggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-900/60 hover:bg-slate-800/60 transition-colors text-left"
      >
        <span className="font-bold text-white text-sm uppercase tracking-widest">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-5 py-5 space-y-4 bg-slate-900/30">{children}</div>}
    </div>
  );
}

function Field({ label, required, children, hint }: {
  label: string; required?: boolean; children: React.ReactNode; hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest">
        {label}{required && <span className="text-rose-400 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

const inp = "w-full bg-slate-800/80 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50 transition-colors";
const sel = inp;

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

export function BasesTorneoForm() {
  // ──────── ESTADO ────────
  const [open, setOpen] = useState<Record<string, boolean>>({ general: true });
  const toggle = (key: string) => setOpen(p => ({ ...p, [key]: !p[key] }));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // General
  const [nombreTorneo, setNombreTorneo] = useState("TORNEO NACIONAL DE BILLAR");
  const [modalidad, setModalidad] = useState("TRES BANDAS CON HANDICAP");
  const [tipoHandicap, setTipoHandicap] = useState("sin_handicap");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // Sede
  const [nombreSede, setNombreSede] = useState("");
  const [direccionSede, setDireccionSede] = useState("");
  const [capacidadMaxima, setCapacidadMaxima] = useState(54);
  const [numeroMesas, setNumeroMesas] = useState(6);
  const [turnosRotativos, setTurnosRotativos] = useState(3);

  // Inscripción
  const [valorInscripcion, setValorInscripcion] = useState(30000);
  const [plazoInscripcion, setPlazoInscripcion] = useState("48 horas antes del evento");

  // Banco
  const [beneficiario, setBeneficiario] = useState("Rodrigo Zúñiga");
  const [rutBeneficiario, setRutBeneficiario] = useState("13.290.807-9");
  const [banco, setBanco] = useState("Scotiabank");
  const [tipoCuenta, setTipoCuenta] = useState("Cuenta Corriente");
  const [numeroCuenta, setNumeroCuenta] = useState("986610642");
  const [emailContacto, setEmailContacto] = useState("rokataca@gmail.com");

  // Formato
  const [cantidadGrupos, setCantidadGrupos] = useState(18);
  const [jugadoresPorGrupo, setJugadoresPorGrupo] = useState(3);
  const [sistemaGrupos, setSistemaGrupos] = useState("round-robin");
  const [clasificadosPorGrupo, setClasificadosPorGrupo] = useState(2);

  const [tienePlayoff, setTienePlayoff] = useState(true);
  const [clasificacionDirectaHasta, setClasificacionDirectaHasta] = useState(28);
  const [cuposPlayoff, setCuposPlayoff] = useState(4);

  const [tipoEliminatoria, setTipoEliminatoria] = useState("simple");
  const [jugadoresLlaveInicial, setJugadoresLlaveInicial] = useState(32);
  const [tieneTercerLugar, setTieneTercerLugar] = useState(true);

  // Reglas
  const [carambolas1, setCarambolas1] = useState(25);
  const [entradas1, setEntradas1] = useState(35);
  const [carambolas2, setCarambolas2] = useState(25);
  const [entradas2, setEntradas2] = useState(35);
  const [carambolas3, setCarambolas3] = useState(30);
  const [entradas3, setEntradas3] = useState(0);

  // Fondos
  const [montoPremios, setMontoPremios] = useState(20000);
  const [montoMesaTecnica, setMontoMesaTecnica] = useState(5000);
  const [tieneFondoEspecial, setTieneFondoEspecial] = useState(true);
  const [nombreFondoEspecial, setNombreFondoEspecial] = useState("Fondo de Apoyo a Jugadores Panamericanos 2027");
  const [montoFondoEspecial, setMontoFondoEspecial] = useState(5000);

  const [p1, setP1] = useState(35);
  const [p2, setP2] = useState(25);
  const [p3, setP3] = useState(12);
  const [p4, setP4] = useState(12);
  const [p5, setP5] = useState(4);
  const [p6, setP6] = useState(4);
  const [p7, setP7] = useState(4);
  const [p8, setP8] = useState(4);

  // Vestimenta
  const [tipoUniforme, setTipoUniforme] = useState("Clase B");
  const [descSuperior, setDescSuperior] = useState("Polo del club o polo deportivo de color sobrio");
  const [descPantalon, setDescPantalon] = useState("Pantalón de vestir (no jeans, no deportivos)");
  const [descCalzado, setDescCalzado] = useState("Zapatos negros formales o zapatillas deportivas negras");

  // Programación
  const [d1AcredIni, setD1AcredIni] = useState("09:00");
  const [d1AcredFin, setD1AcredFin] = useState("09:30");
  const [d1GruposIni, setD1GruposIni] = useState("10:00");
  const [d1GruposFin, setD1GruposFin] = useState("18:00");
  const [d1PlayoffIni, setD1PlayoffIni] = useState("18:30");
  const [d1PlayoffFin, setD1PlayoffFin] = useState("21:00");

  const [d2DiecisIni, setD2DiecisIni] = useState("10:00");
  const [d2DiecisFin, setD2DiecisFin] = useState("14:00");
  const [d2CuartosIni, setD2CuartosIni] = useState("15:00");
  const [d2CuartosFin, setD2CuartosFin] = useState("17:00");
  const [d2SemiIni, setD2SemiIni] = useState("17:30");
  const [d2SemiFin, setD2SemiFin] = useState("19:30");
  const [d2FinalIni, setD2FinalIni] = useState("20:00");
  const [d2FinalFin, setD2FinalFin] = useState("22:00");

  // Servicios
  const [tieneCafeteria, setTieneCafeteria] = useState(true);
  const [estacionamiento, setEstacionamiento] = useState("Limitado");
  const [tieneWifi, setTieneWifi] = useState(true);
  const [tieneTransmision, setTieneTransmision] = useState(false);
  const [plataformaTransmision, setPlataformaTransmision] = useState("");

  // Contacto
  const [emailOrganizador, setEmailOrganizador] = useState("rokataca@gmail.com");
  const [directorTorneo, setDirectorTorneo] = useState("Designado por FECHILLAR");
  const [entidadOrganizadora, setEntidadOrganizadora] = useState("FECHILLAR");
  const [colaboradores, setColaboradores] = useState("Club de Billar Santiago, Instituto Nacional de Deportes");

  // Desempate
  const [crit1, setCrit1] = useState("Puntos");
  const [crit2, setCrit2] = useState("Promedio General (PGP)");
  const [crit3, setCrit3] = useState("Promedio Particular");
  const [crit4, setCrit4] = useState("Mejor Tacada");
  const [crit5, setCrit5] = useState("Orden Cronológico de Mejor Tacada");

  // Sanciones
  const [toleranciaMinutos, setToleranciaMinutos] = useState(10);
  const [sancionVestimenta, setSancionVestimenta] = useState("Advertencia / No permitir jugar");
  const [sancionRetraso, setSancionRetraso] = useState("W.O. después de 10 minutos");

  // ──────── CALCULOS ────────
  const sumaPremios = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8;
  const sumaFondos = montoPremios + montoMesaTecnica + (tieneFondoEspecial ? montoFondoEspecial : 0);
  const pozoTotal = capacidadMaxima * montoPremios;
  const totalClasificados = cantidadGrupos * clasificadosPorGrupo;

  // ──────── SUBMIT ────────
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (Math.abs(sumaPremios - 100) > 0.1) {
      setError(`La suma de porcentajes de premios debe ser 100% (actualmente: ${sumaPremios.toFixed(1)}%)`);
      return;
    }
    if (sumaFondos !== valorInscripcion) {
      setError(`La distribución de fondos debe sumar exactamente $${valorInscripcion.toLocaleString("es-CL")} (actualmente: $${sumaFondos.toLocaleString("es-CL")})`);
      return;
    }

    const payload = {
      informacion_general: {
        nombre_torneo: nombreTorneo,
        modalidad,
        tipo_handicap: tipoHandicap,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        año_evento: fechaInicio ? parseInt(fechaInicio.split("-")[0]) : new Date().getFullYear(),
      },
      sede: {
        nombre_sede: nombreSede,
        direccion_sede: direccionSede,
        capacidad_maxima: capacidadMaxima,
        numero_mesas: numeroMesas,
        turnos_rotativos: turnosRotativos,
      },
      inscripcion: {
        valor_inscripcion: valorInscripcion,
        cupos_maximos: capacidadMaxima,
        plazo_inscripcion: plazoInscripcion,
      },
      datos_bancarios: {
        beneficiario,
        rut_beneficiario: rutBeneficiario,
        banco,
        tipo_cuenta: tipoCuenta,
        numero_cuenta: numeroCuenta,
        email_contacto: emailContacto,
      },
      formato_torneo: {
        fase_grupos: {
          cantidad_grupos: cantidadGrupos,
          jugadores_por_grupo: jugadoresPorGrupo,
          sistema_grupos: sistemaGrupos,
          clasificados_por_grupo: clasificadosPorGrupo,
        },
        playoff: {
          tiene_playoff: tienePlayoff,
          clasificacion_directa_hasta: clasificacionDirectaHasta,
          cupos_playoff: cuposPlayoff,
        },
        eliminatoria: {
          tipo_eliminatoria: tipoEliminatoria,
          jugadores_llave_inicial: jugadoresLlaveInicial,
          tiene_tercer_lugar: tieneTercerLugar,
        },
      },
      reglas_juego: {
        carambolas_grupos: carambolas1,
        entradas_grupos: entradas1,
        carambolas_eliminatorias: carambolas2,
        entradas_eliminatorias: entradas2,
        carambolas_final: carambolas3,
        entradas_final: entradas3,
      },
      fondos: {
        monto_premios: montoPremios,
        monto_mesa_tecnica: montoMesaTecnica,
        tiene_fondo_especial: tieneFondoEspecial,
        nombre_fondo_especial: nombreFondoEspecial,
        monto_fondo_especial: montoFondoEspecial,
      },
      premios: {
        premio_1ro: p1, premio_2do: p2, premio_3ro: p3, premio_4to: p4,
        premio_5to: p5, premio_6to: p6, premio_7mo: p7, premio_8vo: p8,
      },
      vestimenta: {
        tipo_uniforme: tipoUniforme,
        descripcion_superior: descSuperior,
        descripcion_pantalon: descPantalon,
        descripcion_calzado: descCalzado,
      },
      programacion: {
        dia1: {
          acreditacion_inicio: d1AcredIni, acreditacion_fin: d1AcredFin,
          grupos_inicio: d1GruposIni, grupos_fin: d1GruposFin,
          playoff_inicio: tienePlayoff ? d1PlayoffIni : undefined,
          playoff_fin: tienePlayoff ? d1PlayoffFin : undefined,
        },
        dia2: {
          dieciseisavos_inicio: jugadoresLlaveInicial >= 32 ? d2DiecisIni : undefined,
          dieciseisavos_fin: jugadoresLlaveInicial >= 32 ? d2DiecisFin : undefined,
          cuartos_inicio: d2CuartosIni, cuartos_fin: d2CuartosFin,
          semifinales_inicio: d2SemiIni, semifinales_fin: d2SemiFin,
          final_inicio: d2FinalIni, final_fin: d2FinalFin,
        },
      },
      servicios: {
        tiene_cafeteria: tieneCafeteria,
        estacionamiento,
        tiene_wifi: tieneWifi,
        tiene_transmision: tieneTransmision,
        plataforma_transmision: plataformaTransmision,
      },
      contacto: {
        email_organizador: emailOrganizador,
        director_torneo: directorTorneo,
        entidad_organizadora: entidadOrganizadora,
        colaboradores: colaboradores.split(",").map((s: string) => s.trim()).filter(Boolean),
      },
      desempate: {
        criterio_1: crit1, criterio_2: crit2, criterio_3: crit3,
        criterio_4: crit4, criterio_5: crit5,
      },
      sanciones: {
        tolerancia_retraso_minutos: toleranciaMinutos,
        sancion_vestimenta: sancionVestimenta,
        sancion_retraso: sancionRetraso,
      },
    };

    setLoading(true);
    try {
      const res = await fetch("/api/bases-torneo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Error al generar documento");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bases_${(nombreSede || "Torneo").replace(/\s+/g, "_")}_${payload.informacion_general.año_evento}.docx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    nombreTorneo, modalidad, tipoHandicap, fechaInicio, fechaFin,
    nombreSede, direccionSede, capacidadMaxima, numeroMesas, turnosRotativos,
    valorInscripcion, plazoInscripcion,
    beneficiario, rutBeneficiario, banco, tipoCuenta, numeroCuenta, emailContacto,
    cantidadGrupos, jugadoresPorGrupo, sistemaGrupos, clasificadosPorGrupo,
    tienePlayoff, clasificacionDirectaHasta, cuposPlayoff,
    tipoEliminatoria, jugadoresLlaveInicial, tieneTercerLugar,
    carambolas1, entradas1, carambolas2, entradas2, carambolas3, entradas3,
    montoPremios, montoMesaTecnica, tieneFondoEspecial, nombreFondoEspecial, montoFondoEspecial,
    p1, p2, p3, p4, p5, p6, p7, p8,
    tipoUniforme, descSuperior, descPantalon, descCalzado,
    d1AcredIni, d1AcredFin, d1GruposIni, d1GruposFin, d1PlayoffIni, d1PlayoffFin,
    d2DiecisIni, d2DiecisFin, d2CuartosIni, d2CuartosFin, d2SemiIni, d2SemiFin, d2FinalIni, d2FinalFin,
    tieneCafeteria, estacionamiento, tieneWifi, tieneTransmision, plataformaTransmision,
    emailOrganizador, directorTorneo, entidadOrganizadora, colaboradores,
    crit1, crit2, crit3, crit4, crit5,
    toleranciaMinutos, sancionVestimenta, sancionRetraso,
    sumaPremios, sumaFondos, pozoTotal,
  ]);

  // ──────── RENDER ────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ─── 1. GENERAL ─── */}
      <Section title="1. Información General del Evento" open={!!open.general} toggle={() => toggle("general")}>
        <Field label="Nombre del Torneo" required>
          <input className={inp} value={nombreTorneo} onChange={e => setNombreTorneo(e.target.value)} required />
        </Field>
        <Field label="Modalidad" required>
          <input className={inp} value={modalidad} onChange={e => setModalidad(e.target.value)} required />
        </Field>
        <Field label="Tipo de Hándicap" required>
          <select className={sel} value={tipoHandicap} onChange={e => setTipoHandicap(e.target.value)}>
            <option value="sin_handicap">Sin Hándicap</option>
            <option value="con_handicap">Con Hándicap</option>
            <option value="nacional">Sistema Nacional</option>
          </select>
        </Field>
        <Row>
          <Field label="Fecha de Inicio" required>
            <input type="date" className={inp} value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} required />
            {fechaInicio && <p className="text-[10px] text-violet-400 mt-1">{diaSemana(fechaInicio)}</p>}
          </Field>
          <Field label="Fecha de Término" required>
            <input type="date" className={inp} value={fechaFin} onChange={e => setFechaFin(e.target.value)} required />
            {fechaFin && <p className="text-[10px] text-violet-400 mt-1">{diaSemana(fechaFin)}</p>}
          </Field>
        </Row>
      </Section>

      {/* ─── 2. SEDE ─── */}
      <Section title="2. Sede y Logística" open={!!open.sede} toggle={() => toggle("sede")}>
        <Field label="Nombre de la Sede" required>
          <input className={inp} value={nombreSede} onChange={e => setNombreSede(e.target.value)} required placeholder="Ej: Club de Billar Santiago" />
        </Field>
        <Field label="Dirección" required>
          <input className={inp} value={direccionSede} onChange={e => setDireccionSede(e.target.value)} required placeholder="Ej: San Diego 1414, Santiago" />
        </Field>
        <Row>
          <Field label="Capacidad Máxima" required hint={`${cantidadGrupos} grupos × ${jugadoresPorGrupo} jugadores = ${cantidadGrupos * jugadoresPorGrupo}`}>
            <input type="number" className={inp} value={capacidadMaxima} onChange={e => setCapacidadMaxima(Number(e.target.value))} min={8} max={256} required />
          </Field>
          <Field label="N° de Mesas" required>
            <input type="number" className={inp} value={numeroMesas} onChange={e => setNumeroMesas(Number(e.target.value))} min={1} max={30} required />
          </Field>
        </Row>
        <Field label="Turnos Rotativos" required>
          <input type="number" className={inp} value={turnosRotativos} onChange={e => setTurnosRotativos(Number(e.target.value))} min={1} max={10} required />
        </Field>
      </Section>

      {/* ─── 3. INSCRIPCIÓN ─── */}
      <Section title="3. Inscripción y Costos" open={!!open.insc} toggle={() => toggle("insc")}>
        <Field label="Valor de Inscripción (CLP)" required>
          <input type="number" className={inp} value={valorInscripcion} onChange={e => setValorInscripcion(Number(e.target.value))} min={0} step={1000} required />
        </Field>
        <Field label="Plazo de Inscripción" required>
          <input className={inp} value={plazoInscripcion} onChange={e => setPlazoInscripcion(e.target.value)} required />
        </Field>
      </Section>

      {/* ─── 4. BANCO ─── */}
      <Section title="4. Datos Bancarios" open={!!open.banco} toggle={() => toggle("banco")}>
        <Row>
          <Field label="Beneficiario" required>
            <input className={inp} value={beneficiario} onChange={e => setBeneficiario(e.target.value)} required />
          </Field>
          <Field label="RUT" required>
            <input className={inp} value={rutBeneficiario} onChange={e => setRutBeneficiario(e.target.value)} required placeholder="XX.XXX.XXX-X" />
          </Field>
        </Row>
        <Row>
          <Field label="Banco" required>
            <select className={sel} value={banco} onChange={e => setBanco(e.target.value)}>
              {["Banco de Chile","Banco Estado","Scotiabank","BCI","Santander","Itaú","BICE","Otro"].map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Tipo de Cuenta" required>
            <select className={sel} value={tipoCuenta} onChange={e => setTipoCuenta(e.target.value)}>
              <option>Cuenta Corriente</option>
              <option>Cuenta Vista</option>
              <option>Cuenta RUT</option>
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="N° de Cuenta" required>
            <input className={inp} value={numeroCuenta} onChange={e => setNumeroCuenta(e.target.value)} required />
          </Field>
          <Field label="Email para comprobantes" required>
            <input type="email" className={inp} value={emailContacto} onChange={e => setEmailContacto(e.target.value)} required />
          </Field>
        </Row>
      </Section>

      {/* ─── 5. FORMATO ─── */}
      <Section title="5. Formato del Torneo" open={!!open.formato} toggle={() => toggle("formato")}>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fase de Grupos</p>
        <Row>
          <Field label="Cantidad de Grupos" required>
            <input type="number" className={inp} value={cantidadGrupos} onChange={e => setCantidadGrupos(Number(e.target.value))} min={2} max={64} required />
          </Field>
          <Field label="Jugadores por Grupo" required>
            <select className={sel} value={jugadoresPorGrupo} onChange={e => setJugadoresPorGrupo(Number(e.target.value))}>
              <option value={3}>3 jugadores</option>
              <option value={4}>4 jugadores</option>
              <option value={5}>5 jugadores</option>
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Sistema de Grupos" required>
            <select className={sel} value={sistemaGrupos} onChange={e => setSistemaGrupos(e.target.value)}>
              <option value="round-robin">Round-Robin (todos contra todos)</option>
              <option value="suizo">Sistema Suizo</option>
            </select>
          </Field>
          <Field label="Clasificados por Grupo" required>
            <input type="number" className={inp} value={clasificadosPorGrupo} onChange={e => setClasificadosPorGrupo(Number(e.target.value))} min={1} max={4} required />
          </Field>
        </Row>
        <div className="text-xs text-violet-300 font-bold bg-violet-900/20 rounded-xl px-4 py-2 border border-violet-500/20">
          Total clasificados: {totalClasificados} jugadores
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Fase de Ajuste (Playoff)</p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={tienePlayoff} onChange={e => setTienePlayoff(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-slate-300">Incluir fase de playoff</span>
          </label>
          {tienePlayoff && (
            <Row>
              <Field label="Clasificación directa hasta puesto">
                <input type="number" className={inp} value={clasificacionDirectaHasta} onChange={e => setClasificacionDirectaHasta(Number(e.target.value))} min={1} />
              </Field>
              <Field label="Cupos en disputa en playoff">
                <input type="number" className={inp} value={cuposPlayoff} onChange={e => setCuposPlayoff(Number(e.target.value))} min={2} max={16} />
              </Field>
            </Row>
          )}
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Fase Eliminatoria</p>
          <Row>
            <Field label="Tipo de Eliminatoria" required>
              <select className={sel} value={tipoEliminatoria} onChange={e => setTipoEliminatoria(e.target.value)}>
                <option value="simple">Eliminación Simple</option>
                <option value="doble">Doble Eliminación</option>
              </select>
            </Field>
            <Field label="Jugadores en Llave Inicial" required>
              <select className={sel} value={jugadoresLlaveInicial} onChange={e => setJugadoresLlaveInicial(Number(e.target.value))}>
                <option value={8}>8 jugadores</option>
                <option value={16}>16 jugadores</option>
                <option value={32}>32 jugadores</option>
                <option value={64}>64 jugadores</option>
              </select>
            </Field>
          </Row>
          <label className="flex items-center gap-3 cursor-pointer mt-2">
            <input type="checkbox" checked={tieneTercerLugar} onChange={e => setTieneTercerLugar(e.target.checked)} className="w-4 h-4 accent-violet-500" />
            <span className="text-sm text-slate-300">Incluir partido por el 3er lugar</span>
          </label>
        </div>
      </Section>

      {/* ─── 6. REGLAS ─── */}
      <Section title="6. Reglas de Juego" open={!!open.reglas} toggle={() => toggle("reglas")}>
        {[
          { label: "Fase de Grupos", c: carambolas1, setC: setCarambolas1, e: entradas1, setE: setEntradas1 },
          { label: "Fase Eliminatoria", c: carambolas2, setC: setCarambolas2, e: entradas2, setE: setEntradas2 },
          { label: "Gran Final", c: carambolas3, setC: setCarambolas3, e: entradas3, setE: setEntradas3 },
        ].map(({ label, c, setC, e, setE }) => (
          <div key={label}>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">{label}</p>
            <Row>
              <Field label="Carambolas" required>
                <input type="number" className={inp} value={c} onChange={ev => setC(Number(ev.target.value))} min={1} max={200} required />
              </Field>
              <Field label="Tope de Entradas" required hint="0 = sin límite">
                <input type="number" className={inp} value={e} onChange={ev => setE(Number(ev.target.value))} min={0} max={500} required />
              </Field>
            </Row>
          </div>
        ))}
      </Section>

      {/* ─── 7. FONDOS ─── */}
      <Section title="7. Distribución de Fondos" open={!!open.fondos} toggle={() => toggle("fondos")}>
        <Row>
          <Field label="Monto a Premios por Inscripción (CLP)" required>
            <input type="number" className={inp} value={montoPremios} onChange={e => setMontoPremios(Number(e.target.value))} min={0} step={1000} required />
          </Field>
          <Field label="Mesa Técnica / Trofeos (CLP)" required>
            <input type="number" className={inp} value={montoMesaTecnica} onChange={e => setMontoMesaTecnica(Number(e.target.value))} min={0} step={1000} required />
          </Field>
        </Row>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={tieneFondoEspecial} onChange={e => setTieneFondoEspecial(e.target.checked)} className="w-4 h-4 accent-violet-500" />
          <span className="text-sm text-slate-300">Incluir fondo especial</span>
        </label>
        {tieneFondoEspecial && (
          <Row>
            <Field label="Nombre del Fondo Especial">
              <input className={inp} value={nombreFondoEspecial} onChange={e => setNombreFondoEspecial(e.target.value)} />
            </Field>
            <Field label="Monto (CLP)">
              <input type="number" className={inp} value={montoFondoEspecial} onChange={e => setMontoFondoEspecial(Number(e.target.value))} min={0} step={1000} />
            </Field>
          </Row>
        )}
        <div className={`text-xs font-bold rounded-xl px-4 py-2 border ${sumaFondos === valorInscripcion ? "bg-emerald-900/20 border-emerald-500/20 text-emerald-400" : "bg-rose-900/20 border-rose-500/20 text-rose-400"}`}>
          Suma fondos: ${sumaFondos.toLocaleString("es-CL")} CLP
          {sumaFondos !== valorInscripcion && ` · Debe ser $${valorInscripcion.toLocaleString("es-CL")}`}
          {sumaFondos === valorInscripcion && " · ✓ Correcto"}
        </div>

        <div className="border-t border-white/10 pt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">Distribución de Premios (%)</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              ["🥇 1er lugar", p1, setP1],
              ["🥈 2do lugar", p2, setP2],
              ["🥉 3er lugar", p3, setP3],
              ["4to lugar", p4, setP4],
              ["5to lugar", p5, setP5],
              ["6to lugar", p6, setP6],
              ["7mo lugar", p7, setP7],
              ["8vo lugar", p8, setP8],
            ].map(([label, val, setter]) => (
              <div key={label as string} className="space-y-1">
                <label className="text-[10px] text-slate-400 font-bold">{label as string}</label>
                <input
                  type="number"
                  className={inp}
                  value={val as number}
                  onChange={e => (setter as Function)(Number(e.target.value))}
                  min={0} max={100} step={0.5}
                />
              </div>
            ))}
          </div>
          <div className={`mt-3 text-xs font-bold rounded-xl px-4 py-2 border ${Math.abs(sumaPremios - 100) < 0.1 ? "bg-emerald-900/20 border-emerald-500/20 text-emerald-400" : "bg-rose-900/20 border-rose-500/20 text-rose-400"}`}>
            Total: {sumaPremios.toFixed(1)}%
            {Math.abs(sumaPremios - 100) < 0.1 ? " · ✓ Correcto" : " · Debe ser 100%"}
          </div>
          <div className="mt-2 text-xs text-slate-500 font-bold">
            Pozo total estimado: ${pozoTotal.toLocaleString("es-CL")} CLP ({capacidadMaxima} jugadores × ${montoPremios.toLocaleString("es-CL")})
          </div>
        </div>
      </Section>

      {/* ─── 8. VESTIMENTA ─── */}
      <Section title="8. Código de Vestimenta" open={!!open.vest} toggle={() => toggle("vest")}>
        <Field label="Tipo de Uniforme" required>
          <select className={sel} value={tipoUniforme} onChange={e => setTipoUniforme(e.target.value)}>
            <option value="Clase A">Clase A (Formal)</option>
            <option value="Clase B">Clase B (Semi-formal)</option>
            <option value="Clase C">Clase C (Deportivo)</option>
          </select>
        </Field>
        <Field label="Prenda Superior" required>
          <input className={inp} value={descSuperior} onChange={e => setDescSuperior(e.target.value)} required />
        </Field>
        <Field label="Pantalón" required>
          <input className={inp} value={descPantalon} onChange={e => setDescPantalon(e.target.value)} required />
        </Field>
        <Field label="Calzado" required>
          <input className={inp} value={descCalzado} onChange={e => setDescCalzado(e.target.value)} required />
        </Field>
      </Section>

      {/* ─── 9. PROGRAMACIÓN ─── */}
      <Section title="9. Programación del Evento" open={!!open.prog} toggle={() => toggle("prog")}>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
          Día 1 {fechaInicio ? `— ${diaSemana(fechaInicio)} ${fechaInicio.split("-").reverse().slice(0,2).join("/")}` : ""}
        </p>
        <Row>
          <Field label="Acreditación inicio"><input type="time" className={inp} value={d1AcredIni} onChange={e => setD1AcredIni(e.target.value)} /></Field>
          <Field label="Acreditación fin"><input type="time" className={inp} value={d1AcredFin} onChange={e => setD1AcredFin(e.target.value)} /></Field>
        </Row>
        <Row>
          <Field label="Grupos inicio"><input type="time" className={inp} value={d1GruposIni} onChange={e => setD1GruposIni(e.target.value)} /></Field>
          <Field label="Grupos fin"><input type="time" className={inp} value={d1GruposFin} onChange={e => setD1GruposFin(e.target.value)} /></Field>
        </Row>
        {tienePlayoff && (
          <Row>
            <Field label="Playoff inicio"><input type="time" className={inp} value={d1PlayoffIni} onChange={e => setD1PlayoffIni(e.target.value)} /></Field>
            <Field label="Playoff fin"><input type="time" className={inp} value={d1PlayoffFin} onChange={e => setD1PlayoffFin(e.target.value)} /></Field>
          </Row>
        )}

        <div className="border-t border-white/10 pt-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Día 2 {fechaFin ? `— ${diaSemana(fechaFin)} ${fechaFin.split("-").reverse().slice(0,2).join("/")}` : ""}
          </p>
          {jugadoresLlaveInicial >= 32 && (
            <Row>
              <Field label="Dieciseisavos inicio"><input type="time" className={inp} value={d2DiecisIni} onChange={e => setD2DiecisIni(e.target.value)} /></Field>
              <Field label="Dieciseisavos fin"><input type="time" className={inp} value={d2DiecisFin} onChange={e => setD2DiecisFin(e.target.value)} /></Field>
            </Row>
          )}
          <Row>
            <Field label="Cuartos inicio"><input type="time" className={inp} value={d2CuartosIni} onChange={e => setD2CuartosIni(e.target.value)} /></Field>
            <Field label="Cuartos fin"><input type="time" className={inp} value={d2CuartosFin} onChange={e => setD2CuartosFin(e.target.value)} /></Field>
          </Row>
          <Row>
            <Field label="Semifinales inicio"><input type="time" className={inp} value={d2SemiIni} onChange={e => setD2SemiIni(e.target.value)} /></Field>
            <Field label="Semifinales fin"><input type="time" className={inp} value={d2SemiFin} onChange={e => setD2SemiFin(e.target.value)} /></Field>
          </Row>
          <Row>
            <Field label="Final inicio"><input type="time" className={inp} value={d2FinalIni} onChange={e => setD2FinalIni(e.target.value)} /></Field>
            <Field label="Final fin"><input type="time" className={inp} value={d2FinalFin} onChange={e => setD2FinalFin(e.target.value)} /></Field>
          </Row>
        </div>
      </Section>

      {/* ─── 10. SERVICIOS ─── */}
      <Section title="10. Servicios y Facilidades" open={!!open.servicios} toggle={() => toggle("servicios")}>
        <div className="space-y-3">
          {[
            { label: "Cafetería disponible", val: tieneCafeteria, set: setTieneCafeteria },
            { label: "Wi-Fi gratuito", val: tieneWifi, set: setTieneWifi },
            { label: "Transmisión en vivo", val: tieneTransmision, set: setTieneTransmision },
          ].map(({ label, val, set }) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={val} onChange={e => set(e.target.checked)} className="w-4 h-4 accent-violet-500" />
              <span className="text-sm text-slate-300">{label}</span>
            </label>
          ))}
        </div>
        <Field label="Estacionamiento" required>
          <select className={sel} value={estacionamiento} onChange={e => setEstacionamiento(e.target.value)}>
            <option>Amplio</option>
            <option>Limitado</option>
            <option>No disponible</option>
          </select>
        </Field>
        {tieneTransmision && (
          <Field label="Plataforma de transmisión">
            <input className={inp} value={plataformaTransmision} onChange={e => setPlataformaTransmision(e.target.value)} placeholder="YouTube, Facebook Live, Por confirmar..." />
          </Field>
        )}
      </Section>

      {/* ─── 11. CONTACTO ─── */}
      <Section title="11. Información de Contacto" open={!!open.contacto} toggle={() => toggle("contacto")}>
        <Row>
          <Field label="Email del Organizador" required>
            <input type="email" className={inp} value={emailOrganizador} onChange={e => setEmailOrganizador(e.target.value)} required />
          </Field>
          <Field label="Director del Torneo">
            <input className={inp} value={directorTorneo} onChange={e => setDirectorTorneo(e.target.value)} />
          </Field>
        </Row>
        <Row>
          <Field label="Entidad Organizadora" required>
            <input className={inp} value={entidadOrganizadora} onChange={e => setEntidadOrganizadora(e.target.value)} required />
          </Field>
        </Row>
        <Field label="Colaboradores (separados por coma)">
          <textarea className={`${inp} resize-none`} rows={2} value={colaboradores} onChange={e => setColaboradores(e.target.value)} />
        </Field>
      </Section>

      {/* ─── 12. DESEMPATE ─── */}
      <Section title="12. Criterios de Desempate" open={!!open.desempate} toggle={() => toggle("desempate")}>
        {[
          ["Criterio 1 (mayor prioridad)", crit1, setCrit1],
          ["Criterio 2", crit2, setCrit2],
          ["Criterio 3", crit3, setCrit3],
          ["Criterio 4", crit4, setCrit4],
          ["Criterio 5", crit5, setCrit5],
        ].map(([label, val, setter]) => (
          <Field key={label as string} label={label as string} required>
            <input className={inp} value={val as string} onChange={e => (setter as Function)(e.target.value)} required />
          </Field>
        ))}
      </Section>

      {/* ─── 13. SANCIONES ─── */}
      <Section title="13. Sanciones" open={!!open.sanciones} toggle={() => toggle("sanciones")}>
        <Field label="Tolerancia de retraso (minutos)" required>
          <input type="number" className={inp} value={toleranciaMinutos} onChange={e => setToleranciaMinutos(Number(e.target.value))} min={0} max={30} required />
        </Field>
        <Field label="Sanción por vestimenta inadecuada" required>
          <input className={inp} value={sancionVestimenta} onChange={e => setSancionVestimenta(e.target.value)} required />
        </Field>
        <Field label="Sanción por retraso" required>
          <input className={inp} value={sancionRetraso} onChange={e => setSancionRetraso(e.target.value)} required />
        </Field>
      </Section>

      {/* ─── ERROR ─── */}
      {error && (
        <div className="bg-rose-900/30 border border-rose-500/30 rounded-2xl px-5 py-4 text-sm text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* ─── SUBMIT ─── */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Generando documento...</>
        ) : (
          <><Download className="w-5 h-5" /> Generar Documento Word (.docx)</>
        )}
      </button>
    </form>
  );
}
