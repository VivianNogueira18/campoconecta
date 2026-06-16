/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserAddress {
  id: string;
  label: string; // Casa, Trabalho, Sítio, etc.
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number; // For distance calculation
  longitude: number; // For distance calculation
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  birthDate: string;
  email: string;
  phone: string;
  isActive: boolean;
  addresses: UserAddress[];
  selectedAddressId: string;
  isProducer: boolean;
  isClient: boolean;
  avatarUrl?: string;
  followedProducerIds: string[];
  favoriteProductIds: string[];
}

export interface Producer {
  id: string; // Corresponds to User ID
  propertyName: string;
  address: string;
  latitude: number;
  longitude: number;
  logoUrl: string;
  coverUrl: string;
  description: string;
  openingHours: string;
  whatsapp: string;
  instagram: string;
  showPhonePublicly: boolean;
  deliveryOption: "both" | "delivery" | "pickup";
  deliveryRadiusKm: number;
  deliveryFeeFee: number;
  ratingAverage: number;
  ratingCount: number;
  seloIds: string[]; // Badges custom assigned by admin
  productionTypes: string[]; // e.g. ["padrao", "organica", "agroecologica", "artesanal"]
  isSuspended: boolean;
}

export interface Product {
  id: string;
  producerId: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  price: number;
  unit: string; // Kg, Unidade, Bandeja, Dúzia, Litro, Pacote, etc.
  isVisible: boolean; // Ocultar manualmente indisponíveis
  harvestedToday: boolean; // "Acabei de Colher" feature
  harvestedAt?: string; // timestamp
  viewsCount: number;
  ordersCount: number;
}

export interface Selo {
  id: string;
  name: string;
  description: string;
  color: string; // hex or tailwind class
  icon: string; // lucide icon name
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  deliveryMethod?: "delivery" | "pickup";
}

export type OrderStatus =
  | "recebido"
  | "aguardando_aceitacao"
  | "aceito"
  | "preparacao"
  | "entrega"
  | "entregue"
  | "cancelado";

export interface OrderItem {
  productId: string;
  productName: string;
  imageUrl: string;
  price: number;
  unit: string;
  quantity: number;
}

export interface OrderGroup {
  id: string; // General group ID (when checking out multiple items)
  userId: string;
  createdAt: string;
  address: UserAddress;
  subOrders: Order[];
}

export interface Order {
  id: string;
  groupId: string;
  userId: string;
  producerId: string;
  producerName: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  deliveryMethod: "delivery" | "pickup";
  createdAt: string;
  hasBeenReviewed: boolean;
  address?: UserAddress;
}

export interface ChatMessage {
  id: string;
  orderId?: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}

export interface Review {
  id: string;
  orderId: string;
  userId: string;
  userName: string;
  producerId: string;
  rating: number; // 1 to 5 stars
  createdAt: string;
  isApproved: boolean; // Admin moderation
}

export interface ChatSession {
  participantId: string; // Either producer ID or user ID
  participantName: string;
  participantAvatar: string;
  lastMessageText: string;
  lastMessageTime: string;
  unreadCount: number;
}
