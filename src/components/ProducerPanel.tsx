/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Producer, Product, Category, Order, ChatMessage, OrderStatus } from "../types";
import { DynamicIcon } from "./Icons";

interface ProducerPanelProps {
  currentUser: User;
  producer: Producer;
  products: Product[];
  categories: Category[];
  orders: Order[];
  chats: ChatMessage[];
  onUpdateProducer: (prod: Producer) => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateOrders: (orders: Order[]) => void;
  onSendMessage: (text: string, orderId?: string, receiverId?: string) => void;
}

export default function ProducerPanel({
  currentUser,
  producer,
  products,
  categories,
  orders,
  chats,
  onUpdateProducer,
  onUpdateProducts,
  onUpdateOrders,
  onSendMessage,
}: ProducerPanelProps) {
  const [activeTab, setActiveTab] = useState<"catalog" | "orders" | "settings" | "chats">("orders");

  // Filter products by this producer
  const producerProducts = products.filter(p => p.producerId === currentUser.id);
  const producerOrders = orders.filter(o => o.producerId === currentUser.id);

  // Form states for adding/editing product
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    category: "Hortaliças",
    description: "",
    imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300",
    price: 0,
    unit: "Kg",
    isVisible: true,
    harvestedAt: "", // Opcional, data de colheita select
  });

  // Settings form states
  const [settingsForm, setSettingsForm] = useState({
    propertyName: producer.propertyName,
    address: producer.address,
    logoUrl: producer.logoUrl,
    coverUrl: producer.coverUrl,
    description: producer.description,
    openingHours: producer.openingHours,
    whatsapp: producer.whatsapp,
    instagram: producer.instagram,
    showPhonePublicly: producer.showPhonePublicly,
    deliveryOption: producer.deliveryOption,
    deliveryRadiusKm: producer.deliveryRadiusKm,
    deliveryFeeFee: producer.deliveryFeeFee,
    productionTypes: producer.productionTypes || ["padrao"],
  });

  // Chat window state
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [chatInputText, setChatInputText] = useState("");

  // Product Add / Edit submit
  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim() || productForm.price <= 0) return;

    const checkIsHarvestedToday = (dateStr: string) => {
      if (!dateStr) return false;
      const d = new Date(dateStr + "T12:00:00");
      const now = new Date();
      return d.getFullYear() === now.getFullYear() &&
             d.getMonth() === now.getMonth() &&
             d.getDate() === now.getDate();
    };

    const isToday = checkIsHarvestedToday(productForm.harvestedAt);

    if (editingProductId) {
      // Edit mode
      const updated = products.map(p =>
        p.id === editingProductId
          ? {
              ...p,
              name: productForm.name,
              category: productForm.category,
              description: productForm.description,
              imageUrl: productForm.imageUrl,
              price: productForm.price,
              unit: productForm.unit,
              isVisible: productForm.isVisible,
              harvestedAt: productForm.harvestedAt || undefined,
              harvestedToday: isToday,
            }
          : p
      );
      onUpdateProducts(updated);
      setEditingProductId(null);
    } else {
      // Add mode
      const newP: Product = {
        id: "p_" + Date.now(),
        producerId: currentUser.id,
        name: productForm.name,
        category: productForm.category,
        description: productForm.description,
        imageUrl: productForm.imageUrl,
        price: productForm.price,
        unit: productForm.unit,
        isVisible: productForm.isVisible,
        harvestedAt: productForm.harvestedAt || undefined,
        harvestedToday: isToday,
        viewsCount: 0,
        ordersCount: 0,
      };
      onUpdateProducts([...products, newP]);
    }

    // Reset Form
    setProductForm({
      name: "",
      category: "Hortaliças",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300",
      price: 0,
      unit: "Kg",
      isVisible: true,
      harvestedAt: "",
    });
  };

  const handleEditProductClick = (p: Product) => {
    setEditingProductId(p.id);
    setProductForm({
      name: p.name,
      category: p.category,
      description: p.description,
      imageUrl: p.imageUrl,
      price: p.price,
      unit: p.unit,
      isVisible: p.isVisible,
      harvestedAt: p.harvestedAt ? p.harvestedAt.split("T")[0] : "",
    });
    setActiveTab("catalog");
  };

  const handleCancelProductEdit = () => {
    setEditingProductId(null);
    setProductForm({
      name: "",
      category: "Hortaliças",
      description: "",
      imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=300",
      price: 0,
      unit: "Kg",
      isVisible: true,
      harvestedAt: "",
    });
  };

  const handleToggleHarvestedToday = (productId: string) => {
    const updated = products.map(p => {
      if (p.id === productId) {
        const nextVal = !p.harvestedToday;
        return {
          ...p,
          harvestedToday: nextVal,
          harvestedAt: nextVal ? new Date().toISOString() : undefined,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
  };

  const handleToggleProductVisibilityLocal = (productId: string) => {
    const updated = products.map(p => (p.id === productId ? { ...p, isVisible: !p.isVisible } : p));
    onUpdateProducts(updated);
  };

  const handleDeleteProduct = (productId: string) => {
    const firstCheck = confirm("Você deseja mesmo excluir o produto?");
    if (firstCheck) {
      const secondCheck = confirm("Esta ação apagará permanentemente o produto e ele sairá da loja de imediato. Deseja prosseguir de fato?");
      if (secondCheck) {
        const updated = products.filter(p => p.id !== productId);
        onUpdateProducts(updated);
      }
    }
  };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-map seals based on the selected productionTypes
    let newSeloIds: string[] = [];
    const pTypes = settingsForm.productionTypes;
    if (pTypes.includes("agroecologica")) {
      newSeloIds.push("selo_1", "selo_4", "selo_3"); // Ag Familiar + Sustentável + Agroecológico
    }
    if (pTypes.includes("organica")) {
      newSeloIds.push("selo_1", "selo_4");
    }
    if (pTypes.includes("artesanal")) {
      newSeloIds.push("selo_2"); // Artesanal
    }
    if (pTypes.includes("padrao")) {
      newSeloIds.push("selo_5"); // Produtor Local
    }

    // Deduplicate
    newSeloIds = Array.from(new Set(newSeloIds));
    if (newSeloIds.length === 0) {
      newSeloIds = ["selo_5"]; // Default
    }

    onUpdateProducer({
      ...producer,
      propertyName: settingsForm.propertyName,
      address: settingsForm.address,
      logoUrl: settingsForm.logoUrl,
      coverUrl: settingsForm.coverUrl,
      description: settingsForm.description,
      openingHours: settingsForm.openingHours,
      whatsapp: settingsForm.whatsapp,
      instagram: settingsForm.instagram,
      showPhonePublicly: settingsForm.showPhonePublicly,
      deliveryOption: settingsForm.deliveryOption as any,
      deliveryRadiusKm: settingsForm.deliveryRadiusKm,
      deliveryFeeFee: settingsForm.deliveryFeeFee,
      productionTypes: pTypes,
      seloIds: newSeloIds,
    });
    alert("Configurações da loja salvas com sucesso!");
  };

  // Switch Order Status
  const handleUpdateOrderStatus = (orderId: string, checkStatus: OrderStatus) => {
    const updated = orders.map(o => (o.id === orderId ? { ...o, status: checkStatus } : o));
    onUpdateOrders(updated);
  };

  // Chat message send
  const handleSendChatMessage = () => {
    if (!chatInputText.trim() || !selectedChatUser) return;
    onSendMessage(chatInputText, undefined, selectedChatUser);
    setChatInputText("");
  };

  // Group chats messages by clients
  const chatSessionsMap = new Map<string, { senderName: string; lastText: string; time: string; count: number }>();
  chats
    .filter(m => m.senderId === currentUser.id || m.receiverId === currentUser.id)
    .forEach(m => {
      const opposingId = m.senderId === currentUser.id ? m.receiverId : m.senderId;
      const already = chatSessionsMap.get(opposingId);
      chatSessionsMap.set(opposingId, {
        senderName: opposingId === "user_client" ? "Viviane Nogueira (Cliente)" : "Consumidor Ativo",
        lastText: m.text,
        time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        count: already ? already.count + (m.receiverId === currentUser.id && !m.isRead ? 1 : 0) : (m.receiverId === currentUser.id && !m.isRead ? 1 : 0),
      });
    });

  const chatSessionsList = Array.from(chatSessionsMap.entries()).map(([userId, val]) => ({
    userId,
    ...val,
  }));

  const activeChatMessages = chats.filter(
    m =>
      (m.senderId === currentUser.id && m.receiverId === selectedChatUser) ||
      (m.senderId === selectedChatUser && m.receiverId === currentUser.id)
  );

  return (
    <div id="producer-panel" className="bg-white rounded-[32px] shadow-sm border border-[#E6E6DF] overflow-hidden font-sans">
      {/* Producer Header Banner */}
      <div className="relative h-44 bg-[#5A5A40]">
        <img src={producer.coverUrl} alt="capa" className="absolute inset-0 w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between text-white flex-wrap gap-4">
          <div className="flex gap-4 items-center">
            <img src={producer.logoUrl} alt="logo" className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E9EDC9]/30 bg-[#F2F2EB]" />
            <div>
              <p className="bg-[#E9EDC9] text-[#5A5A40] text-[10px] uppercase tracking-widest font-mono font-bold px-2.5 py-1 rounded-full inline-block">
                Painel do Produtor
              </p>
              <h2 className="text-xl sm:text-2xl font-serif font-bold leading-tight mt-1 transition-all">{producer.propertyName}</h2>
              <p className="text-xs text-stone-200 flex items-center gap-1 mt-1">
                <DynamicIcon name="MapPin" className="w-3 h-3 text-[#E9EDC9]" /> {producer.address.split(",")[0]}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-[#5A5A40]/80 p-2.5 px-3 rounded-xl border border-white/10">
            <DynamicIcon name="Star" className="w-4 h-4 text-[#D4A373] fill-[#D4A373]" />
            <div>
              <p className="text-sm font-bold leading-none text-white">{producer.ratingAverage} / 5.0</p>
              <p className="text-[10px] text-stone-300 mt-1">{producer.ratingCount} avaliações</p>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-[#E6E6DF] overflow-x-auto bg-[#F2F2EB]/40">
        {[
          { id: "orders", label: `Pedidos de Hoje (${producerOrders.filter(o => o.status !== "entregue" && o.status !== "cancelado").length})`, icon: "Activity" },
          { id: "catalog", label: "Catálogo de Produtos", icon: "ShoppingBag" },
          { id: "chats", label: "Chat de Conversas", icon: "MessageSquare" },
          { id: "settings", label: "Dados da Propriedade", icon: "Settings" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-[#5A5A40] text-[#5A5A40] bg-white font-bold"
                : "border-transparent text-[#8E8E7A] hover:text-[#5A5A40] hover:bg-[#E6E6DF]/20"
            }`}
          >
            <DynamicIcon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        {/* TAB 1: ORDERS TRACKER */}
        {activeTab === "orders" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Controle de Produção e Logística</h3>
                <p className="text-stone-500 text-xs">Acompanhe novos pedidos recebidos da feira e mude o status para informar os consumidores.</p>
              </div>
            </div>

            {producerOrders.length === 0 ? (
              <div className="text-center py-12 bg-stone-50/40 rounded-3xl border border-dashed border-stone-200">
                <DynamicIcon name="Calendar" className="w-12 h-12 text-stone-300 mx-auto" />
                <p className="text-stone-600 font-medium mt-3">Nenhum pedido recebido por enquanto</p>
                <p className="text-stone-400 text-xs mt-1">Quando os clientes fizerem pedidos na sua propriedade, eles aparecerão aqui!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {producerOrders.map((o) => {
                  return (
                    <div key={o.id} className="bg-white rounded-2xl border border-stone-150 p-5 shadow-xs flex flex-col md:flex-row justify-between gap-6 hover:shadow-sm transition-shadow">
                      <div className="space-y-3 flex-1 min-w-0">
                        {/* Header metadata */}
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="bg-stone-100 font-mono px-2.5 py-1 rounded text-stone-700 font-semibold uppercase">
                            Pedido #{o.id}
                          </span>
                          <span className="text-stone-450">•</span>
                          <span className="text-stone-500">
                            {new Date(o.createdAt).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                          </span>
                          <span className="text-stone-450">•</span>
                          {o.deliveryMethod === "delivery" ? (
                            <span className="bg-sky-50 text-sky-700 border border-sky-100 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                              <DynamicIcon name="Truck" className="w-3 h-3" /> Para Entrega
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1">
                              <DynamicIcon name="MapPin" className="w-3 h-3" /> Retirada no Local
                            </span>
                          )}
                        </div>

                        {/* Items listed */}
                        <div className="space-y-1.5 pt-1">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="flex gap-2 items-center text-sm text-stone-700">
                              <img src={it.imageUrl} alt={it.productName} className="w-6 h-6 rounded object-cover" />
                              <span className="font-semibold text-stone-900">{it.quantity}x</span>
                              <span className="text-stone-600 truncate">{it.productName}</span>
                              <span className="text-stone-400 font-mono">({it.unit})</span>
                            </div>
                          ))}
                        </div>

                        {/* Totals */}
                        <div className="pt-2 border-t border-stone-100 flex gap-4 text-xs font-medium text-stone-500">
                          <p>Subtotal: <span className="text-stone-900 font-mono font-bold">R$ {o.subtotal.toFixed(2)}</span></p>
                          {o.deliveryMethod === "delivery" && (
                            <p>Entrega: <span className="text-stone-900 font-mono font-bold">R$ {o.deliveryFee.toFixed(2)}</span></p>
                          )}
                          <p className="text-stone-900 text-sm">Total: <span className="text-emerald-800 font-mono font-bold font-display">R$ {o.total.toFixed(2)}</span></p>
                        </div>

                        {/* Delivery address target */}
                        {o.deliveryMethod === "delivery" && (
                          <div className="bg-stone-50 p-3 rounded-xl border text-xs text-stone-600 flex items-start gap-2 max-w-lg">
                            <DynamicIcon name="MapPin" className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-stone-800">Entregar em: {o.address.label}</p>
                              <p>{o.address.street}, {o.address.number} - {o.address.zipCode}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Controls Area */}
                      <div className="md:w-60 flex flex-col justify-between items-end gap-3 shrink-0 border-t md:border-t-0 md:border-l border-stone-100 pt-4 md:pt-0 md:pl-5">
                        {/* Current Status Badge representation */}
                        <div>
                          <p className="text-[10px] text-stone-400 text-right mb-1">Status Atual</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-bold uppercase ${
                            o.status === "recebido" ? "bg-amber-100 text-amber-800 border" :
                            o.status === "aguardando_aceitacao" ? "bg-sky-100 text-sky-800 border" :
                            o.status === "aceito" ? "bg-indigo-100 text-indigo-800 border" :
                            o.status === "preparacao" ? "bg-purple-100 text-purple-800 border" :
                            o.status === "entrega" ? (o.deliveryMethod === "pickup" ? "bg-amber-100 text-amber-800 border" : "bg-orange-100 text-orange-850 border") :
                            o.status === "entregue" ? "bg-emerald-100 text-emerald-800 border" :
                            "bg-red-100 text-red-800 border"
                          }`}>
                            ● {
                              o.status === "recebido" ? "Recebido" :
                              o.status === "aguardando_aceitacao" ? "Aguar. Aceite" :
                              o.status === "aceito" ? "Aceito" :
                              o.status === "preparacao" ? "Em Preparação" :
                              o.status === "entrega" ? (o.deliveryMethod === "pickup" ? "Pronto para Retirada" : "Saiu para Entrega") :
                              o.status === "entregue" ? (o.deliveryMethod === "pickup" ? "Retirado" : "Entregue") : "Cancelado"
                            }
                          </span>
                        </div>

                        {/* Interactive flow actions */}
                        <div className="w-full space-y-2 mt-4">
                          {o.status === "recebido" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "aguardando_aceitacao")}
                              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer text-center"
                            >
                              Analisar Pedido
                            </button>
                          )}

                          {o.status === "aguardando_aceitacao" && (
                            <div className="flex gap-2 w-full">
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, "aceito")}
                                className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Aceitar
                              </button>
                              <button
                                onClick={() => handleUpdateOrderStatus(o.id, "cancelado")}
                                className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 rounded-lg text-xs font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                            </div>
                          )}

                          {o.status === "aceito" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "preparacao")}
                              className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                            >
                              Mudar para Preparação
                            </button>
                          )}

                          {o.status === "preparacao" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "entrega")}
                              className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex justify-center items-center gap-1.5"
                            >
                              {o.deliveryMethod === "pickup" ? (
                                <>
                                  <DynamicIcon name="Package" className="w-3.5 h-3.5" /> Pronto para Retirada
                                </>
                              ) : (
                                <>
                                  <DynamicIcon name="Truck" className="w-3.5 h-3.5" /> Saiu para Entrega
                                  </>
                              )}
                            </button>
                          )}

                          {o.status === "entrega" && (
                            <button
                              onClick={() => handleUpdateOrderStatus(o.id, "entregue")}
                              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer flex justify-center items-center gap-1.5"
                            >
                              <DynamicIcon name="CheckCircle" className="w-3.5 h-3.5" /> {o.deliveryMethod === "pickup" ? "Confirmar Retirada" : "Confirmar Entrega"}
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setSelectedChatUser(o.userId);
                              setActiveTab("chats");
                            }}
                            className="w-full py-2 border border-stone-250 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold flex justify-center items-center gap-1"
                          >
                            <DynamicIcon name="MessageSquare" className="w-3.5 h-3.5 text-emerald-600" /> Conversar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-8 animate-fade-in">
            {/* Split Creator Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Creator/Editor side */}
              <div className="lg:col-span-1 bg-stone-50 p-6 rounded-2xl border border-stone-150 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-display font-bold text-stone-900">
                    {editingProductId ? "🌻 Editar Produto" : "🥕 Novo Produto"}
                  </h4>
                  {editingProductId && (
                    <button onClick={handleCancelProductEdit} className="text-xs text-red-600 font-semibold underline cursor-pointer">
                      Cancelar Edição
                    </button>
                  )}
                </div>
                <p className="text-xs text-stone-500">Adicione itens frescos, folhagens ou produtos beneficiados diretamente na feira local.</p>

                <form onSubmit={handleProductSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Nome do Produto</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      placeholder="Ex: Mandioca Macia descascada"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-stone-600 font-medium block mb-1">Categoria</label>
                      <select
                        className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-emerald-600 font-bold"
                        value={productForm.category}
                        onChange={(e) => {
                          const val = e.target.value;
                          const isCesta = val === "Cesta de Produtos";
                          setProductForm({
                            ...productForm,
                            category: val,
                            unit: isCesta ? "Unidade" : productForm.unit
                          });
                        }}
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-stone-600 font-medium block mb-1">Unidade de Venda</label>
                      <select
                        className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-emerald-600 disabled:bg-stone-100 disabled:text-stone-500 font-bold"
                        value={productForm.category === "Cesta de Produtos" ? "Unidade" : productForm.unit}
                        disabled={productForm.category === "Cesta de Produtos"}
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                      >
                        <option value="Kg">Quilo (Kg)</option>
                        <option value="Unidade font-bold">Unidade</option>
                        <option value="Bandeja">Bandeja</option>
                        <option value="Dúzia">Dúzia</option>
                        <option value="Litro">Litro</option>
                        <option value="Pé">Pé / Unid.</option>
                        <option value="Maço">Maço</option>
                        <option value="Pacote">Pacote</option>
                        <option value="Pote (500g)">Pote (500g)</option>
                        <option value="Vaso">Vaso</option>
                      </select>
                      {productForm.category === "Cesta de Produtos" && (
                        <p className="text-[9px] text-emerald-800 font-bold mt-1">✓ Fixado para Cestas</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Preço Público (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600 font-mono"
                      placeholder="Ex: 8.50"
                      value={productForm.price || ""}
                      onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Foto do Produto</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          id="product-photo-file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setProductForm({ ...productForm, imageUrl: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="product-photo-file"
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                          <DynamicIcon name="Plus" className="w-3.5 h-3.5" />
                          Tirar ou Escolher Foto
                        </label>
                        {productForm.imageUrl.startsWith("data:") && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-1 rounded-md font-bold">✓ Carregada</span>
                        )}
                      </div>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-xl text-xs text-stone-600 focus:outline-emerald-600"
                        placeholder="Ou cole o link de uma foto aqui..."
                        value={productForm.imageUrl.startsWith("data:") ? "" : productForm.imageUrl}
                        onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Data da Colheita (Opcional)</label>
                    <input
                      type="date"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-emerald-600 font-mono"
                      value={productForm.harvestedAt}
                      onChange={(e) => setProductForm({ ...productForm, harvestedAt: e.target.value })}
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Se você colheu hoje, selecione a data de hoje. O selo "Colhido Hoje" será calculado e exibido automaticamente.
                    </p>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Descrição</label>
                    <textarea
                      rows={3}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      placeholder={productForm.category === "Cesta de Produtos" 
                        ? "Discrimine aqui o conteúdo detalhado da sua cesta (Ex: 2kg batata, 1 pé de alface, 1 maço de couve, 500g cenoura...)"
                        : "Descreva a colheita, cuidados orgânicos, etc."
                      }
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-xs"
                  >
                    {editingProductId ? "Salvar Alterações" : "Publicar na Feira"}
                  </button>
                </form>
              </div>

              {/* Product list side */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-display font-semibold text-stone-900 text-sm">Meus Produtos Publicados</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {producerProducts.map((p) => {
                    return (
                      <div key={p.id} className="p-4 bg-white rounded-2xl border border-stone-150 flex flex-col justify-between shadow-xs hover:border-emerald-300 transition-colors relative">
                        {/* Lixeira no canto superior direito para excluir o produto */}
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="absolute top-3 right-3 p-1.5 text-stone-400 hover:text-red-600 hover:bg-neutral-100/80 rounded-xl transition-all cursor-pointer z-10"
                          title="Excluir produto"
                        >
                          <DynamicIcon name="Trash" className="w-4 h-4" />
                        </button>

                        <div className="space-y-3">
                          <div className="flex gap-3">
                            <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover border" />
                            <div className="min-w-0 pr-6">
                              <p className="font-bold text-stone-800 text-sm truncate">{p.name}</p>
                              <p className="text-[10px] bg-stone-100 px-2 py-0.5 rounded text-stone-600 inline-block mt-0.5">{p.category}</p>
                              <p className="text-xs font-mono font-bold text-emerald-800 mt-1">R$ {p.price.toFixed(2)} / {p.unit}</p>
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{p.description}</p>
                        </div>

                        {/* Special Actions Inside Catalog */}
                        <div className="mt-4 pt-3 border-t border-stone-100 space-y-3">
                          {/* ACABEI DE COLHER 24H Fresh trigger */}
                          <div className="flex justify-between items-center bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100">
                            <div>
                              <p className="text-xs font-bold text-stone-800 flex items-center gap-1">
                                Colhido Hoje
                              </p>
                              <p className="text-[9px] text-stone-500">Destaque especial de frescor por 24h</p>
                            </div>
                            <button
                              onClick={() => handleToggleHarvestedToday(p.id)}
                              className={`p-1 px-3 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                p.harvestedToday
                                  ? "bg-emerald-600 text-white"
                                  : "bg-stone-200 text-stone-700 hover:bg-stone-300"
                              }`}
                            >
                              {p.harvestedToday ? "Ativo" : "Ativar"}
                            </button>
                          </div>

                          {/* Beautiful and highly clear visibility configuration switches */}
                          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Disponibilidade na Loja:</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${p.isVisible ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {p.isVisible ? "Exibindo na loja" : "Oculto"}
                              </span>
                            </div>
                            <div className="flex gap-1.5 pt-0.5">
                              <button
                                type="button"
                                onClick={() => { if (!p.isVisible) handleToggleProductVisibilityLocal(p.id); }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                  p.isVisible
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                                    : "bg-white text-stone-600 border-stone-250 hover:bg-stone-100"
                                }`}
                              >
                                Exibir na Loja
                              </button>
                              <button
                                type="button"
                                onClick={() => { if (p.isVisible) handleToggleProductVisibilityLocal(p.id); }}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer text-center ${
                                  !p.isVisible
                                    ? "bg-stone-700 text-white border-stone-700 shadow-2xs"
                                    : "bg-white text-stone-600 border-stone-250 hover:bg-stone-100"
                                }`}
                              >
                                Ocultar Produto
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-end pt-1">
                            <button
                              onClick={() => handleEditProductClick(p)}
                              className="w-full py-2 border border-stone-250 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-bold cursor-pointer transition-all"
                            >
                              Editar Detalhes do Produto
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CHATS */}
        {activeTab === "chats" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border border-stone-150 rounded-2xl overflow-hidden bg-white">
              {/* Inbox lists */}
              <div className="md:col-span-1 border-r border-stone-100 h-[400px] overflow-y-auto">
                <div className="p-4 bg-stone-50 border-b border-stone-100 sticky top-0">
                  <h4 className="font-display font-semibold text-stone-800 text-sm">Mensagens Recebidas</h4>
                </div>

                {chatSessionsList.length === 0 ? (
                  <div className="text-center py-12 text-stone-400 text-xs">
                    Nenhuma conversa iniciada.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-100">
                    {chatSessionsList.map((ses) => (
                      <button
                        key={ses.userId}
                        onClick={() => setSelectedChatUser(ses.userId)}
                        className={`w-full p-4 text-left transition-colors hover:bg-stone-50 cursor-pointer flex gap-3 ${
                          selectedChatUser === ses.userId ? "bg-emerald-50/40" : ""
                        }`}
                      >
                        <div className="w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center font-bold text-stone-700">
                          {ses.senderName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline mb-1">
                            <p className="text-xs font-bold text-stone-900 truncate">{ses.senderName}</p>
                            <p className="text-[9px] text-stone-400">{ses.time}</p>
                          </div>
                          <p className="text-xs text-stone-500 truncate">{ses.lastText}</p>
                        </div>
                        {ses.count > 0 && (
                          <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 self-center">
                            {ses.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Message window */}
              <div className="md:col-span-2 flex flex-col justify-between h-[400px]">
                {selectedChatUser ? (
                  <>
                    {/* Receiver title header */}
                    <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-center gap-3">
                      <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center font-bold text-stone-700 text-xs text-uppercase">
                        C
                      </div>
                      <div>
                        <p className="text-xs font-bold text-stone-900">
                          {selectedChatUser === "user_client" ? "Viviane Nogueira (Cliente)" : "Consumidor Local"}
                        </p>
                        <p className="text-[10px] text-stone-500">Bate-papo ativo em Queimados, RJ</p>
                      </div>
                    </div>

                    {/* Speech log */}
                    <div className="flex-1 p-4 overflow-y-auto bg-stone-50/30 space-y-3">
                      {activeChatMessages.map((msg) => {
                        const isSelf = msg.senderId === currentUser.id;
                        return (
                          <div key={msg.id} className={`flex ${isSelf ? "justify-end" : "justify-start"}`}>
                            <div className={`p-3 rounded-2xl text-xs max-w-[80%] leading-relaxed ${
                              isSelf
                                ? "bg-emerald-600 text-white rounded-tr-none"
                                : "bg-white text-stone-800 border rounded-tl-none shadow-2xs"
                            }`}>
                              <p>{msg.text}</p>
                              <p className={`text-[9px] mt-1 text-right  ${isSelf ? "text-emerald-200" : "text-stone-400"}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Speech sender */}
                    <div className="p-3 border-t border-stone-105 bg-white flex gap-2">
                      <input
                        type="text"
                        className="flex-1 text-xs border rounded-xl p-2.5 focus:outline-emerald-600"
                        placeholder="Escreva sua resposta para o cliente..."
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendChatMessage();
                        }}
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Enviar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center items-center p-6 text-stone-450 text-center">
                    <DynamicIcon name="MessageSquare" className="w-12 h-12 text-stone-300 mb-2" />
                    <p className="text-xs font-bold">Inicie um chat clicando em algum cliente ou pedido ao lado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: STORE SETTINGS */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="font-display font-semibold text-stone-900 text-base border-b pb-2">Informações Públicas do Produtor</h3>

            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Nome da Propriedade ou Loja</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      value={settingsForm.propertyName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, propertyName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-2">Tipos de Produção Praticados (Selecione todos que se aplicam)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-stone-50 p-3 rounded-2xl border border-stone-150">
                      {[
                        { id: "padrao", label: "Padrão / Convencional (Local)" },
                        { id: "organica", label: "Orgânica Certificada" },
                        { id: "agroecologica", label: "Agroecológica" },
                        { id: "artesanal", label: "Artesanal / Caseira" }
                      ].map((t) => {
                        const isChecked = settingsForm.productionTypes.includes(t.id);
                        return (
                          <label key={t.id} className={`p-2.5 border rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-xs font-semibold ${
                            isChecked ? "bg-emerald-50 border-emerald-500 text-emerald-800" : "bg-white border-stone-250 text-stone-700 hover:border-stone-400"
                          }`}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              className="accent-emerald-600 w-4 h-4 cursor-pointer"
                              onChange={() => {
                                const exists = settingsForm.productionTypes.includes(t.id);
                                const updated = exists
                                  ? settingsForm.productionTypes.filter(x => x !== t.id)
                                  : [...settingsForm.productionTypes, t.id];
                                setSettingsForm({ ...settingsForm, productionTypes: updated });
                              }}
                            />
                            <span>{t.label}</span>
                          </label>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-stone-500 mt-1">Os selos de destaque da sua lojinha serão ativados automaticamente com base nos tipos de produção selecionados.</p>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Endereço da Propriedade</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      value={settingsForm.address}
                      onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Horário de Funcionamento</label>
                    <input
                      type="text"
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      value={settingsForm.openingHours}
                      onChange={(e) => setSettingsForm({ ...settingsForm, openingHours: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Descrição</label>
                    <textarea
                      rows={4}
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                      value={settingsForm.description}
                      onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    />
                  </div>

                  <div className="bg-stone-100 p-4 rounded-2xl border border-stone-150 space-y-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Fotos da Propriedade</span>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-stone-700 font-semibold block mb-1">Foto da Propriedade (Capa)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="property-cover-file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onloadend = () => {
                                  setSettingsForm({ ...settingsForm, coverUrl: r.result as string });
                                };
                                r.readAsDataURL(f);
                              }
                            }}
                          />
                          <label
                            htmlFor="property-cover-file"
                            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 text-stone-700 shadow-sm"
                          >
                            Carregar Foto da Propriedade
                          </label>
                          {settingsForm.coverUrl.startsWith("data:") && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">✓ Carregada</span>
                          )}
                        </div>
                        <img src={settingsForm.coverUrl} className="mt-2 w-full h-24 object-cover rounded-xl border bg-stone-200" alt="Previsualizar Capa" />
                      </div>

                      <div>
                        <label className="text-xs text-stone-700 font-semibold block mb-1">Foto do Produtor ou Logotipo (Perfil)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            id="property-logo-file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) {
                                const r = new FileReader();
                                r.onloadend = () => {
                                  setSettingsForm({ ...settingsForm, logoUrl: r.result as string });
                                };
                                r.readAsDataURL(f);
                              }
                            }}
                          />
                          <label
                            htmlFor="property-logo-file"
                            className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5 text-stone-700 shadow-sm"
                          >
                            Carregar Foto de Perfil
                          </label>
                          {settingsForm.logoUrl.startsWith("data:") && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">✓ Carregada</span>
                          )}
                        </div>
                        <img src={settingsForm.logoUrl} className="mt-2 w-12 h-12 rounded-full object-cover border bg-stone-200" alt="Previsualizar Logo" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-stone-600 font-medium block mb-1">WhatsApp</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                        value={settingsForm.whatsapp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-xs text-stone-600 font-medium block mb-1">Instagram (@)</label>
                      <input
                        type="text"
                        className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                        value={settingsForm.instagram}
                        onChange={(e) => setSettingsForm({ ...settingsForm, instagram: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Opção de Entrega</label>
                    <select
                      className="w-full p-2.5 bg-white border border-stone-200 rounded-xl text-xs focus:outline-emerald-600"
                      value={settingsForm.deliveryOption}
                      onChange={(e) => setSettingsForm({ ...settingsForm, deliveryOption: e.target.value as any })}
                    >
                      <option value="both">Ambas (Entrega e Retirada)</option>
                      <option value="delivery">Somente Entrega</option>
                      <option value="pickup">Somente Retirada</option>
                    </select>
                  </div>

                  {settingsForm.deliveryOption !== "pickup" && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-100 animate-fade-in">
                      <div>
                        <label className="text-xs text-stone-600 font-medium block mb-1">Raio Máx. Entrega (Km)</label>
                        <input
                          type="number"
                          className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-emerald-600 font-mono"
                          value={settingsForm.deliveryRadiusKm}
                          onChange={(e) => setSettingsForm({ ...settingsForm, deliveryRadiusKm: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-600 font-medium block mb-1">Taxa Fixa (R$)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs focus:outline-emerald-600 font-mono"
                          value={settingsForm.deliveryFeeFee}
                          onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFeeFee: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="showPublicly"
                      className="w-4 h-4 text-emerald-600 accent-emerald-600"
                      checked={settingsForm.showPhonePublicly}
                      onChange={(e) => setSettingsForm({ ...settingsForm, showPhonePublicly: e.target.checked })}
                    />
                    <label htmlFor="showPublicly" className="text-xs text-stone-700 font-medium">Exibir telefone de contato publicamente na loja</label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-xs"
                >
                  Salvar Todas as Configurações
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
