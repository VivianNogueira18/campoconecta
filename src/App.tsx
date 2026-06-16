/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { User, Producer, Product, Selo, Category, Order, ChatMessage, Review, CartItem } from "./types";
import {
  INITIAL_SELOS,
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PRODUCERS,
  INITIAL_PRODUCTS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_CHAT,
} from "./data";
import { DynamicIcon } from "./components/Icons";
import AdminPanel from "./components/AdminPanel";
import ProducerPanel from "./components/ProducerPanel";
import ClientPanel from "./components/ClientPanel";
import AuthPanel from "./components/AuthPanel";
import { isSupabaseConfigured } from "./supabaseClient";
import {
  usersService,
  producersService,
  productsService,
  ordersService,
  chatsService,
  reviewsService,
} from "./supabaseService";

export default function App() {
  // MASTER STATES - Initialized from LocalStorage if available, otherwise fallback to our rich templates
  const [users, setUsers] = useState<User[]>(() => {
    const cached = localStorage.getItem("cc_users");
    const raw = cached ? JSON.parse(cached) : INITIAL_USERS;
    return raw.map((u: User) => ({
      ...u,
      followedProducerIds: u.followedProducerIds ? u.followedProducerIds.filter((pId) => pId !== "producer_manoel" && pId !== "producer_maria") : [],
      favoriteProductIds: u.favoriteProductIds ? u.favoriteProductIds.filter((pId) => !pId.startsWith("prod_")) : []
    }));
  });

  const [producers, setProducers] = useState<Producer[]>(() => {
    const cached = localStorage.getItem("cc_producers");
    const raw: Producer[] = cached ? JSON.parse(cached) : INITIAL_PRODUCERS;
    return raw.filter((p) => p.id !== "producer_manoel" && p.id !== "producer_maria");
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const cached = localStorage.getItem("cc_products");
    const raw: Product[] = cached ? JSON.parse(cached) : INITIAL_PRODUCTS;
    return raw.filter((p) => !p.id.startsWith("prod_") && p.producerId !== "producer_manoel" && p.producerId !== "producer_maria");
  });

  const [selos, setSelos] = useState<Selo[]>(() => {
    const cached = localStorage.getItem("cc_selos");
    return cached ? JSON.parse(cached) : INITIAL_SELOS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const cached = localStorage.getItem("cc_categories");
    return cached ? JSON.parse(cached) : INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const cached = localStorage.getItem("cc_orders");
    const raw: Order[] = cached ? JSON.parse(cached) : INITIAL_ORDERS;
    return raw.filter((o) => o.id !== "ord_201" && o.producerId !== "producer_manoel" && o.producerId !== "producer_maria");
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const cached = localStorage.getItem("cc_chats");
    return cached ? JSON.parse(cached) : INITIAL_CHAT;
  });

  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = localStorage.getItem("cc_reviews");
    const raw: Review[] = cached ? JSON.parse(cached) : INITIAL_REVIEWS;
    return raw.filter((r) => r.id !== "rev_1" && r.producerId !== "producer_manoel" && r.producerId !== "producer_maria");
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem("cc_cart");
    return cached ? JSON.parse(cached) : [];
  });

  // ACTIVE INTERACTIVE USER PERSONA FOR COHESIVE DEMONSTRATION
  // Starts with empty value to require login first
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem("cc_active_user_id") || "";
  });
  
  // ROLE SELECTION WORKSPACE SYSTEM: "client" | "producer" | "admin"
  const [activeRole, setActiveRole] = useState<"client" | "producer" | "admin" >("client");

  // SYNCHRONIZATION TRIGGER TO LOCAL STORAGE
  useEffect(() => {
    localStorage.setItem("cc_users", JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem("cc_producers", JSON.stringify(producers));
  }, [producers]);

  useEffect(() => {
    localStorage.setItem("cc_products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem("cc_selos", JSON.stringify(selos));
  }, [selos]);

  useEffect(() => {
    localStorage.setItem("cc_categories", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("cc_orders", JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem("cc_chats", JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem("cc_reviews", JSON.stringify(reviews));
  }, [reviews]);

  useEffect(() => {
    localStorage.setItem("cc_cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("cc_active_user_id", activeUserId);
  }, [activeUserId]);

  // --- SUPABASE SYNCHRONIZATION MIDWARE CORE ---
  const isInitialLoadingRef = useRef(true);
  const prevUsersRef = useRef<User[]>([]);
  const prevProducersRef = useRef<Producer[]>([]);
  const prevProductsRef = useRef<Product[]>([]);
  const prevOrdersRef = useRef<Order[]>([]);
  const prevChatsRef = useRef<ChatMessage[]>([]);
  const prevReviewsRef = useRef<Review[]>([]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    if (!isSupabaseConfigured) {
      alert("Aviso: Supabase não detectado nas variáveis de ambiente. Sincronização em nuvem inativa, usando LocalStorage.");
      return;
    }
    setIsSyncing(true);
    try {
      console.log("Iniciando sincronização manual com o Supabase...");

      let dbUsers = await usersService.query();
      let dbProducers = await producersService.query();
      let dbProducts = await productsService.query();
      let dbOrders = await ordersService.query();
      let dbChats = await chatsService.query();
      let dbReviews = await reviewsService.query();

      const filteredUsers = (dbUsers || []).map((u) => ({
        ...u,
        followedProducerIds: u.followedProducerIds ? u.followedProducerIds.filter((pId) => pId !== "producer_manoel" && pId !== "producer_maria") : [],
        favoriteProductIds: u.favoriteProductIds ? u.favoriteProductIds.filter((pId) => !pId.startsWith("prod_")) : []
      }));
      const filteredProducers = (dbProducers || []).filter((p) => p.id !== "producer_manoel" && p.id !== "producer_maria");
      const filteredProducts = (dbProducts || []).filter((p) => !p.id.startsWith("prod_") && p.producerId !== "producer_manoel" && p.producerId !== "producer_maria");
      const filteredOrders = (dbOrders || []).filter((o) => o.id !== "ord_201" && o.producerId !== "producer_manoel" && o.producerId !== "producer_maria");
      const filteredReviews = (dbReviews || []).filter((r) => r.id !== "rev_1" && r.producerId !== "producer_manoel" && r.producerId !== "producer_maria");

      setUsers(filteredUsers);
      setProducers(filteredProducers);
      setProducts(filteredProducts);
      setOrders(filteredOrders);
      if (dbChats) setChatMessages(dbChats);
      setReviews(filteredReviews);

      prevUsersRef.current = filteredUsers;
      prevProducersRef.current = dbProducers || [];
      prevProductsRef.current = dbProducts || [];
      prevOrdersRef.current = dbOrders || [];
      prevChatsRef.current = dbChats || [];
      prevReviewsRef.current = dbReviews || [];

      alert("Sincronização concluída! Dados atualizados com as últimas informações em tempo real.");
    } catch (err) {
      console.error("Erro na sincronização manual:", err);
      alert("Erro ao receber novas atualizações. Por favor, tente novamente.");
    } finally {
      setIsSyncing(false);
    }
  };

  // 1. CARREGAR DADOS DO SUPABASE NO STARTUP (SE CONFIGURADO)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      isInitialLoadingRef.current = false;
      return;
    }

    const loadAndSeedSupabase = async () => {
      try {
        console.log("Supabase detectado de forma ativa! Sincronizando tabelas em tempo real...");

        let dbUsers = await usersService.query();
        let dbProducers = await producersService.query();
        let dbProducts = await productsService.query();
        let dbOrders = await ordersService.query();
        let dbChats = await chatsService.query();
        let dbReviews = await reviewsService.query();

        // Se o banco estiver vazio, semeamos os dados iniciais ricos
        if (dbUsers && dbUsers.length === 0) {
          console.log("Seeding inicial: Gravando usuários no Supabase...");
          await Promise.all(INITIAL_USERS.map(u => usersService.create(u)));
          dbUsers = await usersService.query();
        }
        if (dbProducers && dbProducers.length === 0) {
          console.log("Seeding inicial: Gravando produtores no Supabase...");
          await Promise.all(INITIAL_PRODUCERS.map(p => producersService.create(p)));
          dbProducers = await producersService.query();
        }
        if (dbProducts && dbProducts.length === 0) {
          console.log("Seeding inicial: Gravando produtos no Supabase...");
          await Promise.all(INITIAL_PRODUCTS.map(p => productsService.create(p)));
          dbProducts = await productsService.query();
        }
        if (dbOrders && dbOrders.length === 0) {
          console.log("Seeding inicial: Gravando pedidos no Supabase...");
          await Promise.all(INITIAL_ORDERS.map(o => ordersService.create(o)));
          dbOrders = await ordersService.query();
        }
        if (dbChats && dbChats.length === 0) {
          console.log("Seeding inicial: Gravando mensagens de chat no Supabase...");
          await Promise.all(INITIAL_CHAT.map(c => chatsService.create(c)));
          dbChats = await chatsService.query();
        }
        if (dbReviews && dbReviews.length === 0) {
          console.log("Seeding inicial: Gravando avaliações no Supabase...");
          await Promise.all(INITIAL_REVIEWS.map(r => reviewsService.create(r)));
          dbReviews = await reviewsService.query();
        }

        // Filter out any loaded database entries that are mock
        const filteredUsers = (dbUsers || []).map((u) => ({
          ...u,
          followedProducerIds: u.followedProducerIds ? u.followedProducerIds.filter((pId) => pId !== "producer_manoel" && pId !== "producer_maria") : [],
          favoriteProductIds: u.favoriteProductIds ? u.favoriteProductIds.filter((pId) => !pId.startsWith("prod_")) : []
        }));
        const filteredProducers = (dbProducers || []).filter((p) => p.id !== "producer_manoel" && p.id !== "producer_maria");
        const filteredProducts = (dbProducts || []).filter((p) => !p.id.startsWith("prod_") && p.producerId !== "producer_manoel" && p.producerId !== "producer_maria");
        const filteredOrders = (dbOrders || []).filter((o) => o.id !== "ord_201" && o.producerId !== "producer_manoel" && o.producerId !== "producer_maria");
        const filteredReviews = (dbReviews || []).filter((r) => r.id !== "rev_1" && r.producerId !== "producer_manoel" && r.producerId !== "producer_maria");

        // Atualizar estados do React
        setUsers(filteredUsers);
        setProducers(filteredProducers);
        setProducts(filteredProducts);
        setOrders(filteredOrders);
        if (dbChats) setChatMessages(dbChats);
        setReviews(filteredReviews);

        // Atualizar referências
        prevUsersRef.current = filteredUsers;
        prevProducersRef.current = dbProducers || []; // Leave raw to trigger the automatic deletion of omitted items via sync effects
        prevProductsRef.current = dbProducts || []; // Leave raw to trigger the automatic deletion of omitted items via sync effects
        prevOrdersRef.current = dbOrders || []; // Leave raw to trigger the automatic deletion of omitted items via sync effects
        prevChatsRef.current = dbChats || [];
        prevReviewsRef.current = dbReviews || []; // Leave raw to trigger the automatic deletion of omitted items via sync effects

      } catch (err) {
        console.error("Erro durante a sincronização inicial do Supabase:", err);
      } finally {
        isInitialLoadingRef.current = false;
      }
    };

    loadAndSeedSupabase();
  }, []);

  // 2. DETECTAR MUTAÇÕES E PROPAGAR GRAVAÇÃO NO SUPABASE
  // Sincronizar Usuários
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    // Detectar remoções de usuários
    const deletedUsers = prevUsersRef.current.filter(pu => !users.some(u => u.id === pu.id));
    deletedUsers.forEach(async (user) => {
      try {
        await usersService.delete(user.id);
      } catch (e) {
        console.error("Erro ao sincronizar exclusão do usuário no Supabase:", e);
      }
    });

    users.forEach(async (user) => {
      const prevUser = prevUsersRef.current.find(u => u.id === user.id);
      if (!prevUser) {
        await usersService.create(user);
      } else if (JSON.stringify(prevUser) !== JSON.stringify(user)) {
        await usersService.update(user.id, user);
      }
    });
    prevUsersRef.current = users;
  }, [users]);

  // Sincronizar Produtores
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    // Detectar remoções de produtores
    const deletedProducers = prevProducersRef.current.filter(pp => !producers.some(p => p.id === pp.id));
    deletedProducers.forEach(async (prod) => {
      try {
        await producersService.delete(prod.id);
      } catch (e) {
        console.error("Erro ao sincronizar exclusão do produtor no Supabase:", e);
      }
    });

    producers.forEach(async (prod) => {
      const prevProd = prevProducersRef.current.find(p => p.id === prod.id);
      if (!prevProd) {
        await producersService.create(prod);
      } else if (JSON.stringify(prevProd) !== JSON.stringify(prod)) {
        await producersService.update(prod.id, prod);
      }
    });
    prevProducersRef.current = producers;
  }, [producers]);

  // Sincronizar Produtos
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    // Detectar remoções de produtos
    const deletedProducts = prevProductsRef.current.filter(pp => !products.some(p => p.id === pp.id));
    deletedProducts.forEach(async (prd) => {
      try {
        await productsService.delete(prd.id);
      } catch (e) {
        console.error("Erro ao sincronizar exclusão do produto no Supabase:", e);
      }
    });

    products.forEach(async (prd) => {
      const prevPrd = prevProductsRef.current.find(p => p.id === prd.id);
      if (!prevPrd) {
        await productsService.create(prd);
      } else if (JSON.stringify(prevPrd) !== JSON.stringify(prd)) {
        await productsService.update(prd.id, prd);
      }
    });
    prevProductsRef.current = products;
  }, [products]);

  // Sincronizar Pedidos
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    orders.forEach(async (ord) => {
      const prevOrd = prevOrdersRef.current.find(o => o.id === ord.id);
      if (!prevOrd) {
        await ordersService.create(ord);
      } else if (JSON.stringify(prevOrd) !== JSON.stringify(ord)) {
        await ordersService.update(ord.id, ord);
      }
    });
    prevOrdersRef.current = orders;
  }, [orders]);

  // Sincronizar Chats
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    chatMessages.forEach(async (msg) => {
      const prevMsg = prevChatsRef.current.find(m => m.id === msg.id);
      if (!prevMsg) {
        await chatsService.create(msg);
      }
    });
    prevChatsRef.current = chatMessages;
  }, [chatMessages]);

  // Sincronizar Reviews
  useEffect(() => {
    if (isInitialLoadingRef.current || !isSupabaseConfigured) return;

    reviews.forEach(async (rev) => {
      const prevRev = prevReviewsRef.current.find(r => r.id === rev.id);
      if (!prevRev) {
        await reviewsService.create(rev);
      } else if (JSON.stringify(prevRev) !== JSON.stringify(rev)) {
        await reviewsService.toggleApproval(rev.id, rev.isApproved);
      }
    });
    prevReviewsRef.current = reviews;
  }, [reviews]);


  const handleLogin = (user: User) => {
    if (!users.some(u => u.id === user.id)) {
      setUsers(prev => [...prev, user]);
    }
    const isVivian = user.cpf === "141.730.087-67" || user.cpf === "14173008767";
    if (isVivian && !producers.some(p => p.id === user.id)) {
      // Create Vivian's startup Producer profile so she automatically has her own property
      const vivianProducer: Producer = {
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
      };
      setProducers(prev => [...prev, vivianProducer]);
    }

    setActiveUserId(user.id);
    if (isVivian) {
      setActiveRole("admin");
    } else if (user.isProducer) {
      setActiveRole("producer");
    } else {
      setActiveRole("client");
    }
  };

  const handleRegister = (newUser: User, newProducer?: Producer) => {
    setUsers(prev => [...prev, newUser]);
    if (newProducer) {
      setProducers(prev => [...prev, newProducer]);
    }
    setActiveUserId(newUser.id);
    const isVivian = newUser.cpf === "141.730.087-67" || newUser.cpf === "14173008767";
    if (isVivian) {
      setActiveRole("admin");
    } else if (newUser.isProducer) {
      setActiveRole("producer");
    } else {
      setActiveRole("client");
    }
  };

  const handleLogout = () => {
    setActiveUserId("");
    setActiveRole("client");
    setCart([]);
  };

  // ACTIVE OBJECTS SELECTORS FROM USER CODES
  const currentUser = users.find((u) => u.id === activeUserId);
  const activeProducer = producers.find((p) => p.id === activeUserId);

  // Send communication message
  const handleSendMessage = (text: string, orderId?: string, receiverId?: string) => {
    if (!currentUser) return;
    const opposition = receiverId || "producer_admin"; // fallback
    const newMsg: ChatMessage = {
      id: "msg_" + Date.now(),
      orderId,
      senderId: currentUser.id,
      receiverId: opposition,
      text,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    const updatedMsgs = [...chatMessages, newMsg];
    setChatMessages(updatedMsgs);

    // Dynamic Simulated Bot Reply triggers to represent chat notifications in real working state!
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: "msg_" + (Date.now() + 10),
        orderId,
        senderId: opposition,
        receiverId: currentUser.id,
        text: `Olá! Recebi sua mensagem: "${text}". Já estou analisando aqui no meu sítio e retorno em breve!`,
        createdAt: new Date().toISOString(),
        isRead: false,
      };
      setChatMessages((prev) => [...prev, botResponse]);
    }, 2800);
  };

  // Submit separated checkout groups
  const handlePlaceOrder = (groupSubOrders: Order[]) => {
    setOrders((prev) => [...groupSubOrders, ...prev]);
  };

  const handleAddReview = (newRev: Review) => {
    setReviews((prev) => {
      const nextReviews = [newRev, ...prev];
      
      // Now update the producers state with the recalculated average and count
      setProducers((prevProducers) =>
        prevProducers.map((prod) => {
          if (prod.id === newRev.producerId) {
            const prodReviews = nextReviews.filter((r) => r.producerId === prod.id && r.isApproved);
            const count = prodReviews.length;
            const sum = prodReviews.reduce((sum, r) => sum + r.rating, 0);
            const avg = count > 0 ? Math.round((sum / count) * 10) / 10 : 5.0;
            return {
              ...prod,
              ratingAverage: avg,
              ratingCount: count,
            };
          }
          return prod;
        })
      );

      return nextReviews;
    });
  };

  if (!activeUserId || !currentUser) {
    return (
      <div className="min-h-screen bg-[#FDFDFB] flex flex-col justify-center">
        <AuthPanel users={users} onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  // Active role-based theme color configuration for high visual contrast and friendly feedback
  const isVivian = currentUser.cpf === "141.730.087-67" || currentUser.cpf === "14173008767";
  const theme = {
    client: {
      bg: "bg-[#F7FCF6]", // Cheerful clean off-white mint
      accent: "text-[#2A6F2E]", // Vibrant green
      banner: "bg-[#2E7D32]", // Solid forest green
      button: "bg-[#388E3C] hover:bg-[#2E7D32]",
      border: "border-[#C8E6C9]",
      subHeader: "bg-[#E8F5E9]", // Cheerful light green bar
      textColor: "text-[#1B3A1E]",
    },
    producer: {
      bg: "bg-[#FFFBF7]", // Warm terracotta cream
      accent: "text-[#D35400]", // Rich orange
      banner: "bg-[#D35400]", // Strong rustic terracotta orange
      button: "bg-[#E67E22] hover:bg-[#D35400]",
      border: "border-[#FADBD8]",
      subHeader: "bg-[#FDF2E9]", // Rich coral/peach subheader
      textColor: "text-[#5D2300]",
    },
    admin: {
      bg: "bg-[#F5F7FA]", // Clean space grey
      accent: "text-[#1F3A52]", 
      banner: "bg-[#1F3A52]", // Navy slate banner
      button: "bg-[#2980B9] hover:bg-[#1F3A52]",
      border: "border-slate-300",
      subHeader: "bg-[#E5E8E9]", // Slate subheader
      textColor: "text-[#112233]",
    }
  }[activeRole] || {
    bg: "bg-[#F9F8F3]",
    accent: "text-[#5A5A40]",
    banner: "bg-[#5A5A40]",
    button: "bg-[#5A5A40]",
    border: "border-[#E6E6DF]",
    subHeader: "bg-[#F2F2EB]",
    textColor: "text-[#3D3D33]",
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans selection:bg-[#E9EDC9] transition-colors duration-300 ${theme.bg} ${theme.textColor}`}>
      
      {/* 🚀 CAMPOCONECTA BRANDED SECURE HEADER */}
      <div className={`${theme.banner} border-b border-black/10 text-white py-4 px-4 sm:px-6 z-40 sticky top-0 shadow-md transition-all duration-300`}>
        <div className="max-w-7xl mx-auto flex flex-row justify-between items-center gap-4">
          {/* Logo Name & Location */}
          <div className="flex items-center gap-2.5">
            <div className="bg-white/90 p-1.5 rounded-xl shadow-inner text-emerald-800">
              <DynamicIcon name="Leaf" className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold font-mono tracking-widest uppercase opacity-90 text-white">CampoConecta</p>
              <h1 className="text-base font-serif font-bold tracking-wide text-white">
                Queimados <span className="opacity-75 font-light">| RJ</span>
              </h1>
            </div>
          </div>

          {/* User Profile & Logout action */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <p className="text-xs font-bold text-white leading-tight">{currentUser.name}</p>
              <p className="text-[10px] opacity-80 font-mono uppercase tracking-wider text-white">
                {isVivian 
                  ? "🔐 Administradora" 
                  : currentUser.isProducer 
                    ? "🚜 Produtor + Consumidor" 
                    : "🎒 Comprador Local"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-xs text-white py-1.5 px-3 rounded-xl transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Sair do CampoConecta"
            >
              <DynamicIcon name="LogOut" className="w-3.5 h-3.5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🏡 CORE WORKSPACE ROLE SELECTOR SUB HEADER */}
      <div className={`${theme.subHeader} border-b border-black/5 py-4 px-4 sm:px-6 transition-all duration-300`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <p className="text-[11px] uppercase tracking-wider text-stone-500 font-bold leading-none">Você está navegando como:</p>
            <h3 className="text-xl font-serif font-bold flex items-center justify-center sm:justify-start gap-2">
              {activeRole === "client" && <><DynamicIcon name="User" className="w-5 h-5 text-[#2A6F2E]" /> Painel de Consumidor</>}
              {activeRole === "producer" && <><DynamicIcon name="Store" className="w-5 h-5 text-[#D35400]" /> Painel do Produtor ({activeProducer?.propertyName || "Minha Colheita"})</>}
              {activeRole === "admin" && <><DynamicIcon name="Shield" className="w-5 h-5 text-[#1F3A52]" /> Painel de Auditoria (Admin)</>}
            </h3>
          </div>
          
          {/* Custom Stylized Select Dropdown (Lista Suspensa) for simplified profile access and Cloud Sync */}
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            {isSupabaseConfigured && (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sincronizar com o Banco de Dados em Nuvem"
                className={`flex items-center gap-1.5 px-3.5 py-2 border rounded-2xl text-xs font-bold shadow-sm transition-all cursor-pointer grow sm:grow-0 justify-center h-[38px] ${
                  isSyncing
                    ? "bg-stone-100 text-stone-400 border-stone-200"
                    : "bg-[#2A6F2E]/10 hover:bg-[#2A6F2E]/20 text-[#2A6F2E] border-[#2A6F2E]/20"
                }`}
              >
                <DynamicIcon
                  name="RefreshCw"
                  className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`}
                />
                <span>{isSyncing ? "Sincronizando..." : "Sincronizar"}</span>
              </button>
            )}

            <div className="relative flex items-center bg-white shadow-sm border border-stone-300 px-3 py-2 rounded-2xl w-full sm:w-auto min-w-[220px] h-[38px]">
              <span className="text-[11px] font-bold text-stone-500 mr-2 uppercase shrink-0 font-mono">Ir para:</span>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as "client" | "producer" | "admin")}
                className="bg-transparent text-stone-850 text-xs sm:text-sm font-bold w-full outline-none cursor-pointer pr-6 text-ellipsis overflow-hidden"
                style={{ WebkitAppearance: 'none', appearance: 'none' }}
              >
                <option value="client" className="text-stone-850 font-bold">Consumidor</option>
                <option value="producer" className="text-stone-850 font-bold">Produtor ({activeProducer?.propertyName || "Criar Lojinha"})</option>
                {isVivian && (
                  <option value="admin" className="text-stone-850 font-bold">Administrador ADM</option>
                )}
              </select>
              <div className="absolute right-3 pointer-events-none text-stone-500">
                <span className="text-xs">▼</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🍱 CORE WORKSPACE STAGE AREA PANEL ROUTERS */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {currentUser.isActive === false ? (
          <div className="bg-white rounded-3xl border border-red-200 p-8 text-center max-w-md mx-auto my-12 shadow-sm space-y-4">
            <DynamicIcon name="AlertTriangle" className="w-12 h-12 text-red-500 mx-auto" />
            <h3 className="font-display font-semibold text-lg text-red-950">Conta Bloqueada pela Administração</h3>
            <p className="text-xs text-stone-500">Seu usuário foi suspenso por descumprimento dos termos de cooperação da Feira Orgânica.</p>
            <p className="text-[10px] text-stone-400">Ative o perfil de outro usuário para continuar examinando.</p>
          </div>
        ) : (
          <div className="min-h-[500px]">
            {activeRole === "client" && !currentUser.isClient && (
              <div className="bg-white p-8 rounded-[32px] border border-[#E6E6DF] text-center max-w-md mx-auto space-y-4 shadow-sm my-10">
                <DynamicIcon name="ShoppingBag" className="w-12 h-12 text-[#8E8E7A] mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#5A5A40]">Ativar Perfil de Consumidor</h3>
                <p className="text-xs text-[#8E8E7A] leading-relaxed">Você atualmente não possui um perfil de consumidor cadastrado neste usuário ou ele foi removido anteriormente.</p>
                <button
                  onClick={() => {
                    setUsers((prev) =>
                      prev.map((u) => (u.id === currentUser.id ? { ...u, isClient: true } : u))
                    );
                    setActiveRole("client");
                  }}
                  className="bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3 px-6 rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                >
                  Criar Conta de Consumidor Agora
                </button>
              </div>
            )}

            {activeRole === "client" && currentUser.isClient && (
              <ClientPanel
                currentUser={currentUser}
                users={users}
                producers={producers}
                products={products}
                categories={categories}
                selos={selos}
                orders={orders}
                chats={chatMessages}
                reviews={reviews}
                cart={cart}
                onUpdateCart={setCart}
                onUpdateUsers={setUsers}
                onPlaceOrder={handlePlaceOrder}
                onSendMessage={handleSendMessage}
                onAddReview={handleAddReview}
                onUpdateOrders={setOrders}
              />
            )}

            {activeRole === "producer" && currentUser.isProducer && activeProducer && (
              <ProducerPanel
                currentUser={currentUser}
                producer={activeProducer}
                products={products}
                categories={categories}
                orders={orders}
                chats={chatMessages}
                onUpdateProducer={(updatedProd) => {
                  setProducers((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
                }}
                onUpdateProducts={setProducts}
                onUpdateOrders={setOrders}
                onSendMessage={handleSendMessage}
              />
            )}

            {activeRole === "producer" && (!currentUser.isProducer || !activeProducer) && (
              <div className="bg-white p-8 rounded-[32px] border border-[#E6E6DF] text-center max-w-md mx-auto my-10 space-y-4 shadow-sm">
                <DynamicIcon name="Store" className="w-12 h-12 text-[#8E8E7A] mx-auto" />
                <h3 className="font-serif font-bold text-lg text-[#5A5A40]">Nova Conta de Produtor</h3>
                <p className="text-xs text-[#8E8E7A] leading-relaxed">Você não possui uma propriedade rural registrada para venda. Cadastre-a preenchendo as informações básicas abaixo para começar:</p>
                
                <div className="text-left space-y-3 bg-[#F2F2EB]/40 p-4 rounded-2xl border border-[#E6E6DF]">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase font-mono">Nome Comercial da Sítio / Lojinha</label>
                    <input
                      type="text"
                      id="new-store-name"
                      placeholder="Ex: Sítio Agroecológico da Serra"
                      className="w-full bg-white border border-[#E6E6DF] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#5A5A40]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase font-mono">Endereço de Localização da Propriedade</label>
                    <input
                      type="text"
                      id="new-store-address"
                      placeholder="Ex: Estrada do Sol, KM 5, Queimados - RJ"
                      className="w-full bg-white border border-[#E6E6DF] rounded-lg px-3 py-2 text-xs outline-none focus:border-[#5A5A40]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase font-mono">Breve Descrição do Sítio</label>
                    <textarea
                      id="new-store-description"
                      placeholder="O que você cultiva? Legumes ecológicos, frutas frescas, tradição familiar na terra..."
                      rows={2}
                      className="w-full bg-white border border-[#E6E6DF] rounded-lg p-3 text-xs outline-none resize-none focus:border-[#5A5A40]"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    const nameInput = document.getElementById("new-store-name") as HTMLInputElement;
                    const addressInput = document.getElementById("new-store-address") as HTMLInputElement;
                    const descInput = document.getElementById("new-store-description") as HTMLTextAreaElement;

                    const newPropertyName = nameInput?.value || ("Sítio de " + currentUser.name);
                    const newAddress = addressInput?.value || (currentUser.addresses?.[0] ? `${currentUser.addresses[0].street}, ${currentUser.addresses[0].number}` : "Sede, Queimados");
                    const newDesc = descInput?.value || "Agroecologia local focada em frescor incomparável e responsabilidade ecológica.";

                    const newProducer: Producer = {
                      id: currentUser.id,
                      propertyName: newPropertyName,
                      address: newAddress,
                      latitude: currentUser.addresses?.[0]?.latitude || -22.7161,
                      longitude: currentUser.addresses?.[0]?.longitude || -43.5576,
                      logoUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150",
                      coverUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800",
                      description: newDesc,
                      openingHours: "Terça a Sábado: 08:00h às 17:00h",
                      whatsapp: currentUser.phone.replace(/\D/g, ""),
                      instagram: currentUser.name.toLowerCase().replace(/\s/g, "_") + "_org",
                      showPhonePublicly: true,
                      deliveryOption: "both",
                      deliveryRadiusKm: 12,
                      deliveryFeeFee: 5,
                      ratingAverage: 5.0,
                      ratingCount: 0,
                      seloIds: [],
                      productionTypes: ["padrao"],
                      isSuspended: false,
                    };

                    setProducers((prev) => {
                      const clean = prev.filter((p) => p.id !== currentUser.id);
                      return [...clean, newProducer];
                    });
                    setUsers((prev) =>
                      prev.map((u) => (u.id === currentUser.id ? { ...u, isProducer: true } : u))
                    );
                    setActiveRole("producer");
                  }}
                  className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3 px-6 rounded-xl text-xs cursor-pointer shadow-sm transition-all"
                >
                  Criar Propriedade Agora e Vender
                </button>
              </div>
            )}

            {activeRole === "admin" && (
              <AdminPanel
                users={users}
                producers={producers}
                products={products}
                selos={selos}
                categories={categories}
                reviews={reviews}
                orders={orders}
                currentUser={currentUser}
                onUpdateUsers={setUsers}
                onUpdateProducers={setProducers}
                onUpdateProducts={setProducts}
                onUpdateSelos={setSelos}
                onUpdateCategories={setCategories}
                onUpdateReviews={setReviews}
              />
            )}
          </div>
        )}
      </main>

      {/* 🌾 PROFESSIONAL FOOTER DESCONGREGATOR */}
      <footer className="bg-[#1A252F] border-t border-black/10 py-8 px-6 text-white/85 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6 text-center sm:text-left">
          <div>
            <p className="font-serif font-bold text-base text-white">CampoConecta</p>
            <p className="text-[11px] opacity-75 mt-1">Conectando quem produz a quem valoriza</p>
            <p className="text-[11px] text-amber-300 font-bold mt-1 uppercase font-mono tracking-wide">Liga Jovem do EM Leopoldo Machado</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 items-center text-[11px] opacity-60">
            <span>Conexão direta campo-cidade</span>
            <span className="hidden sm:inline">•</span>
            <span>Espaço de Consciência Alimentar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
