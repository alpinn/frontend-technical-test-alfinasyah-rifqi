import type { Product, Supplier, Warehouse } from '@/types'

export const REQUESTERS = [
  'John Doe',
  'Daniel Wong',
  'Aditya Putra',
  'Maya Kusuma',
  'Rizky Pratama',
  'Nadia Halim',
] as const

export const APPROVER_NAME = 'Alex Morgan'

export const warehouses: Warehouse[] = [
  { id: 'wh-main', code: 'WH-MAIN', name: 'Main Warehouse', city: 'Bekasi' },
  { id: 'wh-jkt', code: 'WH-JKT', name: 'Jakarta Hub', city: 'Jakarta' },
  { id: 'wh-sby', code: 'WH-SBY', name: 'Surabaya Depot', city: 'Surabaya' },
  { id: 'wh-mdn', code: 'WH-MDN', name: 'Medan Warehouse', city: 'Medan' },
]

export const products: Product[] = [
  { id: 'p-oil', sku: 'OIL-001', name: 'Industrial Oil', unit: 'PCS', category: 'Lubricant' },
  { id: 'p-glove', sku: 'SAFE-001', name: 'Safety Gloves', unit: 'BOX', category: 'Safety' },
  {
    id: 'p-filter',
    sku: 'FLT-001',
    name: 'Industrial Filter A',
    unit: 'PCS',
    category: 'Spare Part',
  },
  { id: 'p-helmet', sku: 'SAFE-002', name: 'Safety Helmet', unit: 'PCS', category: 'Safety' },
  {
    id: 'p-bearing',
    sku: 'BRG-014',
    name: 'Roller Bearing 6204',
    unit: 'PCS',
    category: 'Spare Part',
  },
  { id: 'p-belt', sku: 'BLT-220', name: 'Conveyor Belt 3m', unit: 'ROLL', category: 'Spare Part' },
  {
    id: 'p-grease',
    sku: 'OIL-004',
    name: 'Lithium Grease 5kg',
    unit: 'PAIL',
    category: 'Lubricant',
  },
  { id: 'p-vest', sku: 'SAFE-007', name: 'Hi-Vis Safety Vest', unit: 'PCS', category: 'Safety' },
  { id: 'p-tape', sku: 'CON-031', name: 'Packing Tape 48mm', unit: 'BOX', category: 'Consumable' },
  {
    id: 'p-pallet',
    sku: 'PLT-100',
    name: 'Plastic Pallet 110x110',
    unit: 'PCS',
    category: 'Handling',
  },
]

export const suppliers: Supplier[] = [
  { id: 'sup-pacific', name: 'Pacific Industrial Supply' },
  { id: 'sup-sentosa', name: 'Sentosa Teknik Mandiri' },
  { id: 'sup-garuda', name: 'Garuda Safety Equipment' },
  { id: 'sup-nusantara', name: 'Nusantara Parts Depot' },
]

export const INITIAL_STOCK: Record<string, number> = {
  'p-oil': 120,
  'p-glove': 46,
  'p-filter': 88,
  'p-helmet': 34,
  'p-bearing': 210,
  'p-belt': 12,
  'p-grease': 27,
  'p-vest': 65,
  'p-tape': 140,
  'p-pallet': 58,
}
