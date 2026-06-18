import { supabase, isSupabaseConfigured } from "./supabaseClient";
import { User, Producer, Product, Order, ChatMessage, Review, OrderStatus, UserAddress } from "./types";

/**
 * UTILS: Mapeadores para converter as estruturas CamelCase do TypeScript para SnakeCase do Banco de Dados.
 */

// USER MAPPER
function mapUserToDB(user: User) {
  return {
    id: user.id,
    name: user.name,
    cpf: user.cpf,
    birth_date: user.birthDate,
    email: user.email,
    phone: user.phone,
    is_active: user.isActive,
    selected_address_id: user.selectedAddressId || null,
    is_producer: user.isProducer,
    is_client: user.isClient,
    avatar_url: user.avatarUrl || null,
    followed_producer_ids: user.followedProducerIds || [], // Salvo como JSONB
    favorite_product_ids: user.favoriteProductIds || [], // Salvo como JSONB
    password: user.password || null,
  };
}

function mapUserFromDB(dbUser: any): User {
  return {
    id: dbUser.id,
    name: dbUser.name,
    cpf: dbUser.cpf,
    birthDate: dbUser.birth_date,
    email: dbUser.email,
    phone: dbUser.phone,
    isActive: dbUser.is_active,
    addresses: [], // populated dynamically from relation table
    selectedAddressId: dbUser.selected_address_id || "",
    isProducer: dbUser.is_producer,
    isClient: dbUser.is_client,
    avatarUrl: dbUser.avatar_url || undefined,
    followedProducerIds: typeof dbUser.followed_producer_ids === "string" ? JSON.parse(dbUser.followed_producer_ids) : (dbUser.followed_producer_ids || []),
    favoriteProductIds: typeof dbUser.favorite_product_ids === "string" ? JSON.parse(dbUser.favorite_product_ids) : (dbUser.favorite_product_ids || []),
    password: dbUser.password || "",
  };
}

// PRODUCER MAPPER
function mapProducerToDB(producer: Producer) {
  return {
    id: producer.id,
    property_name: producer.propertyName,
    address: producer.address,
    latitude: producer.latitude,
    longitude: producer.longitude,
    logo_url: producer.logoUrl,
    cover_url: producer.coverUrl,
    description: producer.description,
    opening_hours: producer.openingHours,
    whatsapp: producer.whatsapp,
    instagram: producer.instagram,
    show_phone_publicly: producer.showPhonePublicly,
    delivery_option: producer.deliveryOption,
    delivery_radius_km: producer.deliveryRadiusKm,
    delivery_fee_fee: producer.deliveryFeeFee,
    rating_average: producer.ratingAverage,
    rating_count: producer.ratingCount,
    selo_ids: producer.seloIds, // Salvo como JSONB
    production_types: producer.productionTypes, // Salvo como JSONB
    is_suspended: producer.isSuspended,
    local_fair_description: producer.localFairDescription || null,
  };
}

function mapProducerFromDB(dbProd: any): Producer {
  return {
    id: dbProd.id,
    propertyName: dbProd.property_name,
    address: dbProd.address,
    latitude: dbProd.latitude,
    longitude: dbProd.longitude,
    logoUrl: dbProd.logo_url,
    coverUrl: dbProd.cover_url,
    description: dbProd.description,
    openingHours: dbProd.opening_hours,
    whatsapp: dbProd.whatsapp,
    instagram: dbProd.instagram,
    showPhonePublicly: dbProd.show_phone_publicly,
    deliveryOption: dbProd.delivery_option,
    deliveryRadiusKm: dbProd.delivery_radius_km,
    deliveryFeeFee: dbProd.delivery_fee_fee,
    ratingAverage: dbProd.rating_average,
    ratingCount: dbProd.rating_count,
    seloIds: typeof dbProd.selo_ids === "string" ? JSON.parse(dbProd.selo_ids) : (dbProd.selo_ids || []),
    productionTypes: typeof dbProd.production_types === "string" ? JSON.parse(dbProd.production_types) : (dbProd.production_types || []),
    isSuspended: dbProd.is_suspended,
    localFairDescription: dbProd.local_fair_description || "",
  };
}

// PRODUCT MAPPER
function mapProductToDB(product: Product) {
  return {
    id: product.id,
    producer_id: product.producerId,
    name: product.name,
    category: product.category,
    description: product.description,
    image_url: product.imageUrl,
    price: product.price,
    unit: product.unit,
    is_visible: product.isVisible,
    harvested_today: product.harvestedToday,
    harvested_at: product.harvestedAt || null,
    views_count: product.viewsCount,
    orders_count: product.ordersCount,
  };
}

function mapProductFromDB(dbProd: any): Product {
  return {
    id: dbProd.id,
    producerId: dbProd.producer_id,
    name: dbProd.name,
    category: dbProd.category,
    description: dbProd.description,
    imageUrl: dbProd.image_url,
    price: Number(dbProd.price),
    unit: dbProd.unit,
    isVisible: dbProd.is_visible,
    harvestedToday: dbProd.harvested_today,
    harvestedAt: dbProd.harvested_at || undefined,
    viewsCount: dbProd.views_count,
    ordersCount: dbProd.orders_count,
  };
}

// ORDER MAPPER
function mapOrderToDB(order: Order) {
  return {
    id: order.id,
    group_id: order.groupId,
    user_id: order.userId,
    producer_id: order.producerId,
    producer_name: order.producerName,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryFee,
    total: order.total,
    status: order.status,
    delivery_method: order.deliveryMethod,
    created_at: order.createdAt,
    has_been_reviewed: order.hasBeenReviewed,
    address: order.address || null, // Salvo como JSONB
  };
}

function mapOrderFromDB(dbOrder: any): Order {
  return {
    id: dbOrder.id,
    groupId: dbOrder.group_id,
    userId: dbOrder.user_id,
    producerId: dbOrder.producer_id,
    producerName: dbOrder.producer_name,
    items: [], // populated dynamically from relation table
    subtotal: Number(dbOrder.subtotal),
    deliveryFee: Number(dbOrder.delivery_fee),
    total: Number(dbOrder.total),
    status: dbOrder.status as OrderStatus,
    deliveryMethod: dbOrder.delivery_method,
    createdAt: dbOrder.created_at,
    hasBeenReviewed: dbOrder.has_been_reviewed,
    address: typeof dbOrder.address === "string" ? JSON.parse(dbOrder.address) : (dbOrder.address || undefined),
  };
}

// CHAT MESSAGE MAPPER
function mapChatMessageToDB(msg: ChatMessage) {
  return {
    id: msg.id,
    order_id: msg.orderId || null,
    sender_id: msg.senderId,
    receiver_id: msg.receiverId,
    text: msg.text,
    created_at: msg.createdAt,
    is_read: msg.isRead,
  };
}

function mapChatMessageFromDB(dbMsg: any): ChatMessage {
  return {
    id: dbMsg.id,
    orderId: dbMsg.order_id || undefined,
    senderId: dbMsg.sender_id,
    receiverId: dbMsg.receiver_id,
    text: dbMsg.text,
    createdAt: dbMsg.created_at,
    isRead: dbMsg.is_read,
  };
}

// REVIEW MAPPER
function mapReviewToDB(rev: Review) {
  return {
    id: rev.id,
    order_id: rev.orderId,
    user_id: rev.userId,
    user_name: rev.userName,
    producer_id: rev.producerId,
    rating: rev.rating,
    created_at: rev.createdAt,
    is_approved: rev.isApproved,
  };
}

function mapReviewFromDB(dbRev: any): Review {
  return {
    id: dbRev.id,
    orderId: dbRev.order_id,
    userId: dbRev.user_id,
    userName: dbRev.user_name,
    producerId: dbRev.producer_id,
    rating: Number(dbRev.rating),
    createdAt: dbRev.created_at,
    isApproved: dbRev.is_approved,
  };
}


/**
 * ============================================================================
 * 1. CRUD Módulo de USUÁRIOS
 * ============================================================================
 */
export const usersService = {
  // CONSULTA com filtros de Busca por Nome/Email e Status de Atividade
  async query(filters?: { name?: string; isActive?: boolean }) {
    if (!isSupabaseConfigured || !supabase) {
      console.warn("Supabase não configurado. Retornando consulta local.");
      return null;
    }
    try {
      let query = supabase.from("users").select("*");
      if (filters?.name) {
        query = query.ilike("name", `%${filters.name}%`);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }
      
      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;

      const usersList = (data || []).map(mapUserFromDB);

      // Fetch matching addresses for all these users
      const { data: addrData, error: addrError } = await supabase.from("user_addresses").select("*");
      if (!addrError && addrData) {
        usersList.forEach(user => {
          user.addresses = addrData
            .filter((addr: any) => addr.user_id === user.id)
            .map((addr: any) => ({
              id: addr.id,
              label: addr.label,
              street: addr.street,
              number: addr.number,
              neighborhood: addr.neighborhood,
              city: addr.city,
              state: addr.state,
              zipCode: addr.zip_code,
              latitude: Number(addr.latitude),
              longitude: Number(addr.longitude),
            }));
        });
      }

      return usersList;
    } catch (err) {
      console.error("Erro ao buscar usuários do Supabase:", err);
      throw err;
    }
  },

  // INCLUSÃO de um novo usuário
  async create(user: User): Promise<User> {
    if (!isSupabaseConfigured || !supabase) {
      return user;
    }
    try {
      // Step 1: Insert user with selectedAddressId as null initially to satisfy foreign key
      const dbObj = { ...mapUserToDB(user), selected_address_id: null };
      const { data, error } = await supabase.from("users").insert(dbObj).select().single();
      if (error) throw error;

      // Step 2: Insert addresses if any
      if (user.addresses && user.addresses.length > 0) {
        const addrPayloads = user.addresses.map((addr) => ({
          id: addr.id,
          user_id: user.id,
          label: addr.label,
          street: addr.street,
          number: addr.number,
          neighborhood: addr.neighborhood,
          city: addr.city,
          state: addr.state,
          zip_code: addr.zipCode,
          latitude: addr.latitude,
          longitude: addr.longitude,
        }));
        const { error: addrError } = await supabase.from("user_addresses").insert(addrPayloads);
        if (addrError) throw addrError;
      }

      // Step 3: Set actual selected_address_id
      if (user.selectedAddressId) {
        const { error: updateError } = await supabase
          .from("users")
          .update({ selected_address_id: user.selectedAddressId })
          .eq("id", user.id);
        if (updateError) throw updateError;
      }

      const returnedUser = mapUserFromDB(data);
      returnedUser.addresses = user.addresses || [];
      returnedUser.selectedAddressId = user.selectedAddressId;
      return returnedUser;
    } catch (err) {
      console.error("Erro ao inserir usuário no Supabase:", err);
      throw err;
    }
  },

  // EDIÇÃO completa dos campos do usuário
  async update(userId: string, updates: Partial<User>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Converte atualizações camelCase para snake_case
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
      if (updates.birthDate !== undefined) dbUpdates.birth_date = updates.birthDate;
      if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.selectedAddressId !== undefined) dbUpdates.selected_address_id = updates.selectedAddressId || null;
      if (updates.isProducer !== undefined) dbUpdates.is_producer = updates.isProducer;
      if (updates.isClient !== undefined) dbUpdates.is_client = updates.isClient;
      if (updates.followedProducerIds !== undefined) dbUpdates.followed_producer_ids = updates.followedProducerIds;
      if (updates.favoriteProductIds !== undefined) dbUpdates.favorite_product_ids = updates.favoriteProductIds;

      // Handle addresses update
      if (updates.addresses !== undefined) {
        // Step 1: Temporarily clear selected_address_id in DB to allow removing old addresses
        await supabase.from("users").update({ selected_address_id: null }).eq("id", userId);

        // Step 2: Delete old user addresses
        await supabase.from("user_addresses").delete().eq("user_id", userId);

        // Step 3: Insert new addresses
        if (updates.addresses.length > 0) {
          const addrPayloads = updates.addresses.map((addr) => ({
            id: addr.id,
            user_id: userId,
            label: addr.label,
            street: addr.street,
            number: addr.number,
            neighborhood: addr.neighborhood,
            city: addr.city,
            state: addr.state,
            zip_code: addr.zipCode,
            latitude: addr.latitude,
            longitude: addr.longitude,
          }));
          const { error: addrError } = await supabase.from("user_addresses").insert(addrPayloads);
          if (addrError) throw addrError;
        }

        // Step 4: Setup corrected selected_address_id
        if (updates.selectedAddressId) {
          dbUpdates.selected_address_id = updates.selectedAddressId;
        } else if (updates.addresses.length > 0) {
          dbUpdates.selected_address_id = updates.addresses[0].id;
        } else {
          dbUpdates.selected_address_id = null;
        }
      }

      const { error } = await supabase.from("users").update(dbUpdates).eq("id", userId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao editar usuário no Supabase:", err);
      throw err;
    }
  },

  // INATIVAÇÃO / REATIVAÇÃO (Soft Delete focado na lógica isActive)
  async toggleActive(userId: string, isActive: boolean): Promise<void> {
    return this.update(userId, { isActive });
  },

  // REMOÇÃO completa do usuário do Supabase
  async delete(userId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      // Step 1: Null the selected_address_id to avoid FK constraint
      await supabase.from("users").update({ selected_address_id: null }).eq("id", userId);
      // Step 2: Delete address rows
      await supabase.from("user_addresses").delete().eq("user_id", userId);
      // Step 3: Delete user row
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao deletar usuário no Supabase:", err);
      throw err;
    }
  }
};


/**
 * ============================================================================
 * 2. CRUD Módulo de PRODUTORES (Produtores Rurais)
 * ============================================================================
 */
export const producersService = {
  // CONSULTA com filtros por Nome da Propriedade e Categoria/Selo
  async query(filters?: { propertyName?: string; isSuspended?: boolean }) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      let query = supabase.from("producers").select("*");
      if (filters?.propertyName) {
        query = query.ilike("property_name", `%${filters.propertyName}%`);
      }
      if (filters?.isSuspended !== undefined) {
        query = query.eq("is_suspended", filters.isSuspended);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapProducerFromDB);
    } catch (err) {
      console.error("Erro ao carregar produtores do Supabase:", err);
      throw err;
    }
  },

  // INCLUSÃO de Produtor
  async create(producer: Producer): Promise<Producer> {
    if (!isSupabaseConfigured || !supabase) return producer;
    try {
      const dbObj = mapProducerToDB(producer);
      const { data, error } = await supabase.from("producers").insert(dbObj).select().single();
      if (error) throw error;
      return mapProducerFromDB(data);
    } catch (err) {
      console.error("Erro ao registrar produtor no Supabase:", err);
      throw err;
    }
  },

  // EDIÇÃO dos dados do produtor
  async update(producerId: string, updates: Partial<Producer>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const dbUpdates: any = {};
      if (updates.propertyName !== undefined) dbUpdates.property_name = updates.propertyName;
      if (updates.address !== undefined) dbUpdates.address = updates.address;
      if (updates.latitude !== undefined) dbUpdates.latitude = updates.latitude;
      if (updates.longitude !== undefined) dbUpdates.longitude = updates.longitude;
      if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
      if (updates.coverUrl !== undefined) dbUpdates.cover_url = updates.coverUrl;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.openingHours !== undefined) dbUpdates.opening_hours = updates.openingHours;
      if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
      if (updates.instagram !== undefined) dbUpdates.instagram = updates.instagram;
      if (updates.showPhonePublicly !== undefined) dbUpdates.show_phone_publicly = updates.showPhonePublicly;
      if (updates.deliveryOption !== undefined) dbUpdates.delivery_option = updates.deliveryOption;
      if (updates.deliveryRadiusKm !== undefined) dbUpdates.delivery_radius_km = updates.deliveryRadiusKm;
      if (updates.deliveryFeeFee !== undefined) dbUpdates.delivery_fee_fee = updates.deliveryFeeFee;
      if (updates.ratingAverage !== undefined) dbUpdates.rating_average = updates.ratingAverage;
      if (updates.ratingCount !== undefined) dbUpdates.rating_count = updates.ratingCount;
      if (updates.seloIds !== undefined) dbUpdates.selo_ids = updates.seloIds;
      if (updates.productionTypes !== undefined) dbUpdates.production_types = updates.productionTypes;
      if (updates.isSuspended !== undefined) dbUpdates.is_suspended = updates.isSuspended;

      const { error } = await supabase.from("producers").update(dbUpdates).eq("id", producerId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao editar produtor no Supabase:", err);
      throw err;
    }
  },

  // SUSPENSÃO / REATIVAÇÃO (Inativação sem deletar)
  async toggleSuspense(producerId: string, isSuspended: boolean): Promise<void> {
    return this.update(producerId, { isSuspended });
  },

  // EXCLUSÃO completa de Produtor
  async delete(producerId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from("producers").delete().eq("id", producerId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao remover produtor no Supabase:", err);
      throw err;
    }
  }
};


/**
 * ============================================================================
 * 3. CRUD Módulo de PRODUTOS
 * ============================================================================
 */
export const productsService = {
  // CONSULTA com múltiplos filtros de categoria, busca por nome e visibilidade
  async query(filters?: { name?: string; category?: string; isVisible?: boolean; producerId?: string }) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      let query = supabase.from("products").select("*");
      if (filters?.name) {
        query = query.ilike("name", `%${filters.name}%`);
      }
      if (filters?.category) {
        query = query.eq("category", filters.category);
      }
      if (filters?.producerId) {
        query = query.eq("producer_id", filters.producerId);
      }
      if (filters?.isVisible !== undefined) {
        query = query.eq("is_visible", filters.isVisible);
      }

      const { data, error } = await query.order("name", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapProductFromDB);
    } catch (err) {
      console.error("Erro ao buscar produtos do Supabase:", err);
      throw err;
    }
  },

  // INCLUSÃO de Produto
  async create(product: Product): Promise<Product> {
    if (!isSupabaseConfigured || !supabase) return product;
    try {
      const dbObj = mapProductToDB(product);
      const { data, error } = await supabase.from("products").insert(dbObj).select().single();
      if (error) throw error;
      return mapProductFromDB(data);
    } catch (err) {
      console.error("Erro ao registrar produto no Supabase:", err);
      throw err;
    }
  },

  // EDIÇÃO de Produto
  async update(productId: string, updates: Partial<Product>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.isVisible !== undefined) dbUpdates.is_visible = updates.isVisible;
      if (updates.harvestedToday !== undefined) dbUpdates.harvested_today = updates.harvestedToday;
      if (updates.harvestedAt !== undefined) dbUpdates.harvested_at = updates.harvestedAt;
      if (updates.viewsCount !== undefined) dbUpdates.views_count = updates.viewsCount;
      if (updates.ordersCount !== undefined) dbUpdates.orders_count = updates.ordersCount;

      const { error } = await supabase.from("products").update(dbUpdates).eq("id", productId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao editar produto no Supabase:", err);
      throw err;
    }
  },

  // INATIVAR / OCULTAR (Inativação rápida do estoque)
  async toggleVisibility(productId: string, isVisible: boolean): Promise<void> {
    return this.update(productId, { isVisible });
  },

  // EXCLUSÃO completa de Produto
  async delete(productId: string): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", productId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao remover produto no Supabase:", err);
      throw err;
    }
  }
};


/**
 * ============================================================================
 * 4. CRUD Módulo de COMPRAS / PEDIDOS
 * ============================================================================
 */
export const ordersService = {
  // CONSULTA com filtros por usuário, produtor e status de entrega
  async query(filters?: { userId?: string; producerId?: string; status?: OrderStatus }) {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      let query = supabase.from("orders").select("*");
      if (filters?.userId) {
        query = query.eq("user_id", filters.userId);
      }
      if (filters?.producerId) {
        query = query.eq("producer_id", filters.producerId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;

      const ordersList = (data || []).map(mapOrderFromDB);

      // Fetch matching order_items for all retrieved orders
      const { data: itemData, error: itemError } = await supabase.from("order_items").select("*");
      if (!itemError && itemData) {
        ordersList.forEach(order => {
          order.items = itemData
            .filter((item: any) => item.order_id === order.id)
            .map((item: any) => ({
              productId: item.product_id,
              productName: item.product_name,
              imageUrl: item.image_url,
              price: Number(item.price),
              unit: item.unit,
              quantity: item.quantity,
            }));
        });
      }

      return ordersList;
    } catch (err) {
      console.error("Erro aos buscar pedidos do Supabase:", err);
      throw err;
    }
  },

  // INCLUSÃO de Pedido
  async create(order: Order): Promise<Order> {
    if (!isSupabaseConfigured || !supabase) return order;
    try {
      // Step 1: Ensure order_groups row exists
      const { data: grpData } = await supabase.from("order_groups").select("id").eq("id", order.groupId);
      if (!grpData || grpData.length === 0) {
        const { error: grpError } = await supabase.from("order_groups").insert({
          id: order.groupId,
          user_id: order.userId,
          address: order.address,
        });
        if (grpError) throw grpError;
      }

      // Step 2: Insert order
      const dbObj = mapOrderToDB(order);
      const { data, error } = await supabase.from("orders").insert(dbObj).select().single();
      if (error) throw error;

      // Step 3: Insert order items
      if (order.items && order.items.length > 0) {
        const itemsPayload = order.items.map(item => ({
          order_id: order.id,
          product_id: item.productId,
          product_name: item.productName,
          image_url: item.imageUrl || "",
          price: item.price,
          unit: item.unit,
          quantity: item.quantity,
        }));
        const { error: itemsError } = await supabase.from("order_items").insert(itemsPayload);
        if (itemsError) throw itemsError;
      }

      const returnedOrder = mapOrderFromDB(data);
      returnedOrder.items = order.items || [];
      return returnedOrder;
    } catch (err) {
      console.error("Erro ao registrar pedido no Supabase:", err);
      throw err;
    }
  },

  // EDIÇÃO de Status ou se já foi avaliado
  async update(orderId: string, updates: Partial<Order>): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const dbUpdates: any = {};
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.hasBeenReviewed !== undefined) dbUpdates.has_been_reviewed = updates.hasBeenReviewed;

      const { error } = await supabase.from("orders").update(dbUpdates).eq("id", orderId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao atualizar pedido no Supabase:", err);
      throw err;
    }
  }
};


/**
 * ============================================================================
 * 5. CRUD Módulo de CHAT & REVIEWS (Interações Gerais)
 * ============================================================================
 */
export const chatsService = {
  async query() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []).map(mapChatMessageFromDB);
    } catch (err) {
      console.error("Erro ao carregar mensagens de chat:", err);
      throw err;
    }
  },

  async create(msg: ChatMessage): Promise<ChatMessage> {
    if (!isSupabaseConfigured || !supabase) return msg;
    try {
      const dbObj = mapChatMessageToDB(msg);
      const { data, error } = await supabase.from("chat_messages").insert(dbObj).select().single();
      if (error) throw error;
      return mapChatMessageFromDB(data);
    } catch (err) {
      console.error("Erro ao enviar mensagem no Supabase:", err);
      throw err;
    }
  }
};

export const reviewsService = {
  async query() {
    if (!isSupabaseConfigured || !supabase) return null;
    try {
      const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapReviewFromDB);
    } catch (err) {
      console.error("Erro ao buscar avaliações no Supabase:", err);
      throw err;
    }
  },

  async create(rev: Review): Promise<Review> {
    if (!isSupabaseConfigured || !supabase) return rev;
    try {
      const dbObj = mapReviewToDB(rev);
      const { data, error } = await supabase.from("reviews").insert(dbObj).select().single();
      if (error) throw error;
      return mapReviewFromDB(data);
    } catch (err) {
      console.error("Erro ao cadastrar avaliação no Supabase:", err);
      throw err;
    }
  },

  async toggleApproval(reviewId: string, isApproved: boolean): Promise<void> {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const { error } = await supabase.from("reviews").update({ is_approved: isApproved }).eq("id", reviewId);
      if (error) throw error;
    } catch (err) {
      console.error("Erro ao aprovar/moderar avaliação:", err);
      throw err;
    }
  }
};
