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
    followedProducerIds: ["producer_manoel"],
    favoriteProductIds: ["prod_1", "prod_5"]
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
  },
  {
    id: "producer_manoel",
    name: "Seu Manoel (Marambaia)",
    cpf: "333.444.555-66",
    birthDate: "1965-11-12",
    email: "manoel@marambaia.com",
    phone: "(21) 91111-2222",
    isActive: true,
    isClient: true,
    isProducer: true,
    selectedAddressId: "addr_manoel",
    password: "123456",
    addresses: [
      {
        id: "addr_manoel",
        label: "Sítio Marambaia 🚜",
        street: "Estrada da Marambaia",
        number: "KM 4",
        neighborhood: "Vila Marambaia",
        city: "Queimados",
        state: "RJ",
        zipCode: "26380-000",
        latitude: -22.7302,
        longitude: -43.5421,
      }
    ],
    followedProducerIds: [],
    favoriteProductIds: []
  },
  {
    id: "producer_maria",
    name: "Rancho das Cabras Felizes",
    cpf: "444.555.666-77",
    birthDate: "1972-05-15",
    email: "maria@ranchocabras.com",
    phone: "(21) 93333-4444",
    isActive: true,
    isClient: true,
    isProducer: true,
    selectedAddressId: "addr_maria",
    password: "123456",
    addresses: [
      {
        id: "addr_maria",
        label: "Rancho Macaco 🐐",
        street: "Caminho do Macaco",
        number: "S/N",
        neighborhood: "Paraíso",
        city: "Queimados",
        state: "RJ",
        zipCode: "26390-100",
        latitude: -22.7011,
        longitude: -43.5714,
      }
    ],
    followedProducerIds: [],
    favoriteProductIds: []
  }
];

export const INITIAL_PRODUCERS: Producer[] = [
  {
    id: "user_vivian",
    propertyName: "Sítio Agroecológico da Vivian",
    address: "Estrada do Sol, 450 - Zona Rural, Queimados - RJ",
    latitude: -22.7161,
    longitude: -43.5576,
    logoUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150",
    coverUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800",
    description: "Cultivo agroecológico focado em hortaliças nobres, PANCs e conservação florestal.",
    openingHours: "Terça a Sábado: 08:00h às 17:00h",
    whatsapp: "21988888888",
    instagram: "vivian_agroecologia",
    showPhonePublicly: true,
    deliveryOption: "both",
    deliveryRadiusKm: 15,
    deliveryFeeFee: 5,
    ratingAverage: 5.0,
    ratingCount: 1,
    seloIds: ["selo_1", "selo_4"],
    productionTypes: ["agroecologica"],
    isSuspended: false,
  },
  {
    id: "producer_manoel",
    propertyName: "Sítio Verde Marambaia",
    address: "Estrada da Marambaia, KM 4 - Vila Marambaia, Queimados - RJ",
    latitude: -22.7302,
    longitude: -43.5421,
    logoUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=150",
    coverUrl: "https://images.unsplash.com/photo-1523301343968-6a6ebfc743ee?auto=format&fit=crop&q=80&w=800",
    description: "Legumes frescos colhidos sob encomenda direta. Sem agrotóxicos e regado com água de nascente pura.",
    openingHours: "Segunda a Sexta: 07:00h às 15:00h",
    whatsapp: "21911112222",
    instagram: "sitio_verdemarambaia",
    showPhonePublicly: true,
    deliveryOption: "both",
    deliveryRadiusKm: 12,
    deliveryFeeFee: 6,
    ratingAverage: 4.8,
    ratingCount: 4,
    seloIds: ["selo_1", "selo_3", "selo_4"],
    productionTypes: ["organica"],
    isSuspended: false,
  },
  {
    id: "producer_maria",
    propertyName: "Rancho das Cabras Felizes",
    address: "Caminho do Macaco, S/N - Paraíso, Queimados - RJ",
    latitude: -22.7011,
    longitude: -43.5714,
    logoUrl: "https://images.unsplash.com/photo-1545464155-7edf99480dc2?auto=format&fit=crop&q=80&w=150",
    coverUrl: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&q=80&w=800",
    description: "Queijos finos artesanais de cabra ricos em sabor e leite fresco de produção própria com manejo gentil.",
    openingHours: "Quarta a Domingo: 09:00h às 18:00h",
    whatsapp: "21933334444",
    instagram: "cabras_felizes_rj",
    showPhonePublicly: false,
    deliveryOption: "pickup",
    deliveryRadiusKm: 10,
    deliveryFeeFee: 0,
    ratingAverage: 4.9,
    ratingCount: 7,
    seloIds: ["selo_2", "selo_5"],
    productionTypes: ["artesanal"],
    isSuspended: false,
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    producerId: "user_vivian",
    name: "Alface Crespa Agroecológica",
    category: "cat_1",
    description: "Colhida fresquinha logo cedo, sem adição de defensivos químicos. Folhas firmes e saborosas.",
    imageUrl: "https://images.unsplash.com/photo-1556814215-6a22e89dbbd4?auto=format&fit=crop&q=80&w=300",
    price: 4.50,
    unit: "Pé",
    isVisible: true,
    harvestedToday: true,
    viewsCount: 22,
    ordersCount: 8,
  },
  {
    id: "prod_2",
    producerId: "user_vivian",
    name: "Cesta de Hortaliças Clássica",
    category: "cat_1",
    description: "Cesta mista contendo rúcula, alface, cheiro-verde e couve-manteiga para a semana.",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300",
    price: 22.00,
    unit: "Cesta",
    isVisible: true,
    harvestedToday: false,
    viewsCount: 45,
    ordersCount: 15,
  },
  {
    id: "prod_3",
    producerId: "producer_manoel",
    name: "Tomate Italiano Orgânico",
    category: "cat_3",
    description: "Tomates colhidos maduros no pé, perfeitos para molhos encorpados ou saladas rústicas.",
    imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=300",
    price: 8.90,
    unit: "Kg",
    isVisible: true,
    harvestedToday: true,
    viewsCount: 38,
    ordersCount: 12,
  },
  {
    id: "prod_4",
    producerId: "producer_manoel",
    name: "Cenoura Doce da Marambaia",
    category: "cat_3",
    description: "Cenouras crocantes, finas e adocicadas. Ricas em betacaroteno e livres de agrotóxicos.",
    imageUrl: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=300",
    price: 6.50,
    unit: "Maço",
    isVisible: true,
    harvestedToday: false,
    viewsCount: 16,
    ordersCount: 5,
  },
  {
    id: "prod_5",
    producerId: "producer_manoel",
    name: "Banana Prata Climatizada",
    category: "cat_2",
    description: "Doce e nutritiva, amadurecida de forma natural no sítio sem carbureto.",
    imageUrl: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&q=80&w=300",
    price: 7.00,
    unit: "Dúzia",
    isVisible: true,
    harvestedToday: false,
    viewsCount: 29,
    ordersCount: 9,
  },
  {
    id: "prod_6",
    producerId: "producer_maria",
    name: "Queijinho de Cabra Frescal",
    category: "cat_6",
    description: "Queijo levemente salgado, textura macia, produzido artesanalmente no Rancho com leite puro de cabra.",
    imageUrl: "https://images.unsplash.com/photo-1486887396153-fa416526c13b?auto=format&fit=crop&q=80&w=300",
    price: 18.50,
    unit: "Unidade (~250g)",
    isVisible: true,
    harvestedToday: false,
    viewsCount: 64,
    ordersCount: 21,
  },
  {
    id: "prod_7",
    producerId: "producer_maria",
    name: "Leite Integral Pasteurizado",
    category: "cat_5",
    description: "Garrafa de leite de cabra integral, ideal para intolerantes à lactose bovina. Super cremoso.",
    imageUrl: "https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=300",
    price: 12.00,
    unit: "Garrafa (1L)",
    isVisible: true,
    harvestedToday: true,
    viewsCount: 51,
    ordersCount: 18,
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: "ord_201",
    groupId: "grp_201",
    userId: "user_jose",
    producerId: "producer_manoel",
    producerName: "Sítio Verde Marambaia",
    items: [
      {
        productId: "prod_3",
        productName: "Tomate Italiano Orgânico",
        imageUrl: "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=300",
        price: 8.90,
        unit: "Kg",
        quantity: 2,
      }
    ],
    subtotal: 17.80,
    deliveryFee: 6.00,
    total: 23.80,
    status: "recebido",
    deliveryMethod: "delivery",
    createdAt: "2026-06-12T16:30:00.000Z",
    hasBeenReviewed: false,
  }
];

export const INITIAL_REVIEWS: Review[] = [
  {
    id: "rev_1",
    orderId: "ord_101",
    userId: "user_jose",
    userName: "José da Silva",
    producerId: "producer_manoel",
    rating: 5,
    createdAt: "2026-06-11T12:00:00.000Z",
    isApproved: true,
  }
];

export const INITIAL_CHAT: ChatMessage[] = [];

