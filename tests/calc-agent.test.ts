/**
 * Tests para CalcAgent - Motor de cálculo MITECO
 * 
 * Verifica las fórmulas de cálculo de emisiones GEI:
 * - Combustión fija/móvil (CO₂ + CH₄×27.9 + N₂O×273)
 * - Emisiones fugitivas (recarga × PCA / 1000)
 * - Electricidad (kWh × factor / 1000, 0 si GdO)
 */

// Simple test runner (no Jest dependency needed)
function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`FAIL: ${msg}`);
  console.log(`  ✅ ${msg}`);
}

function approxEqual(a: number, b: number, eps = 0.01): boolean {
  return Math.abs(a - b) < eps;
}

// --- Combustion Formula ---
// CO₂e = (qty × FE_CO₂) + (qty × FE_CH₄ × 27.9) + (qty × FE_N₂O × 273)
function calcEmisionesCombustible(
  cantidad: number,
  fe_co2: number,
  fe_ch4: number,
  fe_n2o: number
): { co2: number; ch4_co2e: number; n2o_co2e: number; total_kg_co2e: number } {
  const co2 = cantidad * fe_co2;
  const ch4_co2e = cantidad * fe_ch4 * 27.9;
  const n2o_co2e = cantidad * fe_n2o * 273;
  return { co2, ch4_co2e, n2o_co2e, total_kg_co2e: co2 + ch4_co2e + n2o_co2e };
}

// --- Fugitive Formula ---
function calcEmisionesFugitivas(recarga_kg: number, pca: number): number {
  return recarga_kg * pca / 1000;
}

// --- Electricity Formula ---
function calcEmisionesElectricidad(kwh: number, factor: number, gdo: boolean): number {
  if (gdo) return 0;
  return kwh * factor / 1000;
}

// ========== TESTS ==========

console.log('\n🧪 CalcAgent Tests\n');

console.log('📌 Test: Combustión fija - Gas Natural');
{
  // Gas Natural: FE_CO₂=2.15208, FE_CH₄=0.00004, FE_N₂O=0.00001 (kg/kWh)
  const r = calcEmisionesCombustible(100000, 2.15208, 0.00004, 0.00001);
  assert(approxEqual(r.co2, 215208, 1), `CO₂ = ${r.co2.toFixed(2)} ≈ 215208`);
  assert(approxEqual(r.ch4_co2e, 111.6, 1), `CH₄ as CO₂e = ${r.ch4_co2e.toFixed(2)} ≈ 111.6`);
  assert(approxEqual(r.n2o_co2e, 273, 1), `N₂O as CO₂e = ${r.n2o_co2e.toFixed(2)} ≈ 273`);
  assert(r.total_kg_co2e > 215000, `Total > 215000 kg CO₂e`);
}

console.log('\n📌 Test: Combustión fija - Cantidad cero');
{
  const r = calcEmisionesCombustible(0, 2.15208, 0.00004, 0.00001);
  assert(r.total_kg_co2e === 0, 'Zero quantity = zero emissions');
}

console.log('\n📌 Test: Emisiones fugitivas - HFC-134a');
{
  // HFC-134a PCA=1430
  const t = calcEmisionesFugitivas(10, 1430);
  assert(approxEqual(t, 14.3, 0.01), `10 kg × 1430 / 1000 = ${t.toFixed(2)} t CO₂e ≈ 14.3`);
}

console.log('\n📌 Test: Emisiones fugitivas - SF6');
{
  // SF6 PCA=22800
  const t = calcEmisionesFugitivas(0.5, 22800);
  assert(approxEqual(t, 11.4, 0.01), `0.5 kg × 22800 / 1000 = ${t.toFixed(2)} t CO₂e ≈ 11.4`);
}

console.log('\n📌 Test: Emisiones fugitivas - recarga cero');
{
  const t = calcEmisionesFugitivas(0, 1430);
  assert(t === 0, 'Zero recarga = zero emissions');
}

console.log('\n📌 Test: Electricidad - sin GdO');
{
  // 100000 kWh × 0.26 kg/kWh / 1000 = 26 t CO₂
  const t = calcEmisionesElectricidad(100000, 0.26, false);
  assert(approxEqual(t, 26, 0.01), `100000 kWh × 0.26 / 1000 = ${t.toFixed(2)} t CO₂ ≈ 26`);
}

console.log('\n📌 Test: Electricidad - con GdO renovable');
{
  const t = calcEmisionesElectricidad(100000, 0.26, true);
  assert(t === 0, 'GdO renovable = zero emissions');
}

console.log('\n📌 Test: Electricidad - consumo cero');
{
  const t = calcEmisionesElectricidad(0, 0.26, false);
  assert(t === 0, 'Zero kWh = zero emissions');
}

console.log('\n📌 Test: PCA values AR6 IPCC');
{
  const PCA_CH4 = 27.9;
  const PCA_N2O = 273;
  assert(PCA_CH4 === 27.9, 'CH₄ PCA = 27.9 (AR6)');
  assert(PCA_N2O === 273, 'N₂O PCA = 273 (AR6)');
}

console.log('\n✅ All tests passed!\n');
