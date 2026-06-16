/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, Producer, Product, Selo, Category, Order, ChatMessage, Review } from "./types";

// Fictional Green City: Hortolândia
// Coordinates centered around (0, 0) for simplified relative distances (1 decimal degree ≈ 10km grid for simple demo)
// Distance utility function: math Euclidean × 111km to get extremely realistic distances!

export function getCoordinatesForCity(city: string, state: string): { latitude: number; longitude: number } {
  const c = city.toLowerCase().trim();
  const s = state.toUpperCase().trim();
  
  if (c === "rio de janeiro" || c === "rio" || c.includes("capital")) {
    return { latitude: -22.9068, longitude: -43.1729 };
  }
  if (c.includes("queimados")) {
    return { latitude: -22.7160, longitude: -43.5570 };
  }
  if (c.includes("nova iguaçu") || c.includes("nova iguacu")) {
    return { latitude: -22.7562, longitude: -43.4608 };
  }
  if (c.includes("belford roxo")) {
    return { latitude: -22.7641, longitude: -43.3989 };
  }
  if (c.includes("duque de caxias") || c.includes("caxias")) {
    return { latitude: -22.7856, longitude: -43.3117 };
  }
  if (c.includes("niterói") || c.includes("niteroi")) {
    return { latitude: -22.8858, longitude: -43.1153 };
  }
  if (c.includes("petrópolis") || c.includes("petropolis")) {
    return { latitude: -22.5049, longitude: -43.1803 };
  }
  if (c.includes("teresópolis") || c.includes("teresopolis")) {
    return { latitude: -22.4121, longitude: -42.9664 };
  }
  if (c.includes("miguel pereira")) {
    return { latitude: -22.4547, longitude: -43.4797 };
  }
  if (c.includes("vassouras")) {
    return { latitude: -22.4042, longitude: -43.6625 };
  }
  
  if (s === "RJ" || s.includes("RIO")) {
    return { latitude: -22.7160, longitude: -43.5570 };
  }
  
  if (c.includes("limeira")) {
    return { latitude: -22.5646, longitude: -47.4014 };
  }
  if (c.includes("hortolândia") || c.includes("hortolandia")) {
    return { latitude: -22.8600, longitude: -47.2200 };
  }
  if (c.includes("campinas")) {
    return { latitude: -22.9056, longitude: -47.0608 };
  }
  if (c.includes("são paulo") || c.includes("sao paulo") || c === "sp") {
    return { latitude: -23.5505, longitude: -46.6333 };
  }
  
  return { latitude: -22.7160, longitude: -43.5570 };
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export const INITIAL_SELOS: Selo[] = [
  {
    id: "selo_1",
    name: "Agricultura Familiar",
    description: "Cultivado por pequenos agricultores locais e cooperativas familiares.",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    icon: "Leaf",
  },
  {
    id: "selo_2",
    name: "Produção Artesanal",
    description: "Feito à mão, com técnicas tradicionais e sem conservantes.",
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: "Hammer",
  },
  {
    id: "selo_3",
    name: "Entrega Rápida",
    description: "Entregas concluídas no mesmo dia da colheita ou produção.",
    color: "bg-sky-100 text-sky-800 border-sky-300",
    icon: "Truck",
  },
  {
    id: "selo_4",
    name: "Produção Sustentável",
    description: "Práticas agrícolas agroecológicas ou sem defensivos e pesticidas químicos.",
    color: "bg-teal-100 text-teal-800 border-teal-300",
    icon: "Sprout",
  },
  {
    id: "selo_5",
    name: "Produtor Local",
    description: "Localizado em um raio de até 5km da praça central da cidade.",
    color: "bg-indigo-100 text-indigo-800 border-indigo-300",
    icon: "MapPin",
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: "cat_1", name: "Hortaliças", slug: "hortalicas" },
  { id: "cat_2", name: "Frutas", slug: "frutas" },
  { id: "cat_3", name: "Legumes", slug: "legumes" },
  { id: "cat_4", name: "Ovos", slug: "ovos" },
  { id: "cat_5", name: "Leite", slug: "leite" },
  { id: "cat_6", name: "Queijos", slug: "queijos" },
  { id: "cat_7", name: "Carnes", slug: "carnes" },
  { id: "cat_8", name: "Mel", slug: "mel" },
  { id: "cat_9", name: "Artesanato", slug: "artesanato" },
  { id: "cat_10", name: "Produtos Beneficiados", slug: "produtos-beneficiados" },
  { id: "cat_11", name: "Cesta de Produtos", slug: "cesta-de-produtos" },
];

export const INITIAL_USERS: User[] = [
  {
    id: "user_vivian",
    name: "Vivian dos Santos Nogueira",
    cpf: "141.730.087-67",
    birthDate: "1994-08-18",
    email: "vivian.nogueira18@gmail.com",
    phone: "(21) 98888-8888",
    isActive: true,
    isClient: true,
    isProducer: true,
    selectedAddressId: "addr_vivian",
    password: "admin",
    addresses: [
      {
        id: "addr_vivian",
        label: "Sítio Vivian - Sede 🏡",
        street: "Estrada do Sol",
        number: "450",
        neighborhood: "Zona Rural",
        city: "Queimados",
        state: "RJ",
        zipCode: "26385-230",
        latitude: -22.7161,
        longitude: -43.5576,
      }
    ],
    followedProducerIds: [],
    favoriteProductIds: []
  },
  {
    id: "user_jose",
    name: "José da Silva (Consumidor)",
    cpf: "222.333.444-55",
    birthDate: "1988-03-24",
    email: "jose@gmail.com",
    phone: "(21) 97777-7777",
    isActive: true,
    isClient: true,
    isProducer: false,
    selectedAddressId: "addr_jose",
    password: "123456",
    addresses: [
      {
        id: "addr_jose",
        label: "Minha Casa 🏠",
        street: "Rua Olímpia Silva",
        number: "12",
        neighborhood: "Centro",
        city: "Queimados",
        state: "RJ",
        zipCode: "26325-010",
        latitude: -22.7123,
        longitude: -43.5532,
      }
    ],
    followedProducerIds: [],
    favoriteProductIds: []
  }
];

export const INITIAL_PRODUCERS: Producer[] = [];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_CHAT: ChatMessage[] = [];


