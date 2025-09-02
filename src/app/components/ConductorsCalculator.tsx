'use client';

import { useState, useEffect } from 'react';
import { Zap, Calculator, FileText, AlertTriangle, History, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';

// Definir tipos para los resultados
type CalculationResult = 
  | { 
      method: 'current'; 
      current: number;
      correctedCurrent: number;
      protectionCurrent: number;
      systemType: string;
      power: number;
      voltage: number;
      powerFactor: number;
      demandFactor: number;
      timestamp: Date;
    }
  | { 
      method: 'drop'; 
      current: number;
      correctedCurrent: number;
      section: number; 
      awg: string;
      systemType: string;
      power: number;
      voltage: number;
      powerFactor: number;
      demandFactor: number;
      length: number;
      voltageDropPercent: number;
      timestamp: Date;
    }
  | null;

export default function ConductorCalculator() {
  const [systemType, setSystemType] = useState<string>('monofasico');
  const [power, setPower] = useState<string>('');
  const [voltage, setVoltage] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('0.9');
  const [demandFactor, setDemandFactor] = useState<string>('0.85');
  const [length, setLength] = useState<string>('');
  const [voltageDropPercent, setVoltageDropPercent] = useState<string>('3');
  const [loadType, setLoadType] = useState<string>('general');
  const [result, setResult] = useState<CalculationResult>(null);
  const [calculationMethod, setCalculationMethod] = useState<string>('current');
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Cargar historial desde localStorage al inicializar
  useEffect(() => {
    const savedHistory = localStorage.getItem('conductorCalculationHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        // Convertir strings de fecha a objetos Date
        const historyWithDates = parsedHistory.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHistory(historyWithDates);
      } catch (e) {
        console.error('Error loading history from localStorage', e);
      }
    }
  }, []);

  // Guardar historial en localStorage cuando cambie
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('conductorCalculationHistory', JSON.stringify(history));
    }
  }, [history]);

  // Función para estimar calibre AWG basado en sección transversal
  const calculateAWG = (section: number): string => {
    // Tabla completa de calibres AWG con valores precisos (en mm²)
    const awgTable = [
      { awg: '24', section: 0.205 },
      { awg: '22', section: 0.326 },
      { awg: '20', section: 0.518 },
      { awg: '18', section: 0.823 },
      { awg: '16', section: 1.308 },
      { awg: '14', section: 2.081 },
      { awg: '12', section: 3.309 },
      { awg: '10', section: 5.261 },
      { awg: '8', section: 8.367 },
      { awg: '6', section: 13.30 },
      { awg: '4', section: 21.15 },
      { awg: '3', section: 26.67 },
      { awg: '2', section: 33.63 },
      { awg: '1', section: 42.41 },
      { awg: '1/0', section: 53.49 },
      { awg: '2/0', section: 67.43 },
      { awg: '3/0', section: 85.01 },
      { awg: '4/0', section: 107.2 },
      { awg: '250 kcmil', section: 126.7 },
      { awg: '300 kcmil', section: 152.0 },
      { awg: '350 kcmil', section: 177.3 },
      { awg: '400 kcmil', section: 202.7 },
      { awg: '500 kcmil', section: 253.4 },
      { awg: '600 kcmil', section: 304.0 },
      { awg: '750 kcmil', section: 380.0 },
      { awg: '1000 kcmil', section: 506.7 }
    ];
    
    // Si la sección es muy pequeña, usar el calibre más pequeño disponible
    if (section < awgTable[0].section) {
      return awgTable[0].awg;
    }
    
    // Buscar el calibre más pequeño que tenga una sección mayor o igual a la requerida
    for (let i = 0; i < awgTable.length; i++) {
      if (awgTable[i].section >= section) {
        return awgTable[i].awg;
      }
    }
    
    // Si la sección es mayor que todos los calibres de la tabla, usar el más grande
    return awgTable[awgTable.length - 1].awg;
  };

  const calculateConductor = () => {
    if (!power || !voltage || (calculationMethod === 'drop' && !length)) return;

    const Wtot = parseFloat(power);
    const En = parseFloat(voltage);
    const L = parseFloat(length || '0');
    const Cosθ = parseFloat(powerFactor);
    const FD = parseFloat(demandFactor);
    const ePercent = parseFloat(voltageDropPercent);
    
    let I: number = 0;
    let Ic: number = 0;
    let Ip: number = 0;
    let S: number = 0;
    let newResult: CalculationResult;

    // Cálculo por corriente
    if (calculationMethod === 'current') {
      switch(systemType) {
        case 'monofasico':
          I = Wtot / (En * Cosθ);
          Ic = I * FD;
          Ip = Ic * 1.25;
          break;
        case 'bifasico':
          I = Wtot / (2 * En * Cosθ);
          Ic = I * FD;
          Ip = Ic * 1.25;
          break;
        case 'trifasico':
          if (loadType === 'resistiva') {
            I = Wtot / (Math.sqrt(3) * En);
          } else if (loadType === 'inductiva') {
            I = Wtot / (Math.sqrt(3) * En * Cosθ);
          } else { // general
            I = Wtot / (Math.sqrt(3) * En * Cosθ);
          }
          Ic = I * FD;
          Ip = Ic * 1.25;
          break;
        default:
          break;
      }
      
      newResult = {
        method: 'current',
        current: I,
        correctedCurrent: Ic,
        protectionCurrent: Ip,
        systemType,
        power: Wtot,
        voltage: En,
        powerFactor: Cosθ,
        demandFactor: FD,
        timestamp: new Date()
      };
    } 
    // Cálculo por caída de tensión
    else if (calculationMethod === 'drop') {
      // Primero calculamos la corriente
      switch(systemType) {
        case 'monofasico':
          I = Wtot / (En * Cosθ);
          Ic = I * FD;
          S = (4 * L * Ic) / (En * (ePercent/100));
          break;
        case 'bifasico':
          I = Wtot / (2 * En * Cosθ);
          Ic = I * FD;
          S = (2 * L * Ic) / (En * (ePercent/100));
          break;
        case 'trifasico':
          if (loadType === 'resistiva') {
            I = Wtot / (Math.sqrt(3) * En);
          } else if (loadType === 'inductiva') {
            I = Wtot / (Math.sqrt(3) * En * Cosθ);
          } else { // general
            I = Wtot / (Math.sqrt(3) * En * Cosθ);
          }
          Ic = I * FD;
          S = (2 * L * Ic) / (En * (ePercent/100));
          break;
        default:
          break;
      }
      
      // Convertir sección a AWG
      const awg = calculateAWG(S);
      
      newResult = {
        method: 'drop',
        current: I,
        correctedCurrent: Ic,
        section: S,
        awg: awg,
        systemType,
        power: Wtot,
        voltage: En,
        powerFactor: Cosθ,
        demandFactor: FD,
        length: L,
        voltageDropPercent: ePercent,
        timestamp: new Date()
      };
    } else {
      return;
    }

    setResult(newResult);
    setHistory(prev => [newResult, ...prev.slice(0, 9)]); // Mantener solo los últimos 10 cálculos
  };

  const resetForm = () => {
    setPower('');
    setVoltage('');
    setLength('');
    setResult(null);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('conductorCalculationHistory');
  };

  const copyResultsToClipboard = () => {
    if (!result) return;
    
    let text = `Cálculo de Conductores Eléctricos\n`;
    text += `Sistema: ${systemType === 'monofasico' ? 'Monofásico a 2 Hilos' : systemType === 'bifasico' ? 'Monofásico a 3 Hilos/Bifásico' : 'Trifásico a 3 Hilos'}\n`;
    text += `Potencia total (Wtot): ${result.power} W\n`;
    text += `Tensión (En): ${result.voltage} V\n`;
    text += `Factor de potencia (Cosθ): ${result.powerFactor}\n`;
    text += `Factor de demanda (FD): ${result.demandFactor * 100}%\n`;
    
    if (result.method === 'current') {
      text += `Corriente (I): ${result.current.toFixed(2)} A\n`;
      text += `Corriente corregida (Ic): ${result.correctedCurrent.toFixed(2)} A\n`;
      text += `Corriente de protección (Ip): ${result.protectionCurrent.toFixed(2)} A\n`;
    } else {
      text += `Longitud (L): ${result.length} m\n`;
      text += `Caída de tensión permitida (e%): ${result.voltageDropPercent}%\n`;
      text += `Corriente (I): ${result.current.toFixed(2)} A\n`;
      text += `Corriente corregida (Ic): ${result.correctedCurrent.toFixed(2)} A\n`;
      text += `Sección del conductor (S): ${result.section.toFixed(2)} mm²\n`;
      text += `Calibre AWG recomendado: ${result.awg}\n`;
    }
    
    text += `Fecha: ${result.timestamp.toLocaleString()}`;
    
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Resultados copiados al portapapeles');
      })
      .catch(err => {
        console.error('Error al copiar: ', err);
      });
  };

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    
    let csv = 'Tipo,Fecha,Potencia (W),Tensión (V),Factor de potencia,Factor de demanda,Corriente (A),Corriente corregida (A),';
    
    if (history.some(item => item?.method === 'drop')) {
      csv += 'Longitud (m),Caída de tensión (%),Sección (mm²),AWG,Corriente protección (A)\n';
    } else {
      csv += 'Corriente protección (A)\n';
    }
    
    history.forEach(item => {
      if (!item) return;
      
      csv += `${item.systemType},${item.timestamp.toLocaleString()},${item.power},${item.voltage},${item.powerFactor},${item.demandFactor},${item.current.toFixed(2)},${item.correctedCurrent.toFixed(2)},`;
      
      if (item.method === 'drop') {
        csv += `${item.length},${item.voltageDropPercent},${item.section.toFixed(2)},${item.awg},-\n`;
      } else {
        csv += `-,-,-,-,${item.protectionCurrent.toFixed(2)}\n`;
      }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'historial_calculos_conductores.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-slate-800 rounded-xl text-white">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Zap className="mr-2" /> Calculadora de Conductores Eléctricos
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`p-2 rounded ${showHistory ? 'bg-blue-600' : 'bg-slate-700'} transition flex items-center`}
          >
            <History size={18} className="mr-1" /> Historial
          </button>
          
          {history.length > 0 && (
            <button
              onClick={exportHistoryToCSV}
              className="p-2 rounded bg-slate-700 hover:bg-slate-600 transition flex items-center"
              title="Exportar a CSV"
            >
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 overflow-hidden"
          >
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center">
                  <History className="mr-2" size={18} /> Historial de Cálculos
                </h3>
                <button
                  onClick={clearHistory}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Limpiar historial
                </button>
              </div>
              
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay cálculos en el historial</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {history.map((item, index) => (
                    item && (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 mb-2 bg-slate-800 rounded text-sm"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {item.systemType === 'monofasico' ? 'Monofásico a 2 Hilos' : 
                               item.systemType === 'bifasico' ? 'Monofásico a 3 Hilos/Bifásico' : 'Trifásico a 3 Hilos'} - 
                              {item.method === 'current' ? ' Por corriente' : ' Por caída de tensión'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {item.timestamp.toLocaleString()}
                            </p>
                            <p className="mt-1">
                              {item.power}W / {item.voltage}V / FP: {item.powerFactor} / FD: {item.demandFactor * 100}%
                            </p>
                            <p>
                              I: <span className="text-blue-400">{item.current.toFixed(2)}A</span>
                              {' → '}Ic: <span className="text-blue-400">{item.correctedCurrent.toFixed(2)}A</span>
                              {item.method === 'current' ? (
                                <span> → Ip: <span className="text-green-400">{item.protectionCurrent.toFixed(2)}A</span></span>
                              ) : (
                                <span> → S: <span className="text-green-400">{item.section.toFixed(2)}mm²</span> (AWG {item.awg})</span>
                              )}
                            </p>
                          </div>
                          <button
                            onClick={() => setResult(item)}
                            className="text-blue-400 hover:text-blue-300 text-xs"
                          >
                            Ver
                          </button>
                        </div>
                      </motion.div>
                    )
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Sistema</label>
          <select 
            value={systemType} 
            onChange={(e) => setSystemType(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="monofasico">Monofásico a 2 Hilos</option>
            <option value="bifasico">Monofásico a 3 Hilos/Bifásico</option>
            <option value="trifasico">Trifásico a 3 Hilos</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {systemType === 'monofasico' ? 'Para cargas de 1 a 4,000W' : 
             systemType === 'bifasico' ? 'Para cargas de 4,000 a 8,000W' : 
             'Para cargas mayores a 8,000W'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Método de Cálculo</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setCalculationMethod('current')}
              className={`flex-1 p-2 rounded ${calculationMethod === 'current' ? 'bg-blue-600' : 'bg-slate-700'} transition`}
            >
              Por Corriente
            </button>
            <button
              onClick={() => setCalculationMethod('drop')}
              className={`flex-1 p-2 rounded ${calculationMethod === 'drop' ? 'bg-blue-600' : 'bg-slate-700'} transition`}
            >
              Por Caída de Tensión
            </button>
          </div>
        </div>
      </div>

      {systemType === 'trifasico' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Carga</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setLoadType('general')}
              className={`flex-1 p-2 rounded ${loadType === 'general' ? 'bg-blue-600' : 'bg-slate-700'} transition`}
            >
              General
            </button>
            <button
              onClick={() => setLoadType('resistiva')}
              className={`flex-1 p-2 rounded ${loadType === 'resistiva' ? 'bg-blue-600' : 'bg-slate-700'} transition`}
            >
              Resistiva
            </button>
            <button
              onClick={() => setLoadType('inductiva')}
              className={`flex-1 p-2 rounded ${loadType === 'inductiva' ? 'bg-blue-600' : 'bg-slate-700'} transition`}
            >
              Inductiva
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Potencia Total (Wtot)</label>
          <input 
            type="number" 
            value={power} 
            onChange={(e) => setPower(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 3500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tensión (En)</label>
          <input 
            type="number" 
            value={voltage} 
            onChange={(e) => setVoltage(e.target.value)}
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ej: 127"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Factor de Potencia (Cosθ)</label>
          <input 
            type="number" 
            value={powerFactor} 
            onChange={(e) => setPowerFactor(e.target.value)}
            min="0.1"
            max="1"
            step="0.01"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Factor de Demanda (FD)</label>
          <input 
            type="number" 
            value={demandFactor} 
            onChange={(e) => setDemandFactor(e.target.value)}
            min="0.7"
            max="0.9"
            step="0.01"
            className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {calculationMethod === 'drop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Longitud (L)</label>
              <input 
                type="number" 
                value={length} 
                onChange={(e) => setLength(e.target.value)}
                className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: 25"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Caída de Tensión Permitida (e%)</label>
              <input 
                type="number" 
                value={voltageDropPercent} 
                onChange={(e) => setVoltageDropPercent(e.target.value)}
                min="1"
                max="5"
                step="0.5"
                className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Fórmulas aplicadas */}
      <div className="mb-6 p-4 bg-slate-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Fórmulas aplicadas:</h3>
        <div className="text-xs">
          {systemType === 'monofasico' && (
            <>
              <BlockMath math="I = \frac{Wtot}{En \times Cos\theta}" />
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && (
                <BlockMath math="S = \frac{4 \times L \times Ic}{En \times e\%}" />
              )}
              {calculationMethod === 'current' && (
                <BlockMath math="Ip = Ic \times 1.25" />
              )}
            </>
          )}
          {systemType === 'bifasico' && (
            <>
              <BlockMath math="I = \frac{Wtot}{2 \times En \times Cos\theta}" />
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && (
                <BlockMath math="S = \frac{2 \times L \times Ic}{En \times e\%}" />
              )}
              {calculationMethod === 'current' && (
                <BlockMath math="Ip = Ic \times 1.25" />
              )}
            </>
          )}
          {systemType === 'trifasico' && (
            <>
              {loadType === 'general' && (
                <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times Ef \times Cos\theta}" />
              )}
              {loadType === 'resistiva' && (
                <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times Ef}" />
              )}
              {loadType === 'inductiva' && (
                <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times Ef \times Cos\theta}" />
              )}
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && (
                <BlockMath math="S = \frac{2 \times L \times Ic}{En \times e\%}" />
              )}
              {calculationMethod === 'current' && (
                <BlockMath math="Ip = Ic \times 1.25" />
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="flex space-x-3">
        <button 
          onClick={calculateConductor}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white flex items-center"
        >
          <Calculator className="mr-2" size={18} /> Calcular
        </button>
        
        <button 
          onClick={resetForm}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
        >
          Limpiar
        </button>
      </div>
      
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="mt-6 p-4 bg-slate-900 rounded-lg"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold flex items-center">
                <FileText className="mr-2" /> Resultados
              </h3>
              <button
                onClick={copyResultsToClipboard}
                className="text-blue-400 hover:text-blue-300 flex items-center text-sm"
                title="Copiar resultados"
              >
                <Copy size={16} className="mr-1" /> Copiar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-gray-400">Corriente (I)</p>
                <p className="text-xl font-bold text-blue-400">{result.current.toFixed(2)} A</p>
              </div>
              
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-sm text-gray-400">Corriente Corregida (Ic)</p>
                <p className="text-xl font-bold text-blue-400">{result.correctedCurrent.toFixed(2)} A</p>
                <p className="text-xs text-gray-400 mt-1">(I × FD)</p>
              </div>
              
              {result.method === 'current' ? (
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-sm text-gray-400">Corriente de Protección (Ip)</p>
                  <p className="text-xl font-bold text-green-400">{result.protectionCurrent.toFixed(2)} A</p>
                  <p className="text-xs text-gray-400 mt-1">(Ic × 1.25)</p>
                </div>
              ) : (
                <>
                  <div className="p-3 bg-slate-800 rounded">
                    <p className="text-sm text-gray-400">Sección del Conductor (S)</p>
                    <p className="text-xl font-bold text-green-400">{result.section.toFixed(2)} mm²</p>
                  </div>
                  
                  <div className="p-3 bg-slate-800 rounded">
                    <p className="text-sm text-gray-400">Calibre AWG Recomendado</p>
                    <p className="text-xl font-bold text-yellow-400">{result.awg}</p>
                  </div>
                </>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-slate-800 rounded flex items-start">
              <AlertTriangle className="text-yellow-500 mr-2 mt-0.5" size={16} />
              <p className="text-sm text-gray-300">
                {result.method === 'current' 
                  ? 'Nota: Este cálculo determina la corriente y protección necesaria. Para dimensionamiento completo del conductor, considera también la caída de tensión.'
                  : 'Nota: Este cálculo considera la caída de tensión máxima permitida. Verifica también la capacidad de corriente del conductor seleccionado.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}