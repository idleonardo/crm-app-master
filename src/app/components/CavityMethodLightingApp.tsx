"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Trash2, Download, Upload, Save, History, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

// ===== Types =====

type SistemaIluminacion =
  | "Directo"
  | "Semidirecto"
  | "Mixto"
  | "Indirecto"
  | "Semi-indirecto";

type RegistroResultado = {
  id: string;
  fechaISO: string;
  inputs: Inputs;
  resultados: Resultados & {
    numeroLuminariasExacto: number;
    emplazamiento: {
      nAncho: number;
      nLargo: number;
      nAnchoExacto: number;
      nLargoExacto: number;
    };
  };
};

type Inputs = {
  largo: number;
  ancho: number;
  alturaTotal: number;
  alturaPlanoTrabajo: number;
  alturaSuspension: number;
  nivelIluminacion: number;
  sistema: SistemaIluminacion;
  reflexionTecho: number;
  reflexionParedes: number;
  reflexionPiso: number;
  tipoLampara: string;
  flujoPorLuminaria: number;
  rclX1: number;
  cuY1: number;
  rclX2: number;
  cuY2: number;
  rclX: number;
  FPT: number;
};

type Resultados = {
  areaS: number;
  alturaCalculo: number;
  indiceLocalK: number;
  CU: number;
  flujoTotal: number;
  numeroLuminarias: number;
  numeroLuminariasExacto: number; // Nuevo campo
  emplazamiento: {
    nAncho: number;
    nLargo: number;
    nAnchoExacto: number; // Nuevo campo
    nLargoExacto: number; // Nuevo campo
  };
};

// ===== Helpers =====

const LS_KEY = "lighting-calculator-history-v2";

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function round(x: number, d = 4) {
  const p = Math.pow(10, d);
  return Math.round(x * p) / p;
}

function linearInterpolate(x1: number, y1: number, x2: number, y2: number, x: number) {
  if (x2 === x1) return y1;
  return y1 + ((x - x1) * (y2 - y1)) / (x2 - x1);
}

function defaultInputs(): Inputs {
  return {
    largo: 10,
    ancho: 8,
    alturaTotal: 3.2,
    alturaPlanoTrabajo: 0.8,
    alturaSuspension: 0.3,
    nivelIluminacion: 300,
    sistema: "Semi-indirecto",
    reflexionTecho: 0.8,
    reflexionParedes: 0.5,
    reflexionPiso: 0.2,
    tipoLampara: "LED panel 40W",
    flujoPorLuminaria: 4000,
    rclX1: 0.75,
    cuY1: 0.54,
    rclX2: 1.5,
    cuY2: 0.68,
    rclX: 1.0,
    FPT: 0.64,
  };
}

function calcularResultados(inp: Inputs): Resultados {
  const a = inp.ancho;
  const b = inp.largo;
  const S = a * b;

  const esIndirecto = inp.sistema === "Indirecto" || inp.sistema === "Semi-indirecto";

  const alturaCalculo = esIndirecto
    ? inp.alturaTotal - inp.alturaPlanoTrabajo
    : inp.alturaTotal - inp.alturaPlanoTrabajo - inp.alturaSuspension;

  const K = esIndirecto
    ? (3 * a * b) / (2 * alturaCalculo * (a + b))
    : (a * b) / (alturaCalculo * (a + b));

  const CU = linearInterpolate(inp.rclX1, inp.cuY1, inp.rclX2, inp.cuY2, K);

  const Phi_tot = (inp.nivelIluminacion * S) / (CU * inp.FPT);

  const N_tot_raw = Phi_tot / inp.flujoPorLuminaria;
  const N_tot = Math.ceil(N_tot_raw);

  // Calcular distribución con el valor EXACTO (sin redondear)
  const nAnchoExacto = Math.sqrt(a * (N_tot_raw / b));
  const nLargoExacto = nAnchoExacto * (b / a);
  
  const nAncho = Math.max(1, Math.round(nAnchoExacto));
  const nLargo = Math.max(1, Math.round(nLargoExacto));

  return {
    areaS: S,
    alturaCalculo,
    indiceLocalK: K,
    CU,
    flujoTotal: Phi_tot,
    numeroLuminarias: N_tot, // Valor redondeado hacia arriba
    numeroLuminariasExacto: N_tot_raw, // Valor exacto
    emplazamiento: { 
      nAncho, 
      nLargo,
      nAnchoExacto, // Valor exacto para mostrar en fórmulas
      nLargoExacto  // Valor exacto para mostrar en fórmulas
    },
  };
}

function fmtPercent(x: number) {
  return `${round(100 * x, 2)}%`;
}

// ===== Component =====

export default function CavityMethodLightingApp() {
  const [inputs, setInputs] = useState<Inputs>(defaultInputs());
  const [historial, setHistorial] = useState<RegistroResultado[]>([]);
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [mostrarResultados, setMostrarResultados] = useState<boolean>(false);

  // Cargar historial desde localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setHistorial(JSON.parse(raw));
    } catch (_) {}
  }, []);

  // Guardar historial
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(historial));
    } catch (_) {}
  }, [historial]);

  const resultados = useMemo(() => calcularResultados(inputs), [inputs]);

  const addToHistory = () => {
    const reg: RegistroResultado = {
      id: crypto.randomUUID(),
      fechaISO: new Date().toISOString(),
      inputs,
      resultados,
    };
    setHistorial((h) => [reg, ...h]);
  };

  const deleteFromHistory = (id: string) => {
    setHistorial((h) => h.filter((r) => r.id !== id));
  };

  const clearHistory = () => setHistorial([]);

  const handleNumber = (key: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setInputs((prev) => ({ ...prev, [key]: isNaN(v) ? 0 : v }));
  };

  const handleSelect = (key: keyof Inputs) => (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as any;
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const cargarRegistro = (reg: RegistroResultado) => {
    setInputs(reg.inputs);
    setPasoActual(1);
    setMostrarResultados(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const exportar = () => {
    const blob = new Blob([JSON.stringify(historial, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historial-iluminacion-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importar = async (file: File) => {
    const text = await file.text();
    const data = JSON.parse(text) as RegistroResultado[];
    setHistorial(data);
  };

  const avanzarPaso = () => {
    if (pasoActual < 5) {
      setPasoActual(pasoActual + 1);
    } else {
      setMostrarResultados(true);
    }
  };

  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
      setMostrarResultados(false);
    }
  };

  const resetCalculadora = () => {
    setInputs(defaultInputs());
    setPasoActual(1);
    setMostrarResultados(false);
  };

  // Animaciones - VERSIÓN CORREGIDA
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 10
      }
    }
  };

  const FormulaBlock = ({ math }: { math: string }) => {
    return (
      <motion.div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 overflow-x-auto">
        <BlockMath math={math} />
      </motion.div>
    );
  };

  // Renderizar el paso actual
  const renderPasoActual = () => {
    const esIndirecto = inputs.sistema === "Indirecto" || inputs.sistema === "Semi-indirecto";
    
    switch(pasoActual) {
      case 1:
        return (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <motion.h3 variants={itemVariants} className="text-xl font-semibold text-blue-400 mb-4">
              Paso 1: Dimensiones del local
            </motion.h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Largo b (m)", name: "largo", value: inputs.largo },
                { label: "Ancho a (m)", name: "ancho", value: inputs.ancho },
                { label: "Altura total Htotal (m)", name: "alturaTotal", value: inputs.alturaTotal },
                { label: "Altura plano trabajo HpT (m)", name: "alturaPlanoTrabajo", value: inputs.alturaPlanoTrabajo },
                { label: "Altura suspensión Hsusp (m)", name: "alturaSuspension", value: inputs.alturaSuspension },
              ].map((field) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    name={field.name}
                    value={field.value}
                    onChange={handleNumber(field.name as keyof Inputs)}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
              <h4 className="font-medium text-blue-300 mb-2">Fórmula del área:</h4>
              <FormulaBlock math="S = a \cdot b" />
              <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                <BlockMath math={`S = ${round(inputs.ancho, 2)} \\times ${round(inputs.largo, 2)} = ${round(resultados.areaS, 2)}\\, m^2`} />
              </div>
            </motion.div>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <motion.h3 variants={itemVariants} className="text-xl font-semibold text-blue-400 mb-4">
              Paso 2: Sistema de iluminación
            </motion.h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.div variants={itemVariants} className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-white/80">Sistema de iluminación</label>
                <select 
                  className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  value={inputs.sistema} 
                  onChange={handleSelect("sistema")}
                >
                  <option value="Directo">Directo</option>
                  <option value="Semidirecto">Semidirecto</option>
                  <option value="Mixto">Mixto</option>
                  <option value="Indirecto">Indirecto</option>
                  <option value="Semi-indirecto">Semi-indirecto</option>
                </select>
              </motion.div>
              
              {[
                { label: "Reflexión techo (0–1)", name: "reflexionTecho", value: inputs.reflexionTecho },
                { label: "Reflexión paredes (0–1)", name: "reflexionParedes", value: inputs.reflexionParedes },
                { label: "Reflexión piso (0–1)", name: "reflexionPiso", value: inputs.reflexionPiso },
              ].map((field) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    name={field.name}
                    value={field.value}
                    onChange={handleNumber(field.name as keyof Inputs)}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
              <h4 className="font-medium text-blue-300 mb-2">Altura de cálculo:</h4>
              {esIndirecto ? (
                <>
                  <FormulaBlock math="H = H_{total} - H_{pT}" />
                  <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                    <BlockMath math={`H = ${round(inputs.alturaTotal, 2)} - ${round(inputs.alturaPlanoTrabajo, 2)} = ${round(resultados.alturaCalculo, 2)}\\, m`} />
                  </div>
                </>
              ) : (
                <>
                  <FormulaBlock math="h = H_{total} - H_{pT} - H_{susp}" />
                  <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                    <BlockMath math={`h = ${round(inputs.alturaTotal, 2)} - ${round(inputs.alturaPlanoTrabajo, 2)} - ${round(inputs.alturaSuspension, 2)} = ${round(resultados.alturaCalculo, 2)}\\, m`} />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        );
      
      case 3:
        return (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <motion.h3 variants={itemVariants} className="text-xl font-semibold text-blue-400 mb-4">
              Paso 3: Parámetros de iluminación
            </motion.h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nivel de iluminación E (lux)", name: "nivelIluminacion", value: inputs.nivelIluminacion },
                { label: "FPT (factor de pérdidas)", name: "FPT", value: inputs.FPT, step: "0.01", min: "0.1", max: "1" },
              ].map((field) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    step={field.step || "1"}
                    min={field.min}
                    max={field.max}
                    name={field.name}
                    value={field.value}
                    onChange={handleNumber(field.name as keyof Inputs)}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>

            <motion.div variants={itemVariants} className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
              <h4 className="font-medium text-blue-300 mb-2">Índice del local K:</h4>
              {esIndirecto ? (
                <>
                  <FormulaBlock math="K = \frac{3 \cdot a \cdot b}{2 \cdot H \cdot (a + b)}" />
                  <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                    <BlockMath math={`K = \\frac{3 \\times ${round(inputs.ancho, 2)} \\times ${round(inputs.largo, 2)}}{2 \\times ${round(resultados.alturaCalculo, 2)} \\times (${round(inputs.ancho, 2)} + ${round(inputs.largo, 2)})} = ${round(resultados.indiceLocalK, 4)}`} />
                  </div>
                </>
              ) : (
                <>
                  <FormulaBlock math="K = \frac{a \cdot b}{h \cdot (a + b)}" />
                  <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                    <BlockMath math={`K = \\frac{${round(inputs.ancho, 2)} \\times ${round(inputs.largo, 2)}}{${round(resultados.alturaCalculo, 2)} \\times (${round(inputs.ancho, 2)} + ${round(inputs.largo, 2)})} = ${round(resultados.indiceLocalK, 4)}`} />
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        );
      
      case 4:
        return (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="space-y-4"
          >
            <motion.h3 variants={itemVariants} className="text-xl font-semibold text-blue-400 mb-4">
              Paso 4: Lámparas y coeficiente de utilización
            </motion.h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Tipo de lámpara", name: "tipoLampara", value: inputs.tipoLampara, type: "text" },
                { label: "Flujo por luminaria Φl (lm)", name: "flujoPorLuminaria", value: inputs.flujoPorLuminaria },
              ].map((field) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type={field.type || "number"}
                    name={field.name}
                    value={field.value}
                    onChange={field.type === "text" ? 
                      (e) => setInputs({...inputs, tipoLampara: e.target.value}) : 
                      handleNumber(field.name as keyof Inputs)}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
              
              <motion.div variants={itemVariants} className="sm:col-span-2 grid grid-cols-5 gap-3">
                {[
                  { label: "RCL X1 (=K₁)", name: "rclX1", value: inputs.rclX1 },
                  { label: "CU Y1", name: "cuY1", value: inputs.cuY1 },
                  { label: "RCL X2 (=K₂)", name: "rclX2", value: inputs.rclX2 },
                  { label: "CU Y2", name: "cuY2", value: inputs.cuY2 },
                ].map((field) => (
                  <div key={field.name} className="space-y-1">
                    <label className="block text-sm font-medium text-white/80">{field.label}</label>
                    <input
                      type="number"
                      step="0.01"
                      name={field.name}
                      value={field.value}
                      onChange={handleNumber(field.name as keyof Inputs)}
                      className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                ))}
                
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">RCL X (=K)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={round(resultados.indiceLocalK)}
                    readOnly
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-800/70 text-white/80 font-medium"
                  />
                </div>
              </motion.div>
            </div>

            <motion.div variants={itemVariants} className="mt-4 p-4 bg-blue-900/20 rounded-lg border border-blue-600">
              <h4 className="font-medium text-blue-300 mb-2">Coeficiente de Utilización (CU):</h4>
              <FormulaBlock math="CU = CU_1 + \frac{(K - K_1) \cdot (CU_2 - CU_1)}{K_2 - K_1}" />
              <div className="mt-3 p-3 bg-slate-800/40 rounded-lg border border-slate-700">
                <BlockMath math={`CU = ${round(inputs.cuY1, 3)} + \\frac{(${round(resultados.indiceLocalK, 4)} - ${round(inputs.rclX1, 3)}) \\cdot (${round(inputs.cuY2, 3)} - ${round(inputs.cuY1, 3)})}{${round(inputs.rclX2, 3)} - ${round(inputs.rclX1, 3)}} = ${round(resultados.CU, 4)}`} />
              </div>
            </motion.div>
          </motion.div>
        );
      
      case 5:
  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-4"
    >
      <motion.h3 variants={itemVariants} className="text-xl font-semibold text-blue-400 mb-4">
        Paso 5: Resultados finales
      </motion.h3>
      
      {mostrarResultados ? (
        <motion.div
          className="bg-green-900/20 p-6 rounded-lg border border-green-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 gap-6">
            <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700">
              <h4 className="font-medium text-green-300 mb-3">Flujo total requerido:</h4>
              <div className="p-3 bg-slate-900/50 rounded-lg overflow-x-auto">
                <BlockMath math={`\\Phi_{tot} = \\frac{E \\cdot S}{CU \\cdot FPT} = \\frac{${inputs.nivelIluminacion} \\times ${round(resultados.areaS, 2)}}{${round(resultados.CU, 4)} \\times ${inputs.FPT}} = ${round(resultados.flujoTotal)}\\, lm`} />
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700">
              <h4 className="font-medium text-green-300 mb-3">Número de luminarias:</h4>
              <div className="p-3 bg-slate-900/50 rounded-lg overflow-x-auto">
                <BlockMath math={`N_{tot} = \\frac{\\Phi_{tot}}{\\Phi_l} = \\frac{${round(resultados.flujoTotal)}}{${inputs.flujoPorLuminaria}} = ${round(resultados.numeroLuminariasExacto, 2)} \\Rightarrow ${resultados.numeroLuminarias}`} />
              </div>
            </div>
            
            <div className="p-4 bg-slate-800/40 rounded-lg border border-slate-700">
              <h4 className="font-medium text-green-300 mb-3">Distribución recomendada:</h4>
              <div className="p-3 bg-slate-900/50 rounded-lg overflow-x-auto">
                {/* Usar el valor EXACTO en la fórmula */}
                <BlockMath math={`N_{ancho} = \\sqrt{a \\cdot \\frac{N_{tot}}{b}} = \\sqrt{${inputs.ancho} \\cdot \\frac{${round(resultados.numeroLuminariasExacto, 2)}}{${inputs.largo}}} = ${round(resultados.emplazamiento.nAnchoExacto, 2)}`} />
                <div className="text-xs text-white/60 mt-1 text-center">
                  Redondeado a: {resultados.emplazamiento.nAncho} luminarias en el ancho
                </div>
                
                <div className="mt-3"></div>
                
                <BlockMath math={`N_{largo} = N_{ancho} \\cdot \\frac{b}{a} = ${round(resultados.emplazamiento.nAnchoExacto, 2)} \\cdot \\frac{${inputs.largo}}{${inputs.ancho}} = ${round(resultados.emplazamiento.nLargoExacto, 2)}`} />
                <div className="text-xs text-white/60 mt-1 text-center">
                  Redondeado a: {resultados.emplazamiento.nLargo} luminarias en el largo
                </div>
                
                <div className="mt-4 p-2 bg-blue-900/20 rounded border border-blue-700">
                  <p className="text-center text-blue-300 font-medium">
                    Distribución final: {resultados.emplazamiento.nAncho} × {resultados.emplazamiento.nLargo} = {resultados.emplazamiento.nAncho * resultados.emplazamiento.nLargo} luminarias
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={addToHistory}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 mt-4"
            >
              <Save className="h-5 w-5" /> Guardar resultados
            </button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-800/40 p-6 rounded-lg text-center border border-slate-700">
          <p className="text-white/60">Haz clic en "Calcular resultados" para ver los resultados finales</p>
        </div>
      )}
    </motion.div>
  );
      
      default:
        return null;
    }
  };

  // Renderizar historial
  const renderHistorial = () => (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8 rounded-2xl bg-slate-900/50 border border-slate-700 shadow-sm"
    >
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-2 text-white/90">
          <History className="h-5 w-5 text-white/90" />
          <h3 className="font-semibold">Historial (memoria local)</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={exportar} className="btn-muted">
            <Download className="h-4 w-4" /> Exportar
          </button>
          <label className="btn-muted cursor-pointer">
            <Upload className="h-4 w-4" /> Importar
            <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files && importar(e.target.files[0])} />
          </label>
          <button onClick={clearHistory} className="btn-danger">
            <Trash2 className="h-4 w-4" /> Vaciar
          </button>
        </div>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-800 text-white/80">
              <Th>Fecha</Th>
              <Th>Sistema</Th>
              <Th>a×b (m)</Th>
              <Th>E (lux)</Th>
              <Th>K</Th>
              <Th>CU</Th>
              <Th>N_tot</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {historial.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-white/60">
                  No hay registros guardados.
                </td>
              </tr>
            )}
            {historial.map((r) => (
              <tr key={r.id} className="border-b border-slate-700 last:border-0 hover:bg-slate-800/40">
                <Td>{new Date(r.fechaISO).toLocaleString()}</Td>
                <Td>{r.inputs.sistema}</Td>
                <Td>
                  {round(r.inputs.ancho, 2)} × {round(r.inputs.largo, 2)}
                </Td>
                <Td>{round(r.inputs.nivelIluminacion, 2)}</Td>
                <Td>{round(r.resultados.indiceLocalK, 3)}</Td>
                <Td>{round(r.resultados.CU, 3)}</Td>
                <Td>{r.resultados.numeroLuminarias}</Td>
                <Td>
                  <div className="flex gap-2">
                    <button className="btn-xs" onClick={() => cargarRegistro(r)}>
                      Cargar
                    </button>
                    <button className="btn-xs-danger" onClick={() => deleteFromHistory(r.id)}>
                      Eliminar
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="mx-auto max-w-4xl">
        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center gap-3"
        >
          <div className="rounded-2xl bg-blue-600 p-3 text-white shadow-lg">
            <Calculator className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Calculadora de Luminarias - Método del Flujo Total
            </h1>
            <p className="text-white/70 text-sm">
              Sistema paso a paso para cálculo de iluminación
            </p>
          </div>
        </motion.header>

        {/* Barra de progreso */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6 bg-slate-800/40 p-3 rounded-lg border border-slate-700"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-300">Paso {pasoActual} de 5</span>
            <span className="text-sm font-medium text-blue-300">Progreso: {Math.round((pasoActual / 5) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <motion.div 
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(pasoActual / 5) * 100}%` }}
              transition={{ duration: 0.5 }}
            ></motion.div>
          </div>
        </motion.div>

        {/* Formulario del paso actual */}
        <motion.div 
          key={pasoActual}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-slate-800/40 p-4 md:p-6 rounded-lg mb-6 border border-slate-700"
        >
          {renderPasoActual()}
        </motion.div>

        {/* Botones de navegación */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex justify-between mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={retrocederPaso}
            disabled={pasoActual === 1}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${pasoActual === 1 ? 'bg-slate-700 text-slate-400' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
          >
            <ChevronLeft className="h-5 w-5" /> Anterior
          </motion.button>
          
          <div className="flex gap-2">
            <button
              onClick={resetCalculadora}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500 transition flex items-center gap-2"
            >
              <RefreshCw className="h-5 w-5" /> Reiniciar
            </button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={avanzarPaso}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              {pasoActual === 5 ? (mostrarResultados ? 'Finalizado' : 'Calcular resultados') : 'Siguiente'} 
              {pasoActual < 5 && <ChevronRight className="h-5 w-5" />}
            </motion.button>
          </div>
        </motion.div>

        {/* Historial */}
        {renderHistorial()}
      </div>

      {/* Estilos globales */}
      <style jsx global>{`
        .btn-muted {
          @apply inline-flex items-center gap-2 rounded-xl bg-slate-800/50 px-3 py-2 text-white/90 shadow hover:bg-slate-800/60 active:translate-y-px;
        }
        .btn-danger {
          @apply inline-flex items-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-white shadow hover:bg-red-700 active:translate-y-px;
        }
        .btn-xs {
          @apply text-xs rounded-lg bg-slate-800/60 px-2 py-1 hover:bg-slate-800/70 text-white/90;
        }
        .btn-xs-danger {
          @apply text-xs rounded-lg bg-red-500 px-2 py-1 text-white hover:bg-red-600;
        }
        th, td { @apply px-3 py-2; }

        /* KaTeX styles for dark theme */
        .katex {
          font-size: 1.02em !important;
          color: #c7d2fe !important;
          font-weight: 600;
        }
        .katex .mathnormal { color: #c7d2fe !important; }
        .katex .mord { color: #c7d2fe !important; }
        .katex .mfrac { color: #c7d2fe !important; }
        .katex .msqrt { color: #c7d2fe !important; }
        .katex .mroot { color: #c7d2fe !important; }

        @media (max-width: 768px) {
          .katex { font-size: 1em !important; }
        }
      `}</style>
    </div>
  );
}

// Componentes auxiliares
function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-semibold uppercase tracking-wide text-white/80">{children}</th>;
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="text-white/90">{children}</td>;
}