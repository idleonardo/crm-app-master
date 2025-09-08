"use client";

import React, { useState, ChangeEvent } from 'react';
import { BlockMath } from 'react-katex';
import { motion, Variants, Transition } from 'framer-motion';
import 'katex/dist/katex.min.css';

interface Inputs {
  // Paso 1: Dimensiones del local
  largo: number;
  ancho: number;
  alturaTotal: number;
  Ht: number;
  Hs: number;
  planoTrabajo: number;
  
  // Paso 2: Interpolación CU
  rclX1: number;
  cuY1: number;
  rclX2: number;
  cuY2: number;
  rclX: number;
  
  // Paso 3: Iluminación y Reflexiones
  nivelIluminacion: number;
  reflexionTecho: number;
  reflexionParedes: number;
  reflexionPiso: number;
  
  // Paso 4: Luminarias y Mantenimiento
  flujoLuminoso: number;
  lamparasPorLuminaria: number;
  fpt: number;
  
  // Valores calculados
  cu: number;
  H: number;
  RCL: number;
  RCT: number;
  RCP: number;
  S: number;
}

interface Resultados {
  N: string;
  N_ancho: string;
  N_largo: string;
  N_redondeado: number;
  N_ancho_redondeado: number;
  N_largo_redondeado: number;
}

// Función para formatear números con 3 cifras significativas
const formatThreeSigFigs = (num: number): string => {
  if (num === 0) return '0';
  
  const magnitude = Math.floor(Math.log10(Math.abs(num)));
  const factor = Math.pow(10, 2 - magnitude);
  
  // Para números muy grandes o muy pequeños, usar notación científica
  if (magnitude > 5 || magnitude < -3) {
    return num.toExponential(2);
  }
  
  // Redondear a 3 cifras significativas
  const rounded = Math.round(num * factor) / factor;
  
  // Determinar el número de decimales necesarios
  const decimalPlaces = Math.max(0, 2 - magnitude);
  
  return rounded.toFixed(decimalPlaces);
};

const CavityMethodCalculator: React.FC = () => {
  const [inputs, setInputs] = useState<Inputs>({
    // Paso 1
    largo: 12,
    ancho: 6,
    alturaTotal: 3,
    Ht: 0.5,
    Hs: 0.8,
    planoTrabajo: 0.8,
    
    // Paso 2 (valores por defecto para el ejemplo)
    rclX1: 2,
    cuY1: 0.59,
    rclX2: 3,
    cuY2: 0.52,
    rclX: 2.5, // Valor inicial
    
    // Paso 3
    nivelIluminacion: 500,
    reflexionTecho: 0.7,
    reflexionParedes: 0.5,
    reflexionPiso: 0.2,
    
    // Paso 4
    flujoLuminoso: 2900,
    lamparasPorLuminaria: 1,
    fpt: 0.64,
    
    // Valores calculados
    cu: 0,
    H: 0,
    RCL: 0,
    RCT: 0,
    RCP: 0,
    S: 0
  });

  const [resultados, setResultados] = useState<Resultados | null>(null);
  const [mostrarFormulas, setMostrarFormulas] = useState<boolean>(false);
  const [pasoActual, setPasoActual] = useState<number>(1);
  const [cuCalculado, setCuCalculado] = useState<number>(0);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs({
      ...inputs,
      [name]: parseFloat(value) || 0
    });
  };

  // Calcular relaciones de cavidad (Paso 1)
  const calcularRelacionesCavidad = () => {
    const { largo, ancho, alturaTotal, Ht, Hs, planoTrabajo } = inputs;
    
    // Calcular H (altura de cavidad del local)
    const H = alturaTotal - planoTrabajo - Ht;
    
  // Relación cavidad local (RCL)
  const RCL = (5 * H * (largo + ancho)) / (largo * ancho);

  // Relación cavidad techo (RCT = RCL * (Ht / H))
  const RCT = RCL * (Ht / H);

  // Relación cavidad suelo (RCP = RCL * (Hs / H))
  const RCP = RCL * (Hs / H);

    
    // Calcular área
    const S = largo * ancho;
    
    return { H, RCL, RCT, RCP, S };
  };

  // Calcular CU por interpolación (Paso 2)
  const calcularCUInterpolacion = () => {
    const { rclX1, cuY1, rclX2, cuY2, rclX } = inputs;
    
    // Fórmula de interpolación: Y = Y1 + [(Y2 - Y1) / (X2 - X1)] * (X - X1)
    const cu = cuY1 + ((cuY2 - cuY1) / (rclX2 - rclX1)) * (rclX - rclX1);
    
    return parseFloat(cu.toFixed(4)); // Mayor precisión para CU
  };

  // Calcular resultados finales (Paso 4)
  const calcularResultadosFinales = () => {
    const { 
      flujoLuminoso, 
      lamparasPorLuminaria, 
      nivelIluminacion, 
      cu,
      fpt,
      S
    } = inputs;

    // Cálculo del número de luminarias
    const N = (nivelIluminacion * S) / (flujoLuminoso * lamparasPorLuminaria * cu * fpt);
    const N_ancho = Math.sqrt((inputs.ancho * N) / inputs.largo);
    const N_largo = N_ancho * (inputs.largo / inputs.ancho);

    setResultados({
      N: formatThreeSigFigs(N),
      N_ancho: formatThreeSigFigs(N_ancho),
      N_largo: formatThreeSigFigs(N_largo),
      N_redondeado: Math.ceil(N),
      N_ancho_redondeado: Math.round(N_ancho),
      N_largo_redondeado: Math.round(N_largo)
    });
  };

  const avanzarPaso = () => {
    if (pasoActual === 1) {
      // Calcular relaciones de cavidad
      const { H, RCL, RCT, RCP, S } = calcularRelacionesCavidad();
      setInputs(prev => ({ 
        ...prev, 
        H, 
        RCL: parseFloat(RCL.toFixed(4)), // Mayor precisión
        RCT: parseFloat(RCT.toFixed(4)), // Mayor precisión
        RCP: parseFloat(RCP.toFixed(4)), // Mayor precisión
        S,
        rclX: parseFloat(RCL.toFixed(4)) // Actualizar RCL para interpolación
      }));
    } else if (pasoActual === 2) {
      // Calcular CU por interpolación
      const cu = calcularCUInterpolacion();
      setCuCalculado(cu);
      setInputs(prev => ({ ...prev, cu }));
    } else if (pasoActual === 4) {
      // Calcular resultados finales
      calcularResultadosFinales();
    }
    
    // No avanzar más allá del paso 5
    if (pasoActual < 5) {
      setPasoActual(pasoActual + 1);
    }
  };

  const retrocederPaso = () => {
    if (pasoActual > 1) {
      setPasoActual(pasoActual - 1);
    }
  };

  // Animaciones para Framer Motion
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
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

  const fadeInVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const slideInVariants: Variants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  // Componente personalizado para fórmulas con mejor contraste (CORREGIDO)
  const FormulaBlock = ({ math }: { math: string }) => {
    return (
      <motion.div 
        variants={slideInVariants}
        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 overflow-x-auto"
      >
        <BlockMath math={math} />
      </motion.div>
    );
  };

  // Renderizar el paso actual del formulario
  const renderPasoActual = () => {
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
              Paso 1: Dimensiones del local y cavidades
            </motion.h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Largo (m)", name: "largo", value: inputs.largo },
                { label: "Ancho (m)", name: "ancho", value: inputs.ancho },
                { label: "Altura total (m)", name: "alturaTotal", value: inputs.alturaTotal },
                { label: "HT - Cavidad techo (m)", name: "Ht", value: inputs.Ht, step: "0.01" },
                { label: "HS - Cavidad suelo (m)", name: "Hs", value: inputs.Hs, step: "0.01" },
                { label: "PT - Plano trabajo (m)", name: "planoTrabajo", value: inputs.planoTrabajo, step: "0.01" }
              ].map((field, index) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    step={field.step || "0.01"}
                    value={field.value}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>
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
              Paso 2: Interpolación para Coeficiente de Utilización (CU)
            </motion.h3>
            <motion.p variants={itemVariants} className="text-sm text-white/60 mb-4">
              Ingresa los valores de la tabla del fabricante para interpolar el CU
            </motion.p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: "RCL 1 (X₁)", name: "rclX1", value: inputs.rclX1, step: "0.001" },
                { label: "CU 1 (Y₁)", name: "cuY1", value: inputs.cuY1, step: "0.0001" },
                { label: "RCL 2 (X₂)", name: "rclX2", value: inputs.rclX2, step: "0.001" },
                { label: "CU 2 (Y₂)", name: "cuY2", value: inputs.cuY2, step: "0.0001" },
              ].map((field, index) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    step={field.step}
                    value={field.value}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
              
              <motion.div variants={itemVariants} className="sm:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-white/80">RCL calculado (X)</label>
                <input
                  type="number"
                  step="0.001"
                  name="rclX"
                  value={inputs.rclX}
                  onChange={handleChange}
                  className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-xs text-white/50 mt-1">RCL calculado en el paso anterior: {inputs.RCL.toFixed(3)}</p>
              </motion.div>
            </div>
            
            <motion.div variants={itemVariants} className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-600">
              <h4 className="font-medium text-yellow-300 mb-3">Fórmula de interpolación:</h4>
              <FormulaBlock math="Y = Y_1 + \frac{(Y_2 - Y_1)}{(X_2 - X_1)} \times (X - X_1)" />
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
              Paso 3: Nivel de iluminación y coeficientes de reflexión
            </motion.h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nivel de iluminación (lux)", name: "nivelIluminacion", value: inputs.nivelIluminacion, step: "1" },
                { label: "Reflexión techo (0-1)", name: "reflexionTecho", value: inputs.reflexionTecho, step: "0.001", min: "0", max: "1" },
                { label: "Reflexión paredes (0-1)", name: "reflexionParedes", value: inputs.reflexionParedes, step: "0.001", min: "0", max: "1" },
                { label: "Reflexión piso (0-1)", name: "reflexionPiso", value: inputs.reflexionPiso, step: "0.001", min: "0", max: "1" },
              ].map((field, index) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    step={field.step || "0.001"}
                    min={field.min}
                    max={field.max}
                    value={field.value}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>
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
              Paso 4: Datos de luminarias y factor de mantenimiento
            </motion.h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Flujo luminoso (lm)", name: "flujoLuminoso", value: inputs.flujoLuminoso, step: "1" },
                { label: "Lámparas por luminaria", name: "lamparasPorLuminaria", value: inputs.lamparasPorLuminaria, step: "1" },
                { label: "Factor de pérdidas (FPT)", name: "fpt", value: inputs.fpt, step: "0.0001", min: "0.1", max: "1" },
              ].map((field, index) => (
                <motion.div key={field.name} variants={itemVariants} className="space-y-1">
                  <label className="block text-sm font-medium text-white/80">{field.label}</label>
                  <input
                    type="number"
                    name={field.name}
                    step={field.step || "0.0001"}
                    min={field.min}
                    max={field.max}
                    value={field.value}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-700 rounded-lg bg-slate-900/50 text-white font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </motion.div>
              ))}
            </div>
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
              Resultados Finales
            </motion.h3>
            
            {resultados ? (
              <motion.div
                className="bg-green-900/20 p-6 rounded-lg border border-green-600"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div className="mb-4" variants={itemVariants}>
                  <p className="text-white/80 font-medium">Número de luminarias (N):</p>
                  <p className="text-xl font-bold text-green-300">{resultados.N} ≈ {resultados.N_redondeado}</p>
                </motion.div>
                
                <motion.div className="mb-4" variants={itemVariants}>
                  <p className="text-white/80 font-medium">Distribución en ancho (N_ancho):</p>
                  <p className="text-xl font-bold text-green-300">{resultados.N_ancho} ≈ {resultados.N_ancho_redondeado}</p>
                </motion.div>
                
                <motion.div className="mb-4" variants={itemVariants}>
                  <p className="text-white/80 font-medium">Distribución en largo (N_largo):</p>
                  <p className="text-xl font-bold text-green-300">{resultados.N_largo} ≈ {resultados.N_largo_redondeado}</p>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="mt-4 p-4 bg-blue-900/30 rounded-lg border border-blue-600">
                    <p className="text-sm text-blue-300 font-semibold">Distribución recomendada:</p>
                    <p className="text-lg font-bold text-blue-300">
                      {resultados.N_ancho_redondeado} ancho × {resultados.N_largo_redondeado} largo
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="mt-6">
                  <button
                    onClick={() => setMostrarFormulas(!mostrarFormulas)}
                    className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
                  >
                    {mostrarFormulas ? 'Ocultar' : 'Mostrar'} fórmulas completas
                  </button>
                </motion.div>
              </motion.div>
            ) : (
              <div className="bg-slate-800/40 p-6 rounded-lg text-center border border-slate-700">
                <p className="text-white/60">Haz clic en Calcular para ver los resultados</p>
              </div>
            )}
          </motion.div>
        );
      
      default:
        return null;
    }
  };

  // Mostrar resultados intermedios después del paso 1
  const mostrarResultadosPaso1 = () => {
    if (pasoActual > 1 && pasoActual < 5) {
      return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="bg-blue-900/20 p-4 rounded-lg border border-blue-600 mt-4"
        >
          <h4 className="font-semibold text-blue-300 mb-3">Resultados del Paso 1:</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "Área del local (S):", value: `${inputs.S} m²` },
              { label: "Altura cavidad local (H):", value: `${inputs.H.toFixed(3)} m` },
              { label: "Relación cavidad local (RCL):", value: inputs.RCL.toFixed(3) },
              { label: "Relación cavidad techo (RCT):", value: inputs.RCT.toFixed(3) },
              { label: "Relación cavidad suelo (RCP):", value: inputs.RCP.toFixed(3) },
            ].map((item, index) => (
              <motion.div 
                key={index} 
                variants={itemVariants}
                className="bg-slate-800/40 p-2 rounded border border-slate-700"
              >
                <p className="text-sm text-white/70">{item.label}</p>
                <p className="font-bold text-blue-300">{item.value}</p>
              </motion.div>
            ))}
          </div>
          
          {/* Fórmulas del paso 1 */}
          <motion.div variants={itemVariants} className="mt-4">
            <h5 className="font-medium text-blue-300 mb-2">Fórmulas utilizadas:</h5>
            <div className="space-y-2">
              <FormulaBlock math="H = H_{\text{total}} - PT - HT" />
              <FormulaBlock math="RCL = \frac{5 \times H \times (Largo + Ancho)}{Largo \times Ancho}" />
              <FormulaBlock math="RCT = RCL \cdot \left(\frac{HT}{H}\right)" />
              <FormulaBlock math="RCP = RCL \cdot \left(\frac{HS}{H}\right)" />

            </div>
          </motion.div>
        </motion.div>
      );
    }
    return null;
  };

  // Mostrar resultado de CU después del paso 2
  const mostrarResultadoCU = () => {
    if (pasoActual > 2 && pasoActual < 5 && cuCalculado > 0) {
      return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="bg-green-900/20 p-4 rounded-lg border border-green-600 mt-4"
        >
          <h4 className="font-semibold text-green-300 mb-2">Resultado de la interpolación:</h4>
          <p className="text-lg font-bold text-green-300">Coeficiente de Utilización (CU) = {cuCalculado.toFixed(4)}</p>
          <div className="mt-3">
            <FormulaBlock math={`\\text{Con } X_1 = ${inputs.rclX1},\\ Y_1 = ${inputs.cuY1},\\ X_2 = ${inputs.rclX2},\\ Y_2 = ${inputs.cuY2},\\ X = ${inputs.rclX.toFixed(3)}`} />
            <div className="mt-2">
              <FormulaBlock math={`Y = ${inputs.cuY1} + \\frac{(${inputs.cuY2} - ${inputs.cuY1})}{(${inputs.rclX2} - ${inputs.rclX1})} \\times (${inputs.rclX.toFixed(3)} - ${inputs.rclX1}) = ${cuCalculado.toFixed(4)}`} />
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // Mostrar fórmulas completas al final
  const mostrarFormulasCompletas = () => {
    if (mostrarFormulas && resultados) {
      return (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="mt-6 bg-slate-800/40 p-4 rounded-lg border border-slate-700"
        >
          <h4 className="font-semibold text-white mb-3">Fórmulas completas utilizadas:</h4>
          
          <div className="space-y-4">
           
            <div>
              <p className="text-sm text-white/70 mb-2">Cálculo de relaciones de cavidad:</p>
              <FormulaBlock math="H = H_{\text{total}} - PT - HT" />
              <FormulaBlock math={`H = ${inputs.alturaTotal} - ${inputs.planoTrabajo} - ${inputs.Ht} = ${inputs.H.toFixed(3)}`} />
              <FormulaBlock math="RCL = \frac{5 \times H \times (Largo + Ancho)}{Largo \times Ancho}" />
              <FormulaBlock math={`RCL = \\frac{5 \\times ${inputs.H.toFixed(3)} \\times (${inputs.largo} + ${inputs.ancho})}{${inputs.largo} \\times ${inputs.ancho}} = ${inputs.RCL.toFixed(3)}`} />
              <FormulaBlock math="RCT = RCL \times \frac{HT}{H}" />
              <FormulaBlock math={`RCT = ${inputs.RCL.toFixed(3)} \\times \\frac{${inputs.Ht}}{${inputs.H.toFixed(3)}} = ${inputs.RCT.toFixed(3)}`} />
              <FormulaBlock math="RCP = RCL \times \frac{HS}{H}" />
              <FormulaBlock math={`RCP = ${inputs.RCL.toFixed(3)} \\times \\frac{${inputs.Hs}}{${inputs.H.toFixed(3)}} = ${inputs.RCP.toFixed(3)}`} />
            </div>
            
            <div>
              <p className="text-sm text-white/70 mb-2">Cálculo del número de luminarias:</p>
              <FormulaBlock math="N = \frac{E \times S}{\Phi \times L \times CU \times FPT}" />
              <FormulaBlock math={`N = \\frac{${inputs.nivelIluminacion} \\times ${inputs.S}}{${inputs.flujoLuminoso} \\times ${inputs.lamparasPorLuminaria} \\times ${inputs.cu.toFixed(4)} \\times ${inputs.fpt.toFixed(4)}} = ${resultados.N}`} />
            </div>
            
            <div>
              <p className="text-sm text-white/70 mb-2">Distribución de luminarias:</p>
              <FormulaBlock math="N_{\text{ancho}} = \sqrt{\frac{Ancho \times N}{Largo}}" />
              <FormulaBlock math={`N_{\\text{ancho}} = \\sqrt{\\frac{${inputs.ancho} \\times ${resultados.N}}{${inputs.largo}}} = ${resultados.N_ancho}`} />
              <FormulaBlock math="N_{\text{largo}} = N_{\text{ancho}} \times \frac{Largo}{Ancho}" />
              <FormulaBlock math={`N_{\\text{largo}} = ${resultados.N_ancho} \\times \\frac{${inputs.largo}}{${inputs.ancho}} = ${resultados.N_largo}`} />
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-transparent text-white">
      <motion.h1 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-2xl md:text-3xl font-bold text-blue-400 mb-2 text-center"
      >
        Método de Cavidades
      </motion.h1>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-white/60 mb-6 text-center"
      >
        Cálculo de iluminación por el método de cavidades
      </motion.p>

      {/* Barra de progreso - Solo muestra hasta 5 pasos */}
      {pasoActual <= 5 && (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
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
      )}

      {/* Formulario del paso actual - Solo muestra hasta el paso 5 */}
      {pasoActual <= 5 && (
        <motion.div 
          key={pasoActual}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="bg-slate-800/40 p-4 md:p-6 rounded-lg mb-6 border border-slate-700"
        >
          {renderPasoActual()}
          {mostrarResultadosPaso1()}
          {mostrarResultadoCU()}
          {mostrarFormulasCompletas()}
        </motion.div>
      )}

      {/* Botones de navegación - Solo muestra hasta el paso 5 */}
      {pasoActual <= 5 && (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
          className="flex justify-between"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={retrocederPaso}
            disabled={pasoActual === 1}
            className={`px-4 py-2 rounded-lg ${pasoActual === 1 ? 'bg-slate-700 text-slate-400' : 'bg-slate-600 text-white hover:bg-slate-500'}`}
          >
            Anterior
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={avanzarPaso}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {pasoActual === 5 ? 'Finalizar' : pasoActual === 4 ? 'Calcular' : 'Siguiente'}
          </motion.button>
        </motion.div>
      )}

      {/* Estilos adicionales para mejorar el contraste de las fórmulas */}
      <style jsx global>{`
        .katex {
          font-size: 1.15em !important;
          color: #fff !important;
          font-weight: bold;
        }
        .katex .mathnormal {
          color: #fff !important;
        }
        .katex .mord {
          color: #fff !important;
        }
        .katex .mfrac {
          color: #fff !important;
        }
        .katex .msqrt {
          color: #fff !important;
        }
        .katex .mroot {
          color: #fff !important;
        }
        .katex .mspace {
          background-color: transparent !important;
        }
        
        @media (max-width: 768px) {
          .katex {
            font-size: 1em !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CavityMethodCalculator;