"use client";
/*
 * Calculadora de conductores eléctricos para instalaciones. Este componente
 * permite calcular la corriente, la sección del conductor, el calibre AWG,
 * la tubería necesaria y el interruptor termomagnético. Además, muestra el
 * desarrollo de las fórmulas en KaTeX y permite exportar los resultados
 * a un archivo PDF. El diseño se adapta a móviles y tabletas usando
 * Tailwind CSS responsivo.
 */

// Marcar explícitamente este componente como cliente para habilitar hooks de estado
// en el entorno de Next.js (carpeta `app`).
// Sin esta directiva, Next trataría el archivo como un componente de servidor.
/* eslint-disable react/react-in-jsx-scope */
import React, { useState, useEffect } from 'react';
import { Zap, Calculator, FileText, AlertTriangle, History, Copy, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import 'katex/dist/katex.min.css';
import { BlockMath } from 'react-katex';
import { jsPDF } from 'jspdf';
import { toPng } from 'html-to-image';
import katex from 'katex';
import { c } from 'node_modules/framer-motion/dist/types.d-Cjd591yU';
import Image from 'next/image';

<Image src={logoPng} alt="Logo" width={100} height={100} />

// Tipado de resultados de cálculo
interface CurrentResult {
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
  awg: string;
  conductorArea: number;
  conduitSize: string;
  insulationType: string;
  installationType: string;
  numberOfConductors: number;
  conduitType: string;
  circuitBreaker: string;
  formulas?: string[];
}



interface DropResult {
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
  conductorArea: number;
  conduitSize: string;
  insulationType: string;
  installationType: string;
  numberOfConductors: number;
  conduitType: string;
  circuitBreaker: string;
  formulas?: string[];
};

type CalculationResult = CurrentResult | DropResult;
type ConductorKind = 'alambres' | 'cables'

// Tablas de datos según el problema original
const TablaNo2 = {
  valores: [
    { calibre: '14', TW: 15, THW: 25, 'Vinanel-Nylon/Vinanel 900': 25, THW_intemperie: 20, Vinanel_Nylon9000_intemperie: 30 },
    { calibre: '12', TW: 20, THW: 30, 'Vinanel-Nylon/Vinanel 900': 30, THW_intemperie: 25, Vinanel_Nylon9000_intemperie: 40 },
    { calibre: '10', TW: 30, THW: 40, 'Vinanel-Nylon/Vinanel 900': 40, THW_intemperie: 40, Vinanel_Nylon9000_intemperie: 55 },
    { calibre: '8', TW: 40, THW: 50, 'Vinanel-Nylon/Vinanel 900': 50, THW_intemperie: 55, Vinanel_Nylon9000_intemperie: 70 },
    { calibre: '6', TW: 55, THW: 70, 'Vinanel-Nylon/Vinanel 900': 70, THW_intemperie: 70, Vinanel_Nylon9000_intemperie: 95 },
    { calibre: '4', TW: 70, THW: 90, 'Vinanel-Nylon/Vinanel 900': 90, THW_intemperie: 85, Vinanel_Nylon9000_intemperie: 135 },
    { calibre: '2', TW: 95, THW: 120, 'Vinanel-Nylon/Vinanel 900': 120, THW_intemperie: 115, Vinanel_Nylon9000_intemperie: 180 },
    { calibre: '0', TW: 125, THW: 155, 'Vinanel-Nylon/Vinanel 900': 155, THW_intemperie: 195, Vinanel_Nylon9000_intemperie: 245 },
    { calibre: '00', TW: 145, THW: 185, 'Vinanel-Nylon/Vinanel 900': 185, THW_intemperie: 225, Vinanel_Nylon9000_intemperie: 285 },
    { calibre: '000', TW: 165, THW: 210, 'Vinanel-Nylon/Vinanel 900': 210, THW_intemperie: 260, Vinanel_Nylon9000_intemperie: 330 },
    { calibre: '0000', TW: 195, THW: 235, 'Vinanel-Nylon/Vinanel 900': 235, THW_intemperie: 300, Vinanel_Nylon9000_intemperie: 385 },
    { calibre: '250 MCM', TW: 215, THW: 270, 'Vinanel-Nylon/Vinanel 900': 270, THW_intemperie: 340, Vinanel_Nylon9000_intemperie: 425 },
    { calibre: '300 MCM', TW: 240, THW: 300, 'Vinanel-Nylon/Vinanel 900': 300, THW_intemperie: 375, Vinanel_Nylon9000_intemperie: 480 },
    { calibre: '350 MCM', TW: 260, THW: 325, 'Vinanel-Nylon/Vinanel 900': 325, THW_intemperie: 420, Vinanel_Nylon9000_intemperie: 530 },
    { calibre: '400 MCM', TW: 280, THW: 360, 'Vinanel-Nylon/Vinanel 900': 360, THW_intemperie: 455, Vinanel_Nylon9000_intemperie: 575 },
    { calibre: '500 MCM', TW: 320, THW: 405, 'Vinanel-Nylon/Vinanel 900': 405, THW_intemperie: 515, Vinanel_Nylon9000_intemperie: 660 }
  ]
} as const;

const TablaNo4 = {
  datos: [
    { diametro_nominal_pulgadas: '1/2', diametro_nominal_mm: 13, pared_delgada_40: 78, pared_delgada_100: 196, pared_gruesa_40: 96, pared_gruesa_100: 240 },
    { diametro_nominal_pulgadas: '3/4', diametro_nominal_mm: 19, pared_delgada_40: 142, pared_delgada_100: 356, pared_gruesa_40: 158, pared_gruesa_100: 392 },
    { diametro_nominal_pulgadas: '1', diametro_nominal_mm: 25, pared_delgada_40: 220, pared_delgada_100: 551, pared_gruesa_40: 250, pared_gruesa_100: 624 },
    { diametro_nominal_pulgadas: '1 1/4', diametro_nominal_mm: 32, pared_delgada_40: 390, pared_delgada_100: 980, pared_gruesa_40: 422, pared_gruesa_100: 1056 },
    { diametro_nominal_pulgadas: '1 1/2', diametro_nominal_mm: 38, pared_delgada_40: 532, pared_delgada_100: 1330, pared_gruesa_40: 570, pared_gruesa_100: 1424 },
    { diametro_nominal_pulgadas: '2', diametro_nominal_mm: 51, pared_delgada_40: 874, pared_delgada_100: 2185, pared_gruesa_40: 926, pared_gruesa_100: 2316 },
    { diametro_nominal_pulgadas: '2 1/2', diametro_nominal_mm: 64, pared_delgada_40: null, pared_delgada_100: null, pared_gruesa_40: 1376, pared_gruesa_100: 3440 },
    { diametro_nominal_pulgadas: '3', diametro_nominal_mm: 76, pared_delgada_40: null, pared_delgada_100: null, pared_gruesa_40: 2116, pared_gruesa_100: 5290 },
    { diametro_nominal_pulgadas: '4', diametro_nominal_mm: 102, pared_delgada_40: 3575, pared_delgada_100: 8938, pared_gruesa_40: 3575, pared_gruesa_100: 8938 },
    { diametro_nominal_pulgadas: '2 1/2 x 2 1/2', diametro_nominal_mm: 65, pared_delgada_40: 1638, pared_delgada_100: 4096, pared_gruesa_40: 1638, pared_gruesa_100: 4096 },
    { diametro_nominal_pulgadas: '4 x 4', diametro_nominal_mm: 100, pared_delgada_40: 4000, pared_delgada_100: 10000, pared_gruesa_40: 4000, pared_gruesa_100: 10000 },
    { diametro_nominal_pulgadas: '6 x 6', diametro_nominal_mm: 150, pared_delgada_40: 9000, pared_delgada_100: 22500, pared_gruesa_40: 9000, pared_gruesa_100: 22500 }
  ]
} as const;

const TablaNo7 = {
  categorias: [
    {
      tipo: 'alambres',
      datos: [
        { calibre: '14', areaCobre_mm2: 2.08, areaTotal_mm2: 5.9, cables: { '2': 11.8, '3': 17.7, '4': 23.6, '5': 29.5, '6': 35.4 } },
        { calibre: '12', areaCobre_mm2: 3.3, areaTotal_mm2: 7.89, cables: { '2': 15.78, '3': 26.67, '4': 31.56, '5': 39.45, '6': 47.34 } },
        { calibre: '10', areaCobre_mm2: 5.27, areaTotal_mm2: 12.32, cables: { '2': 24.64, '3': 36.96, '4': 49.28, '5': 61.6, '6': 73.92 } },
        { calibre: '8', areaCobre_mm2: 8.35, areaTotal_mm2: 21.16, cables: { '2': 42.32, '3': 63.48, '4': 84.64, '5': 105.8, '6': 126.96 } }
      ]
    },
    {
      tipo: 'cables',
      datos: [
        { calibre: '14', areaCobre_mm2: 2.66, areaTotal_mm2: 6.88, cables: { '2': 13.76, '3': 20.64, '4': 27.52, '5': 34.4, '6': 41.28 } },
        { calibre: '12', areaCobre_mm2: 4.23, areaTotal_mm2: 9.29, cables: { '2': 18.58, '3': 27.87, '4': 37.16, '5': 46.45, '6': 55.74 } },
        { calibre: '10', areaCobre_mm2: 6.69, areaTotal_mm2: 13.96, cables: { '2': 29.32, '3': 43.98, '4': 58.64, '5': 73.3, '6': 87.96 } },
        { calibre: '8', areaCobre_mm2: 10.81, areaTotal_mm2: 24.98, cables: { '2': 49.96, '3': 74.94, '4': 99.92, '5': 124.9, '6': 149.88 } },
        { calibre: '6', areaCobre_mm2: 12, areaTotal_mm2: 34.21, cables: { '2': 68.42, '3': 102.63, '4': 136.84, '5': 171.05, '6': 205.26 } },
        { calibre: '4', areaCobre_mm2: 21.24, areaTotal_mm2: 55.15, cables: { '2': 110.3, '3': 165.45, '4': 220.6, '5': 275.75, '6': 330.9 } },
        { calibre: '2', areaCobre_mm2: 43.24, areaTotal_mm2: 77.13, cables: { '2': 154.26, '3': 231.39, '4': 308.52, '5': 385.65, '6': 462.78 } },
        { calibre: '0', areaCobre_mm2: 70.43, areaTotal_mm2: 123.5, cables: { '2': 247, '3': 370.5, '4': 494, '5': 617.5, '6': 741 } },
        { calibre: '00', areaCobre_mm2: 88.91, areaTotal_mm2: 147.62, cables: { '2': 295.24, '3': 442.86, '4': 590.48, '5': 738.1, '6': 885.72 } },
        { calibre: '000', areaCobre_mm2: 111.97, areaTotal_mm2: 176.74, cables: { '2': 353.48, '3': 530.13, '4': 706.84, '5': 883.55, '6': 1060.26 } },
        { calibre: '0000', areaCobre_mm2: 141.23, areaTotal_mm2: 211.24, cables: { '2': 422.48, '3': 633.72, '4': 844.96, '5': 1056.2, '6': 1267.44 } },
        { calibre: '250', areaCobre_mm2: 167.65, areaTotal_mm2: 261.36, cables: { '2': 522.72, '3': 783.9, '4': 1045.2, '5': 1306.5, '6': 1567.8 } },
        { calibre: '300', areaCobre_mm2: 201.06, areaTotal_mm2: 302.64, cables: { '2': 605.28, '3': 907.92, '4': 1210.56, '5': 1513.2, '6': 1815.84 } },
        { calibre: '400', areaCobre_mm2: 268.51, areaTotal_mm2: 384.29, cables: { '2': 768.58, '3': 1152.87, '4': 1537.16, '5': 1921.45, '6': 2305.74 } },
        { calibre: '500', areaCobre_mm2: 334.91, areaTotal_mm2: 463, cables: { '2': 926, '3': 1389, '4': 1852, '5': 2315, '6': 2778 } }
      ]
    }
  ]
} as const;

const TablaNo6 = {
  categorias: [
    {
      tipo: 'alambres',
      datos: [
        { calibre: '14', areaCobre_mm2: 2.08, areaTotal_mm2: 8.30, cables: { '2': 16.60, '3': 24.90, '4': 33.20, '5': 41.50, '6': 49.80 } },
        { calibre: '12', areaCobre_mm2: 3.30, areaTotal_mm2: 10.64, cables: { '2': 21.28, '3': 31.92, '4': 42.56, '5': 53.20, '6': 63.84 } },
        { calibre: '10', areaCobre_mm2: 5.27, areaTotal_mm2: 13.99, cables: { '2': 27.98, '3': 41.97, '4': 55.96, '5': 69.95, '6': 83.94 } },
        { calibre: '8', areaCobre_mm2: 8.35, areaTotal_mm2: 25.70, cables: { '2': 51.40, '3': 77.10, '4': 102.80, '5': 128.50, '6': 154.20 } }
      ]
    },
    {
      tipo: 'cables',
      datos: [
        { calibre: '14', areaCobre_mm2: 2.66, areaTotal_mm2: 9.51, cables: { '2': 19.02, '3': 28.53, '4': 38.04, '5': 47.55, '6': 57.06 } },
        { calibre: '12', areaCobre_mm2: 4.23, areaTotal_mm2: 12.32, cables: { '2': 24.64, '3': 36.96, '4': 49.28, '5': 61.60, '6': 73.92 } },
        { calibre: '10', areaCobre_mm2: 6.83, areaTotal_mm2: 16.40, cables: { '2': 32.80, '3': 49.20, '4': 65.60, '5': 82.00, '6': 98.40 } },
        { calibre: '8', areaCobre_mm2: 10.81, areaTotal_mm2: 29.70, cables: { '2': 59.40, '3': 89.10, '4': 118.80, '5': 148.50, '6': 178.20 } },
        { calibre: '6', areaCobre_mm2: 12.00, areaTotal_mm2: 49.66, cables: { '2': 98.52, '3': 147.78, '4': 197.04, '5': 246.30, '6': 295.56 } },
        { calibre: '4', areaCobre_mm2: 27.24, areaTotal_mm2: 65.61, cables: { '2': 131.22, '3': 196.83, '4': 262.44, '5': 328.05, '6': 393.66 } },
        { calibre: '2', areaCobre_mm2: 43.24, areaTotal_mm2: 89.42, cables: { '2': 178.84, '3': 268.26, '4': 357.68, '5': 447.10, '6': 536.52 } },
        { calibre: '0', areaCobre_mm2: 70.43, areaTotal_mm2: 143.99, cables: { '2': 287.98, '3': 431.97, '4': 575.96, '5': 719.95, '6': 863.94 } },
        { calibre: '00', areaCobre_mm2: 88.91, areaTotal_mm2: 169.72, cables: { '2': 339.44, '3': 509.16, '4': 678.88, '5': 848.60, '6': 1018.32 } },
        { calibre: '000', areaCobre_mm2: 111.97, areaTotal_mm2: 201.06, cables: { '2': 402.12, '3': 603.18, '4': 804.24, '5': 1005.30, '6': 1206.36 } },
        { calibre: '0000', areaCobre_mm2: 141.23, areaTotal_mm2: 239.72, cables: { '2': 479.56, '3': 719.28, '4': 959.00, '5': 1198.72, '6': 1438.88 } },
        { calibre: '250', areaCobre_mm2: 167.65, areaTotal_mm2: 298.65, cables: { '2': 597.30, '3': 895.95, '4': 1194.60, '5': 1493.25, '6': 1791.90 } },
        { calibre: '300', areaCobre_mm2: 201.06, areaTotal_mm2: 343.07, cables: { '2': 686.14, '3': 1029.21, '4': 1372.28, '5': 1715.35, '6': 2058.42 } },
        { calibre: '400', areaCobre_mm2: 268.51, areaTotal_mm2: 430.05, cables: { '2': 860.10, '3': 1290.15, '4': 1720.20, '5': 2150.25, '6': 2580.30 } },
        { calibre: '500', areaCobre_mm2: 334.91, areaTotal_mm2: 514.72, cables: { '2': 1029.44, '3': 1544.16, '4': 2058.88, '5': 2573.60, '6': 3088.32 } }
      ]
    }
  ]
} as const;


const InterruptoresTermomagneticos = {
  interruptores_termomagneticos: [
    {
      tipo: 'UN POLO',
      capacidades: [ { ampere: 15, cantidad: 1 }, { ampere: 20, cantidad: 1 }, { ampere: 30, cantidad: 1 }, { ampere: 40, cantidad: 1 }, { ampere: 50, cantidad: 1 } ]
    },
    {
      tipo: 'DOS POLOS',
      capacidades: [ { ampere: 15, cantidad: 2 }, { ampere: 20, cantidad: 2 }, { ampere: 30, cantidad: 2 }, { ampere: 40, cantidad: 2 }, { ampere: 50, cantidad: 2 }, { ampere: 70, cantidad: 2 } ]
    },
    {
      tipo: 'TRES POLOS',
      capacidades: [ { ampere: 15, cantidad: 3 }, { ampere: 20, cantidad: 3 }, { ampere: 30, cantidad: 3 }, { ampere: 40, cantidad: 3 }, { ampere: 50, cantidad: 3 }, { ampere: 70, cantidad: 3 }, { ampere: 100, cantidad: 3 }, { ampere: 125, cantidad: 3 }, { ampere: 150, cantidad: 3 }, { ampere: 175, cantidad: 3 }, { ampere: 200, cantidad: 3 }, { ampere: 225, cantidad: 3 }, { ampere: 250, cantidad: 3 }, { ampere: 300, cantidad: 3 }, { ampere: 350, cantidad: 3 }, { ampere: 400, cantidad: 3 }, { ampere: 500, cantidad: 3 }, { ampere: 600, cantidad: 3 } ]
    }
  ]
} as const;

// Función auxiliar para calcular el calibre AWG a partir de la sección S
function calculateAWG(S: number, conductorType: string): string {
  const categoria = conductorType === 'cables' ? TablaNo7.categorias[1].datos : TablaNo7.categorias[0].datos;
  const adecuado = categoria.find((item) => item.areaCobre_mm2 >= S);
  return adecuado ? adecuado.calibre : 'No encontrado';
}

const ConductorCalculator: React.FC = () => {
  const [systemType, setSystemType] = useState<string>('monofasico');
  const [power, setPower] = useState<string>('');
  const [voltage, setVoltage] = useState<string>('');
  const [powerFactor, setPowerFactor] = useState<string>('0.9');
  const [demandFactor, setDemandFactor] = useState<string>('0.85');
  const [length, setLength] = useState<string>('');
  const [voltageDropPercent, setVoltageDropPercent] = useState<string>('3');
  const [loadType, setLoadType] = useState<string>('general');
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [calculationMethod, setCalculationMethod] = useState<string>('current');
  const [history, setHistory] = useState<CalculationResult[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [insulationType, setInsulationType] = useState<string>('THW');
  const [installationType, setInstallationType] = useState<string>('interior');
  const [conduitType, setConduitType] = useState<string>('pared_delgada_40');
  const [numberOfConductors, setNumberOfConductors] = useState<string>('1');
  const [conductorType, setConductorType] = useState<ConductorKind>('cables');
  const [formulaSteps, setFormulaSteps] = useState<string[]>([]);

  const [rendimiento, setRendimiento] = useState<string>('1'); // η


  useEffect(() => {
    const savedHistory = localStorage.getItem('conductorCalculationHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as CalculationResult[];
        const historyWithDate = parsed.map((item) => ({ ...item, timestamp: new Date(item.timestamp) }));
        setHistory(historyWithDate);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('conductorCalculationHistory', JSON.stringify(history));
    }
  }, [history]);

   const determineAWGFromCurrent = (correctedCurrent: number): string => {
  let columnName: keyof typeof TablaNo2.valores[number];

  if (installationType === 'intemperie') {
    columnName = insulationType === 'THW'
      ? 'THW_intemperie' as keyof typeof TablaNo2.valores[number]
      : 'Vinanel_Nylon9000_intemperie' as keyof typeof TablaNo2.valores[number];
  } else {
    if (insulationType === 'Vinanel-Nylon' || insulationType === 'Vinanel 900') {
      columnName = 'Vinanel-Nylon/Vinanel 900' as keyof typeof TablaNo2.valores[number];
    } else {
      columnName = insulationType as keyof typeof TablaNo2.valores[number];
    }
  }

  const suitable = TablaNo2.valores.find((item) => {
    const cap = item[columnName] as number;
    return cap >= correctedCurrent;
  });

  return suitable ? suitable.calibre : 'No encontrado';
};


// === Función para calcular área total de conductores ===



  const determineConduitSize = (totalArea: number): string => {
    const suitable = TablaNo4.datos.find((item) => {
      // @ts-ignore
      const area = item[conduitType];
      return area !== null && area >= totalArea;
    });
    return suitable ? `${suitable.diametro_nominal_pulgadas} (${suitable.diametro_nominal_mm} mm)` : 'No encontrado';
  };

  const determineCircuitBreaker = (protectionCurrent: number, sysType: string): string => {
    let breakerType = '';
    if (sysType === 'monofasico') breakerType = 'UN POLO';
    else if (sysType === 'bifasico') breakerType = 'DOS POLOS';
    else if (sysType === 'trifasico') breakerType = 'TRES POLOS';
    else return 'Tipo de sistema no soportado';
    const category = InterruptoresTermomagneticos.interruptores_termomagneticos.find((item) => item.tipo === breakerType);
    if (!category) return 'Categoría de interruptor no encontrada';
    const rounded = Math.ceil(protectionCurrent);
    const capacities = category.capacidades.map((c) => c.ampere).sort((a, b) => a - b);
    const suitableAmp = capacities.find((amp) => amp >= rounded);
    const poles = breakerType === 'UN POLO' ? 1 : breakerType === 'DOS POLOS' ? 2 : 3;
    if (suitableAmp) {
      const lower = capacities.filter((amp) => amp < rounded);
      const immediateLower = lower.length > 0 ? Math.max(...lower) : null;
      if (immediateLower !== null && rounded - immediateLower <= 3) {
        return `${poles} X ${immediateLower}A`;
      }
      return `${poles} X ${suitableAmp}A`;
    }
    const last = category.capacidades[category.capacidades.length - 1];
    return `${poles} X ${last.ampere}A (máximo disponible)`;
  };

  const exportResultsToPDF = async () => {
  if (!result) return;

  const pdf = new jsPDF('p', 'mm', 'letter');
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 40; // dejamos espacio para encabezado
  let y = marginTop;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const usableWidth = pageWidth - marginRight - marginLeft;

  // === Fecha ===
  pdf.setFontSize(10);
  pdf.text(`Fecha: ${new Date().toLocaleString()}`, marginLeft, y);
  y += 12;

  // === Datos de entrada ===
  pdf.setFontSize(14);
  pdf.text('Datos de entrada', marginLeft, y);
  y += 2;
  pdf.setDrawColor(100);
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y, pageWidth - marginRight, y);
  y += 4;

  pdf.setFontSize(11);
  const entradas = [
    `Sistema: ${
      result.systemType === 'monofasico'
        ? 'Monofásico a 2 Hilos'
        : result.systemType === 'bifasico'
        ? 'Monofásico a 3 Hilos/Bifásico'
        : 'Trifásico a 3 Hilos'
    }`,
    `Potencia total (Wtot): ${result.power} W`,
    `Tensión (En): ${result.voltage} V`,
    `Factor de potencia (Cosθ): ${result.powerFactor}`,
    `Factor de demanda (FD): ${result.demandFactor}`,
    `Tipo de aislamiento: ${result.insulationType}`,
    `Tipo de instalación: ${result.installationType === 'interior' ? 'Interior' : 'Intemperie'}`,
    `Número de conductores: ${result.numberOfConductors}`,
    `Tipo de tubería: ${result.conduitType.replace(/_/g, ' ')}`
  ];
  entradas.forEach((line) => {
    pdf.text(`• ${line}`, marginLeft + 2, y);
    y += 6;
  });

  // === Resultados ===
  y += 4;
  pdf.setFontSize(14);
  pdf.text('Resultados', marginLeft, y);
  y += 2;
  pdf.setLineWidth(0.3);
  pdf.line(marginLeft, y, pageWidth - marginRight, y);
  y += 4;

  pdf.setFontSize(11);
  const resultados: string[] = [
    `Corriente (I): ${result.current.toFixed(2)} A`,
    `Corriente corregida (Ic): ${result.correctedCurrent.toFixed(2)} A`
  ];
  if (result.method === 'current') {
    resultados.push(`Corriente de protección (Ip): ${(result as any).protectionCurrent.toFixed(2)} A`);
  } else {
    resultados.push(`Sección del conductor (S): ${(result as any).section.toFixed(2)} mm²`);
  }
  resultados.push(
    `Calibre AWG recomendado: ${result.awg}`,
    `Área total conductores: ${result.conductorArea.toFixed(2)} mm²`,
    `Tubería recomendada: ${result.conduitSize}`,
    `Interruptor termomagnético: ${result.circuitBreaker}`
  );
  resultados.forEach((line) => {
    pdf.text(`• ${line}`, marginLeft + 2, y);
    y += 6;
  });

  // === Fórmulas ===
  if (formulaSteps.length > 0) {
    y += 4;
    pdf.setFontSize(14);
    pdf.text('Desarrollo de las fórmulas', marginLeft, y);
    y += 2;
    pdf.line(marginLeft, y, pageWidth - marginRight, y);
    y += 6;

    for (const step of formulaSteps) {
      const temp = document.createElement('div');
      temp.style.display = 'inline-block';
      temp.style.background = 'white';
      temp.innerHTML = katex.renderToString(step, {
        throwOnError: false,
        displayMode: true
      });
      document.body.appendChild(temp);

      await new Promise((resolve) => requestAnimationFrame(resolve));
      const dataUrl = await toPng(temp, { pixelRatio: 4 });
      document.body.removeChild(temp);

      const desiredWidth = usableWidth * 0.3;
      const imgProps = (pdf as any).getImageProperties(dataUrl);
      const imgHeight = (imgProps.height * desiredWidth) / imgProps.width;

      if (y + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
        pdf.addPage();
        y = marginTop;
      }

      pdf.addImage(dataUrl, 'PNG', marginLeft, y, desiredWidth, imgHeight);
      y += imgHeight + 8;
    }
  }

  // === Nota final ===
  y += 4;
  const noteText =
    result.method === 'current'
      ? 'Nota: Este cálculo determina la corriente y protección necesaria. Para dimensionamiento completo del conductor, considera también la caída de tensión.'
      : 'Nota: Este cálculo considera la caída de tensión máxima permitida. Verifica también la capacidad de corriente del conductor seleccionado.';

  const noteHeight = 16;
  pdf.setFillColor(245, 245, 245);
  pdf.rect(marginLeft, y - 2, usableWidth, noteHeight, 'F');
  pdf.setTextColor(200, 0, 0);
  pdf.setFontSize(12);
  pdf.text(noteText, marginLeft + 2, y + 4, { maxWidth: usableWidth - 4 });

  // === Encabezado y numeración en todas las páginas ===
  const totalPages = (pdf as any).internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // Encabezado con logo y título
    pdf.addImage("/logoPng.png", "PNG", pageWidth - marginRight - 80, 5, 80, 30);
    pdf.setFontSize(18);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Cálculo de Conductores Eléctricos', marginLeft, 30);
    pdf.setDrawColor(100);
    pdf.line(marginLeft, 35, pageWidth - marginRight, 35);

    // Numeración al pie
    const pHeight = pdf.internal.pageSize.getHeight();
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pHeight - 10, { align: 'center' });
  }

  // === Abrir en nueva pestaña ===
  const blobUrl = pdf.output('bloburl');
  window.open(blobUrl, '_blank');
};

  // Tipo auxiliar (opcional)


const calculateTotalConductorArea = (
  awg: string,
  count: number,
  insulation: string,
  conductorType: ConductorKind
): number => {
  const awgStr = awg.toString();

  // Selecciona tabla por aislamiento
  const fuente = insulation === 'Vinanel-Nylon' ? TablaNo7 : TablaNo6;

  // Selecciona categoría por tipo de conductor (alambres/cables)
  const categoria = fuente.categorias.find(c => c.tipo === conductorType) ?? fuente.categorias[0];
  const tabla = categoria.datos;

  // Busca el calibre
  const conductorData = tabla.find((item) => item.calibre.toString() === awgStr);
  if (!conductorData) {
    console.warn(`No se encontró el calibre ${awg} en ${insulation} / ${conductorType}`);
    return 0;
  }

  // Si hay varios conductores, usa la columna de grupos
  if (count > 1 && conductorData.cables) {
    const key = count.toString() as keyof typeof conductorData.cables;
    return conductorData.cables[key] as number;
  }

  // Un solo conductor
  return conductorData.areaTotal_mm2 || 0;
};


  const calculateConductor = () => {
    if (!power || !voltage || (calculationMethod === 'drop' && !length)) return;
    const Wtot = parseFloat(power);
    const En = parseFloat(voltage);
    const Lval = parseFloat(length || '0');
    const Cos = parseFloat(powerFactor);
    const FD = parseFloat(demandFactor);
    const ePerc = parseFloat(voltageDropPercent);
    const conductorCount = parseInt(numberOfConductors);
    let I = 0;
    let Ic = 0;
    let Ip = 0;
    let S = 0;
    let awg = '';
    let conductorArea = 0;
    let conduitSize = '';
    let circuitBreaker = '';
    const formulas: string[] = [];
    if (calculationMethod === 'current') {
      if (systemType === 'monofasico') {
        I = Wtot / (En * Cos);
        formulas.push(`I = \\frac{${Wtot}}{${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
      } else if (systemType === 'bifasico') {
        I = Wtot / (2 * En * Cos);
        formulas.push(`I = \\frac{${Wtot}}{2 \\times ${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
      } else if (systemType === 'trifasico') {
        if (loadType === 'resistiva') {
          I = Wtot / (Math.sqrt(3) * En);
          formulas.push(`I = \\frac{${Wtot}}{\\sqrt{3} \\times ${En}} = ${I.toFixed(2)}\\,A`);
        } else if (loadType === 'inductiva') {
          const eta = parseFloat(rendimiento || '1');
          I = Wtot / (Math.sqrt(3) * Cos * En * eta); // <-- SIN En
          formulas.push(
            `I = \\frac{${Wtot}}{\\sqrt{3} \\times ${Cos} \\times ${En} \\times ${eta}} = ${I.toFixed(2)}\\,A`
          );
        } 
        else {
          I = Wtot / (Math.sqrt(3) * En * Cos);
          formulas.push(`I = \\frac{${Wtot}}{\\sqrt{3} \\times ${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
        }
      }

      Ic = I * FD;
      formulas.push(`I_c = ${I.toFixed(2)} \\times ${FD} = ${Ic.toFixed(2)}\\,A`);
      Ip = Ic * 1.25;
      formulas.push(`I_p = ${Ic.toFixed(2)} \\times 1.25 = ${Ip.toFixed(2)}\\,A`);
      awg = determineAWGFromCurrent(Ic);
      conductorArea = calculateTotalConductorArea(awg, conductorCount, insulationType, conductorType);
      conduitSize = determineConduitSize(conductorArea);
      circuitBreaker = determineCircuitBreaker(Ip, systemType);
    } else if (calculationMethod === 'drop') {
      if (systemType === 'monofasico') {
        I = Wtot / (En * Cos);
        formulas.push(`I = \\frac{${Wtot}}{${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
        Ic = I * FD;
        formulas.push(`I_c = ${I.toFixed(2)} \\times ${FD} = ${Ic.toFixed(2)}\\,A`);
        S = (4 * Lval * Ic) / (En * (ePerc / 100));
        formulas.push(`S = \\frac{4 \\times ${Lval} \\times ${Ic.toFixed(2)}}{${En} \\times ${ePerc}\\%} = ${S.toFixed(2)}\\,\\text{mm}^2`);
        Ip = Ic * 1.25;
      } else if (systemType === 'bifasico') {
        I = Wtot / (2 * En * Cos);
        formulas.push(`I = \\frac{${Wtot}}{2 \\times ${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
        Ic = I * FD;
        formulas.push(`I_c = ${I.toFixed(2)} \\times ${FD} = ${Ic.toFixed(2)}\\,A`);
        S = (2 * Lval * Ic) / (En * (ePerc / 100));
        formulas.push(`S = \\frac{2 \\times ${Lval} \\times ${Ic.toFixed(2)}}{${En} \\times ${ePerc}\\%} = ${S.toFixed(2)}\\,\\text{mm}^2`);
        Ip = Ic * 1.25;
        } else if (systemType === 'trifasico') {
          if (loadType === 'resistiva') {
            I = Wtot / (Math.sqrt(3) * En);
            formulas.push(`I = \\frac{${Wtot}}{\\sqrt{3} \\times ${En}} = ${I.toFixed(2)}\\,A`);
          } else if (loadType === 'inductiva') {
            const eta = parseFloat(rendimiento || '1');
            I = Wtot / (Math.sqrt(3) * Cos * En * eta); // 👈 SIN En
            formulas.push(
              `I = \\frac{${Wtot}}{\\sqrt{3} \\times ${Cos} \\times ${En} \\times ${eta}} = ${I.toFixed(2)}\\,A`
            );
          } else {
            I = Wtot / (Math.sqrt(3) * En * Cos);
            formulas.push(`I = \\frac{${Wtot}}{\\sqrt{3} \\times ${En} \\times ${Cos}} = ${I.toFixed(2)}\\,A`);
          }

          Ic = I * FD;
          formulas.push(`I_c = ${I.toFixed(2)} \\times ${FD} = ${Ic.toFixed(2)}\\,A`);
          S = (2 * Lval * Ic) / (En * (ePerc / 100));
          formulas.push(
            `S = \\frac{2 \\times ${Lval} \\times ${Ic.toFixed(2)}}{${En} \\times ${ePerc}\\%} = ${S.toFixed(2)}\\,\\text{mm}^2`
          );
          Ip = Ic * 1.25;
        }

      awg = calculateAWG(S, conductorType);
      conductorArea = calculateTotalConductorArea(awg, conductorCount, insulationType, conductorType);
      conduitSize = determineConduitSize(conductorArea);
      circuitBreaker = determineCircuitBreaker(Ip, systemType);
    }
    const newResult: CalculationResult = calculationMethod === 'current'
      ? {
          method: 'current',
          current: I,
          correctedCurrent: Ic,
          protectionCurrent: Ip,
          systemType,
          power: Wtot,
          voltage: En,
          powerFactor: Cos,
          demandFactor: FD,
          timestamp: new Date(),
          awg,
          conductorArea,
          conduitSize,
          insulationType,
          installationType,
          numberOfConductors: conductorCount,
          conduitType,
          circuitBreaker
        }
      : {
          method: 'drop',
          current: I,
          correctedCurrent: Ic,
          section: S,
          awg,
          systemType,
          power: Wtot,
          voltage: En,
          powerFactor: Cos,
          demandFactor: FD,
          length: Lval,
          voltageDropPercent: ePerc,
          timestamp: new Date(),
          conductorArea,
          conduitSize,
          insulationType,
          installationType,
          numberOfConductors: conductorCount,
          conduitType,
          circuitBreaker
        };
    setResult(newResult);
    setHistory((prev) => [newResult, ...prev.slice(0, 9)]);

    console.log('Formulas usadas:', formulas);

    setFormulaSteps(formulas);
  };

  const resetForm = () => {
    setPower('');
    setVoltage('');
    setLength('');
    setResult(null);
    setFormulaSteps([]);
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
    text += `Tipo de aislamiento: ${result.insulationType}\n`;
    text += `Tipo de instalación: ${result.installationType === 'interior' ? 'Interior' : 'Intemperie'}\n`;
    text += `Número de conductores: ${result.numberOfConductors}\n`;
    text += `Tipo de tubería: ${result.conduitType.replace(/_/g, ' ')}\n`;
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
    }
    text += `Calibre AWG recomendado: ${result.awg}\n`;
    text += `Área total conductores: ${result.conductorArea.toFixed(2)} mm²\n`;
    text += `Tubería recomendada: ${result.conduitSize}\n`;
    text += `Interruptor termomagnético: ${result.circuitBreaker}\n`;
    text += `Fecha: ${result.timestamp.toLocaleString()}`;
    navigator.clipboard.writeText(text).then(() => alert('Resultados copiados al portapapeles')).catch(console.error);
  };

  const exportHistoryToCSV = () => {
    if (history.length === 0) return;
    let csv = 'Tipo,Fecha,Potencia (W),Tensión (V),Factor de potencia,Factor de demanda,Aislamiento,Instalación,Conductores,Tubería,Corriente (A),Corriente corregida (A),';
    if (history.some((i) => i.method === 'drop')) {
      csv += 'Longitud (m),Caída de tensión (%),Sección (mm²),AWG,Área (mm²),Tubería Recomendada,Corriente protección (A)\n';
    } else {
      csv += 'AWG,Área (mm²),Tubería Recomendada,Corriente protección (A)\n';
    }
    history.forEach((item) => {
      if (!item) return;
      csv += `${item.systemType},${item.timestamp.toLocaleString()},${item.power},${item.voltage},${item.powerFactor},${item.demandFactor},${item.insulationType},${item.installationType},${item.numberOfConductors},${item.conduitType},${item.current.toFixed(2)},${item.correctedCurrent.toFixed(2)},`;
      if (item.method === 'drop') {
        const dropItem = item as DropResult;
        csv += `${dropItem.length},${dropItem.voltageDropPercent},${dropItem.section.toFixed(2)},${dropItem.awg},${dropItem.conductorArea.toFixed(2)},${dropItem.conduitSize},-\n`;
      } else {
        const curItem = item as CurrentResult;
        csv += `${curItem.awg},${curItem.conductorArea.toFixed(2)},${curItem.conduitSize},${curItem.protectionCurrent.toFixed(2)}\n`;
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
    <div className="p-4 sm:p-6 bg-slate-800 rounded-xl text-white max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-2 sm:space-y-0">
        <h2 className="text-lg sm:text-xl font-semibold flex items-center">
          <Zap className="mr-2" /> Calculadora de Conductores Eléctricos
        </h2>
        <div className="flex space-x-2">
          <button onClick={() => setShowHistory(!showHistory)} className={`p-2 rounded ${showHistory ? 'bg-blue-600' : 'bg-slate-700'} transition flex items-center`}>
            <History size={18} className="mr-1" /> Historial
          </button>
          {history.length > 0 && (
            <button onClick={exportHistoryToCSV} className="p-2 rounded bg-slate-700 hover:bg-slate-600 transition flex items-center" title="Exportar a CSV">
              <Download size={18} />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="mb-6 overflow-hidden">
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold flex items-center">
                  <History className="mr-2" size={18} /> Historial de Cálculos
                </h3>
                <button onClick={clearHistory} className="text-xs text-red-400 hover:text-red-300">Limpiar historial</button>
              </div>
              {history.length === 0 ? (
                <p className="text-gray-400 text-sm">No hay cálculos en el historial</p>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {history.map((item, index) => (
                    item && (
                      <motion.div key={index} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="p-3 mb-2 bg-slate-800 rounded text-sm">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="font-medium">
                              {item.systemType === 'monofasico' ? 'Monofásico a 2 Hilos' : item.systemType === 'bifasico' ? 'Monofásico a 3 Hilos/Bifásico' : 'Trifásico a 3 Hilos'} - {item.method === 'current' ? ' Por corriente' : ' Por caída de tensión'}
                            </p>
                            <p className="text-gray-400 text-xs">{item.timestamp.toLocaleString()}</p>
                            <p>
                              {item.power}W / {item.voltage}V / FP: {item.powerFactor} / FD: {item.demandFactor * 100}%
                            </p>
                            <p>
                              I: <span className="text-blue-400">{item.current.toFixed(2)}A</span> → Ic: <span className="text-blue-400">{item.correctedCurrent.toFixed(2)}A</span>
                              {item.method === 'current' ? (
                                <span> → Ip: <span className="text-green-400">{(item as CurrentResult).protectionCurrent.toFixed(2)}A</span></span>
                              ) : (
                                <span> → S: <span className="text-green-400">{(item as DropResult).section.toFixed(2) || 'N/A'}mm²</span></span>
                              )}
                            </p>
                            <p>
                              AWG: <span className="text-yellow-400">{item.awg}</span> → Área: <span className="text-yellow-400">{item.conductorArea.toFixed(2)}</span>mm² → Tubería: <span className="text-yellow-400">{item.conduitSize}</span>
                            </p>
                          </div>
                          <button onClick={() => setResult(item)} className="text-blue-400 hover:text-blue-300 text-xs">Ver</button>
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
      {/* Formulario */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Sistema</label>
          <select value={systemType} onChange={(e) => setSystemType(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="monofasico">Monofásico a 2 Hilos</option>
            <option value="bifasico">Monofásico a 3 Hilos/Bifásico</option>
            <option value="trifasico">Trifásico a 3 Hilos</option>
          </select>
          <p className="text-xs text-gray-400 mt-1">
            {systemType === 'monofasico' ? 'Para cargas de 1 a 4,000W' : systemType === 'bifasico' ? 'Para cargas de 4,000 a 8,000W' : 'Para cargas mayores a 8,000W'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Método de Cálculo</label>
          <div className="flex space-x-2">
            <button onClick={() => setCalculationMethod('current')} className={`flex-1 p-2 rounded ${calculationMethod === 'current' ? 'bg-blue-600' : 'bg-slate-700'} transition`}>Por Corriente</button>
            <button onClick={() => setCalculationMethod('drop')} className={`flex-1 p-2 rounded ${calculationMethod === 'drop' ? 'bg-blue-600' : 'bg-slate-700'} transition`}>Por Caída de Tensión</button>
          </div>
        </div>
      </div>
      {systemType === 'trifasico' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Carga</label>
          <div className="flex space-x-2">
            <button onClick={() => setLoadType('general')} className={`flex-1 p-2 rounded ${loadType === 'general' ? 'bg-blue-600' : 'bg-slate-700'} transition`}>General</button>
            <button onClick={() => setLoadType('resistiva')} className={`flex-1 p-2 rounded ${loadType === 'resistiva' ? 'bg-blue-600' : 'bg-slate-700'} transition`}>Resistiva</button>
            <button onClick={() => setLoadType('inductiva')} className={`flex-1 p-2 rounded ${loadType === 'inductiva' ? 'bg-blue-600' : 'bg-slate-700'} transition`}>Inductiva</button>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Potencia Total (Wtot)</label>
          <input type="number" value={power} onChange={(e) => setPower(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: 3500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tensión (En)</label>
          <input type="number" value={voltage} onChange={(e) => setVoltage(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: 127" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Factor de Potencia (Cosθ)</label>
          <input type="number" value={powerFactor} onChange={(e) => setPowerFactor(e.target.value)} min="0.1" max="1" step="0.01" className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Factor de Demanda (FD)</label>
          <input type="number" value={demandFactor} onChange={(e) => setDemandFactor(e.target.value)} min="0.7" max="0.9" step="0.01" className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        {calculationMethod === 'drop' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Longitud (L)</label>
              <input type="number" value={length} onChange={(e) => setLength(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Ej: 25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Caída de Tensión Permitida (e%)</label>
              <input type="number" value={voltageDropPercent} onChange={(e) => setVoltageDropPercent(e.target.value)} min="1" max="5" step="0.5" className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Aislamiento</label>
          <select value={insulationType} onChange={(e) => setInsulationType(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="TW">TW</option>
            <option value="THW">THW</option>
            <option value="Vinanel 900">Vinanel 900</option>
            <option value="Vinanel-Nylon">Vinanel-Nylon</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Instalación</label>
          <select value={installationType} onChange={(e) => setInstallationType(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="interior">Interior</option>
            <option value="intemperie">Intemperie</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Número de Conductores</label>
          <select value={numberOfConductors} onChange={(e) => setNumberOfConductors(e.target.value)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Conductor</label>
          <select value={conductorType} onChange={(e) => setConductorType(e.target.value as ConductorKind)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="alambres">Alambres</option>
            <option value="cables">Cables</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tipo de Tubería</label>
          <select value={conduitType} onChange={(e) => setConduitType(e.target.value as ConductorKind)} className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="pared_delgada_40">Pared Delgada 40%</option>
            <option value="pared_delgada_100">Pared Delgada 100%</option>
            <option value="pared_gruesa_40">Pared Gruesa 40%</option>
            <option value="pared_gruesa_100">Pared Gruesa 100%</option>
          </select>
        </div>
        
        {systemType === 'trifasico' && loadType === 'inductiva' && (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">Rendimiento (η)</label>
    <input
      type="number"
      value={rendimiento}
      onChange={(e) => setRendimiento(e.target.value)}
      step="0.01"
      min="0.1"
      max="1"
      className="w-full p-2 rounded bg-slate-700 text-white border border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  </div>
)}

        
      </div>
      <div className="mb-6 p-4 bg-slate-900 rounded-lg">
        <h3 className="text-sm font-medium text-gray-300 mb-2">Fórmulas aplicadas:</h3>
        <div className="text-xs space-y-1">
          {systemType === 'monofasico' && (
            <>
              <BlockMath math="I = \frac{Wtot}{En \times Cos\theta}" />
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && <BlockMath math="S = \frac{4 \times L \times Ic}{En \times e\%}" />}
              {calculationMethod === 'current' && <BlockMath math="Ip = Ic \times 1.25" />}
            </>
          )}
          {systemType === 'bifasico' && (
            <>
              <BlockMath math="I = \frac{Wtot}{2 \times En \times Cos\theta}" />
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && <BlockMath math="S = \frac{2 \times L \times Ic}{En \times e\%}" />}
              {calculationMethod === 'current' && <BlockMath math="Ip = Ic \times 1.25" />}
            </>
          )}
           {systemType === 'trifasico' && (
            <>
              {loadType === 'general' && <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times En \times Cos\theta}" />}
              {loadType === 'resistiva' && <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times En}" />}
              {loadType === 'inductiva' && (
                <BlockMath math="I = \frac{Wtot}{\sqrt{3} \times En \times Cos\theta \times \eta}" />
              )}
              <BlockMath math="Ic = I \times FD" />
              {calculationMethod === 'drop' && <BlockMath math="S = \frac{2 \times L \times Ic}{En \times e\%}" />}
              {calculationMethod === 'current' && <BlockMath math="Ip = Ic \times 1.25" />}
            </>
          )}


        </div>
      </div>
      <div className="flex space-x-3 mb-6">
        <button onClick={calculateConductor} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">
          <Calculator className="mr-2" size={18} /> Calcular
        </button>
        <button onClick={resetForm} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white text-sm">Limpiar</button>
      </div>
      <AnimatePresence>
        {result && (
          <motion.div id="pdf-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.3 }} className="mt-6 p-4 bg-slate-900 rounded-lg space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-semibold flex items-center">
                <FileText className="mr-2" /> Resultados
              </h3>
              <div className="flex space-x-2">
                <button onClick={copyResultsToClipboard} className="text-blue-400 hover:text-blue-300 flex items-center text-xs sm:text-sm" title="Copiar resultados">
                  <Copy size={16} className="mr-1" /> Copiar
                </button>
                <button onClick={exportResultsToPDF} className="text-green-400 hover:text-green-300 flex items-center text-xs sm:text-sm" title="Exportar resultados a PDF">
                  <Download size={16} className="mr-1" /> PDF
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-xs text-gray-400">Corriente (I)</p>
                <p className="text-lg font-bold text-blue-400">{result.current.toFixed(2)} A</p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-xs text-gray-400">Corriente Corregida (Ic)</p>
                <p className="text-lg font-bold text-blue-400">{result.correctedCurrent.toFixed(2)} A</p>
                <p className="text-xs text-gray-400 mt-1">(I × FD)</p>
              </div>
              {result.method === 'current' ? (
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-xs text-gray-400">Corriente de Protección (Ip)</p>
                  <p className="text-lg font-bold text-green-400">{(result as CurrentResult).protectionCurrent.toFixed(2)} A</p>
                  <p className="text-xs text-gray-400 mt-1">(Ic × 1.25)</p>
                </div>
              ) : (
                <div className="p-3 bg-slate-800 rounded">
                  <p className="text-xs text-gray-400">Sección del Conductor (S)</p>
                  <p className="text-lg font-bold text-green-400">{(result as DropResult).section.toFixed(2)} mm²</p>
                </div>
              )}
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-xs text-gray-400">Calibre AWG Recomendado</p>
                <p className="text-lg font-bold text-yellow-400">{result.awg}</p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-xs text-gray-400">Área Total Conductores</p>
                <p className="text-lg font-bold text-blue-400">{result.conductorArea.toFixed(2)} mm²</p>
              </div>
              <div className="p-3 bg-slate-800 rounded">
                <p className="text-xs text-gray-400">Tubería Recomendada (T.D)</p>
                <p className="text-lg font-bold text-green-400">{result.conduitSize}</p>
              </div>
            </div>
            <div className="p-3 bg-slate-800 rounded">
              <p className="text-xs text-gray-400">Interruptor Termomagnético</p>
              <p className="text-lg font-bold text-purple-400">{result.circuitBreaker}</p>
            </div>
            {formulaSteps.length > 0 && (
              <div className="p-3 bg-slate-800 rounded space-y-1">
                <h4 className="text-sm font-medium text-gray-300 mb-1">Desarrollo de las fórmulas:</h4>
                {formulaSteps.map((formula, idx) => (
                  <BlockMath key={idx} math={formula} />
                ))}
              </div>
            )}
            <div className="p-3 bg-slate-800 rounded flex items-start">
              <AlertTriangle className="text-yellow-500 mr-2 mt-0.5" size={16} />
              <p className="text-xs sm:text-sm text-gray-300">
                {result.method === 'current'
                  ? ''
                  : ''}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Este es el contenedor oculto para las fórmulas */}
      <div
        id="formula-container"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px', opacity: 0 }}
      >
        {formulaSteps.map((step, index) => (
          <BlockMath key={index} math={step} />
        ))}
      </div>
    </div>
  );
};

export default ConductorCalculator;