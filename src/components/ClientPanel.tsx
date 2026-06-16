/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Producer, Product, Category, Selo, CartItem, Order, ChatMessage, Review, OrderItem, OrderStatus } from "../types";
import { DynamicIcon } from "./Icons";
import { calculateDistance } from "../data";

interface ClientPanelProps {
  currentUser: User;
  users: User[];
  producers: Producer[];
  products: Product[];
  categories: Category[];
  selos: Selo[];
  orders: Order[];
  chats: ChatMessage[];
  reviews: Review[];
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onPlaceOrder: (groupSubOrders: Order[]) => void;
  onSendMessage: (text: string, orderId?: string, receiverId?: string) => void;
  onAddReview: (review: Review) => void;
  onUpdateOrders: (orders: Order[]) => void;
}

export default function ClientPanel({
  currentUser,
  users,
  producers,
  products,
  categories,
  selos,
  orders,
  chats,
  reviews,
  cart,
  onUpdateCart,
  onUpdateUsers,
  onPlaceOrder,
  onSendMessage,
  onAddReview,
  onUpdateOrders,
}: ClientPanelProps) {
  // Navigation Screens
  const [currentScreen, setCurrentScreen] = useState<"home" | "search" | "store" | "orders" | "favorites" | "cart" | "profile">("home");

  // Quantities selecting state prior to adding to cart
  const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({});
  const getSelectedQuantity = (pId: string) => selectedQuantities[pId] || 1;
  const setSelectedQuantity = (pId: string, val: number) => {
    setSelectedQuantities(prev => ({ ...prev, [pId]: Math.max(1, val) }));
  };

  // Toast notifications for user feedbacks
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToastMessage = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2500);
  };
  
  // Search parameters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Active viewing producer for Store Detail overlay
  const [viewingProducerId, setViewingProducerId] = useState<string | null>(null);

  const [reviewingOrderId, setReviewingOrderId] = useState<string | null>(null);
  const [reviewFormRating, setReviewFormRating] = useState(5);

  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone);
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl || "");

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Casa",
    street: "",
    number: "",
    neighborhood: "",
    city: "Limeira",
    state: "SP",
    zipCode: "",
  });

  // Active address coordinates calculator lookup helper
  const activeAddress = currentUser.addresses.find(a => a.id === currentUser.selectedAddressId) || currentUser.addresses[0];

  const handleSelectAddress = (addrId: string) => {
    const updated = users.map(u => u.id === currentUser.id ? { ...u, selectedAddressId: addrId } : u);
    onUpdateUsers(updated);
  };

  const handleSavePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      alert("Por favor, preencha seu nome.");
      return;
    }
    const updated = users.map(u => u.id === currentUser.id ? {
      ...u,
      name: profileName,
      email: profileEmail,
      phone: profilePhone,
      avatarUrl: profileAvatar || undefined,
    } : u);
    onUpdateUsers(updated);
    showToastMessage("Dados cadastrais salvos com sucesso!");
  };

  const handleAddNewAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrForm.street.trim() || !addrForm.number.trim() || !addrForm.neighborhood.trim()) {
      alert("Por favor, preencha os campos obrigatórios do endereço.");
      return;
    }

    const newAddr = {
      id: "addr_" + Date.now(),
      label: addrForm.label,
      street: addrForm.street,
      number: addrForm.number,
      neighborhood: addrForm.neighborhood,
      city: addrForm.city,
      state: addrForm.state,
      zipCode: addrForm.zipCode,
      latitude: activeAddress ? activeAddress.latitude + (Math.random() - 0.5) * 0.02 : -22.56,
      longitude: activeAddress ? activeAddress.longitude + (Math.random() - 0.5) * 0.02 : -47.41,
    };

    const updatedUser = {
      ...currentUser,
      addresses: [...currentUser.addresses, newAddr],
      selectedAddressId: newAddr.id,
    };

    const updatedList = users.map(u => u.id === currentUser.id ? updatedUser : u);
    onUpdateUsers(updatedList);
    setShowAddressForm(false);
    setAddrForm({
      label: "Casa",
      street: "",
      number: "",
      neighborhood: "",
      city: "Limeira",
      state: "SP",
      zipCode: "",
    });
    showToastMessage("Novo endereço adicionado com sucesso!");
  };

  // Distance helper relative to selected active consumer address
  const getProducerDistance = (p: Producer) => {
    return calculateDistance(activeAddress.latitude, activeAddress.longitude, p.latitude, p.longitude);
  };

  // Favorites utilities
  const handleToggleFavoriteProduct = (pId: string) => {
    const favorites = currentUser.favoriteProductIds.includes(pId)
      ? currentUser.favoriteProductIds.filter(id => id !== pId)
      : [...currentUser.favoriteProductIds, pId];
    
    // Simulate updating user
    onUpdateUsers([{ ...currentUser, favoriteProductIds: favorites }] as any);
  };

  const handleToggleFollowProducer = (pId: string) => {
    const followed = currentUser.followedProducerIds.includes(pId)
      ? currentUser.followedProducerIds.filter(id => id !== pId)
      : [...currentUser.followedProducerIds, pId];

    onUpdateUsers([{ ...currentUser, followedProducerIds: followed }] as any);
  };

  // Add Item to cart
  const handleAddToCart = (pId: string) => {
    const prod = products.find(p => p.id === pId);
    if (!prod) return;
    const qty = getSelectedQuantity(pId);
    const grower = producers.find(g => g.id === prod.producerId);
    const defaultMethod = grower && grower.deliveryOption === "pickup" ? "pickup" : "delivery";

    const already = cart.find(c => c.productId === pId);
    if (already) {
      onUpdateCart(cart.map(c => (c.productId === pId ? { ...c, quantity: c.quantity + qty } : c)));
    } else {
      onUpdateCart([...cart, { productId: pId, quantity: qty, deliveryMethod: defaultMethod }]);
    }
    showToastMessage(`${qty}x ${prod.name} adicionado ao carrinho!`);
    setSelectedQuantities(prev => ({ ...prev, [pId]: 1 }));
  };

  const handleQuantityChange = (pId: string, delta: number) => {
    const already = cart.find(c => c.productId === pId);
    if (!already) return;
    const nextQ = already.quantity + delta;
    if (nextQ <= 0) {
      onUpdateCart(cart.filter(c => c.productId !== pId));
    } else {
      onUpdateCart(cart.map(c => (c.productId === pId ? { ...c, quantity: nextQ } : c)));
    }
  };

  const handleSetItemDeliveryMethod = (pId: string, method: "delivery" | "pickup") => {
    onUpdateCart(cart.map(c => (c.productId === pId ? { ...c, deliveryMethod: method } : c)));
  };

  // Group cart items by vendor / grower to compute separate calculations
  const groupedCartItems = new Map<string, { product: Product; quantity: number; deliveryMethod: "delivery" | "pickup" }[]>();
  cart.forEach((item) => {
    const prod = products.find(p => p.id === item.productId);
    if (!prod) return;
    const grower = producers.find(g => g.id === prod.producerId);
    const defaultMethod = grower && grower.deliveryOption === "pickup" ? "pickup" : "delivery";
    const chosenMethod = item.deliveryMethod || defaultMethod;
    
    const list = groupedCartItems.get(prod.producerId) || [];
    groupedCartItems.set(prod.producerId, [...list, { product: prod, quantity: item.quantity, deliveryMethod: chosenMethod }]);
  });

  const cartAggrList = Array.from(groupedCartItems.entries()).map(([prodId, items]) => {
    const pInfo = producers.find(p => p.id === prodId);
    if (!pInfo) return null;
    const distanceVal = getProducerDistance(pInfo);
    const supportsDelivery = pInfo.deliveryOption !== "pickup" && distanceVal <= pInfo.deliveryRadiusKm;

    const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    
    // Delivery fee is applied per producer ONLY if at least one item of theirs is set to "delivery"
    const hasAnyDelivery = items.some(it => it.deliveryMethod === "delivery");
    const dFee = (hasAnyDelivery && supportsDelivery) ? pInfo.deliveryFeeFee : 0;

    return {
      producerId: prodId,
      producerName: pInfo.propertyName,
      producerInfo: pInfo,
      items,
      subtotal,
      deliveryFee: dFee,
      supportsDelivery,
      distance: distanceVal,
    };
  }).filter((x): x is NonNullable<typeof x> => x !== null);

  // Separate Valor de Produtos and Valor de Frete for the checkout summary
  const totalProductsCost = cartAggrList.reduce((sum, entry) => sum + entry.subtotal, 0);
  const totalDeliveryCost = cartAggrList.reduce((sum, entry) => sum + entry.deliveryFee, 0);
  const totalCartCost = totalProductsCost + totalDeliveryCost;

  // Submit and separating orders checkout
  const handleCheckout = () => {
    if (cart.length === 0) return;

    // Separate items by vendor and create individual orders
    const groupId = "grp_" + Date.now();
    const subOrders: Order[] = cartAggrList.map((aggr) => {
      // Create sub order item units
      const mappedItems: OrderItem[] = aggr.items.map((it) => ({
        productId: it.product.id,
        productName: it.product.name,
        imageUrl: it.product.imageUrl,
        price: it.product.price,
        unit: it.product.unit,
        quantity: it.quantity,
      }));

      const hasDelivery = aggr.items.some(it => it.deliveryMethod === "delivery");
      const deliveryMethod = hasDelivery ? "delivery" : "pickup";

      return {
        id: "ord_" + Math.floor(Math.random() * 9000 + 1000),
        groupId,
        userId: currentUser.id,
        producerId: aggr.producerId,
        producerName: aggr.producerName,
        items: mappedItems,
        subtotal: aggr.subtotal,
        deliveryFee: aggr.deliveryFee,
        total: aggr.subtotal + aggr.deliveryFee,
        status: "recebido" as OrderStatus,
        deliveryMethod,
        createdAt: new Date().toISOString(),
        address: activeAddress,
        hasBeenReviewed: false,
      };
    });

    onPlaceOrder(subOrders);
    onUpdateCart([]);
    setCurrentScreen("orders");
    alert("Pedido finalizado com sucesso! Os seus itens de compras foram processados e divididos.");
  };

  // Reviews submission
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingOrderId) return;
    const ordInfo = orders.find(o => o.id === reviewingOrderId);
    if (!ordInfo) return;

    const newRev: Review = {
      id: "rev_" + Date.now(),
      orderId: reviewingOrderId,
      userId: currentUser.id,
      userName: currentUser.name,
      producerId: ordInfo.producerId,
      rating: reviewFormRating,
      createdAt: new Date().toISOString(),
      isApproved: true, // Auto-approved for demonstration, editable by admin
    };

    onAddReview(newRev);

    // Mark order as reviewed
    const updatedOrders = orders.map(o => (o.id === reviewingOrderId ? { ...o, hasBeenReviewed: true } : o));
    onUpdateOrders(updatedOrders);

    setReviewingOrderId(null);
    alert("Obrigado pela sua avaliação! Sua nota ajudará o produtor local a melhorar.");
  };

  return (
    <div id="client-panel" className="font-sans space-y-6">
      {/* Consumer Sub-header select address dynamically */}
      <div className="bg-[#5A5A40] rounded-[32px] p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <p className="text-[10px] uppercase font-bold text-[#E9EDC9] tracking-widest font-mono">Feira Orgânica Local</p>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mt-1 text-[#F9F8F3]">
            Olá, <span className="text-[#E9EDC9] font-light">{currentUser.name}!</span>
          </h2>
          <div className="flex items-center gap-2 text-xs text-stone-200 mt-2">
            <DynamicIcon name="MapPin" className="w-4 h-4 text-[#E9EDC9] shrink-0" />
            <span className="font-medium text-[#E6E6DF]/80">Entregar em:</span>
            <span className="font-bold underline text-white">{activeAddress.street}, {activeAddress.number} • {activeAddress.neighborhood}</span>
          </div>
        </div>

        {/* Change Address Buttons Selection */}
        <div className="bg-[#464632] border border-[#A3A380]/40 p-3 rounded-[24px] w-full md:w-auto">
          <p className="text-[10px] text-[#E9EDC9] font-bold uppercase tracking-wider mb-2 px-1.5 font-mono">Alterar local para recalcular distâncias</p>
          <div className="flex gap-1.5 flex-wrap">
            {currentUser.addresses.map((addr) => (
              <button
                key={addr.id}
                onClick={() => {
                  onUpdateUsers([{ ...currentUser, selectedAddressId: addr.id }] as any);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                  currentUser.selectedAddressId === addr.id
                    ? "bg-[#D4A373] text-white shadow-sm"
                    : "bg-[#5A5A40]/40 text-[#E6E6DF] hover:bg-[#5A5A40] hover:text-white"
                }`}
              >
                {addr.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Internal Client Module Navigation */}
      <div className="flex bg-[#F2F2EB] rounded-[24px] border border-[#E6E6DF] shadow-xs p-1.5 overflow-x-auto gap-1">
        {[
          { id: "home", label: "Vitrine de Alimentos", icon: "Compass" },
          { id: "search", label: "Pesquisar Produtos", icon: "Search" },
          { id: "cart", label: `Carrinho (${cart.reduce((s, c) => s + c.quantity, 0)})`, icon: "ShoppingBag" },
          { id: "orders", label: `Meus Pedidos (${orders.filter(o => o.userId === currentUser.id && o.status !== "entregue").length})`, icon: "Activity" },
          { id: "favorites", label: "Favoritos & Seguidos", icon: "Heart" },
          { id: "profile", label: "Meu Perfil", icon: "User" },
        ].map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setCurrentScreen(sec.id as any);
              setViewingProducerId(null);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
              currentScreen === sec.id && !viewingProducerId
                ? "bg-[#5A5A40] text-white shadow-md"
                : "text-stone-600 hover:text-[#5A5A40] hover:bg-[#E6E6DF]/30"
            }`}
          >
            <DynamicIcon name={sec.icon} className="w-3.5 h-3.5" />
            {sec.label}
          </button>
        ))}
      </div>

      {/* RENDER DYNAMIC SCREEN MODULES */}

      {/* SCREEN A: LANDING PAGE STOREFRONT */}
      {currentScreen === "home" && !viewingProducerId && (
        <div className="space-y-8 animate-fade-in">
          {/* Highlight banner Acabei de Colher */}
          <div>
            <div className="flex justify-between items-end mb-4">
              <h3 className="font-serif font-bold text-[#5A5A40] text-xl sm:text-2xl flex items-center gap-2">
                <span>Acabei de Colher</span>
              </h3>
              <span className="text-xs text-[#8E8E7A] italic">Colhido nas últimas 24h</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products
                .filter((p) => p.harvestedToday && p.isVisible && producers.some(g => g.id === p.producerId))
                .slice(0, 4)
                .map((product) => {
                  const pOwner = producers.find(grower => grower.id === product.producerId);
                  if (!pOwner) return null;
                  const dist = getProducerDistance(pOwner);
                  const isFav = currentUser.favoriteProductIds.includes(product.id);
                  return (
                    <div key={product.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-[#F0F0E8] flex flex-col justify-between relative overflow-hidden hover:shadow-md hover:border-[#D4A373] transition-all">
                      <div className="relative rounded-2xl overflow-hidden bg-[#F2F2EB]">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                        <span className="absolute top-2.5 left-2.5 bg-[#E07A5F] text-white text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                          Colhido Hoje
                        </span>
                        <button
                          onClick={() => handleToggleFavoriteProduct(product.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-white rounded-full text-stone-600 shadow-xs cursor-pointer transition-colors"
                        >
                          <DynamicIcon name="Star" className={`w-3.5 h-3.5 ${isFav ? "text-[#D4A373] fill-[#D4A373]" : "text-stone-400"}`} />
                        </button>
                      </div>

                      <div className="pt-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-[#A3A380] italic font-medium uppercase tracking-wider">{product.category}</p>
                          <h4 className="font-serif font-bold text-base text-[#3D3D33] mt-0.5 truncate">{product.name}</h4>
                          <p className="text-xs text-[#5A5A40] font-medium mt-1 truncate flex items-center gap-1">
                            <DynamicIcon name="MapPin" className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                            {pOwner.propertyName} • {dist} km
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-[#F0F0E8] space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-serif font-bold text-[#5A5A40]">
                              R$ {product.price.toFixed(2)} <span className="text-[10px] font-sans text-[#8E8E7A] font-normal">/{product.unit}</span>
                            </p>
                            
                            {/* Pre-Add Quantity selector */}
                            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) - 1)}
                                className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-bold text-stone-900 w-5 text-center">
                                {getSelectedQuantity(product.id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) + 1)}
                                className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] py-2 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <DynamicIcon name="ShoppingBag" className="w-3.5 h-3.5" />
                            Adicionar ao carrinho
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* O que tem fresco hoje */}
          <div>
            <h3 className="font-serif font-bold text-[#5A5A40] text-xl sm:text-2xl mb-4">Frescos de Hoje</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {products
                .filter(p => p.isVisible && producers.some(g => g.id === p.producerId))
                .slice(0, 4)
                .map((product) => {
                  const pOwner = producers.find(g => g.id === product.producerId);
                  if (!pOwner) return null;
                  const dist = getProducerDistance(pOwner);
                  const isFav = currentUser.favoriteProductIds.includes(product.id);
                  return (
                    <div key={product.id} className="bg-white p-4 rounded-[32px] shadow-sm border border-[#F0F0E8] flex flex-col justify-between relative overflow-hidden hover:shadow-md hover:border-[#D4A373] transition-all">
                      <div className="relative rounded-2xl overflow-hidden bg-[#F2F2EB]">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                        <button
                          onClick={() => handleToggleFavoriteProduct(product.id)}
                          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-white rounded-full text-stone-600 shadow-xs cursor-pointer transition-colors"
                        >
                          <DynamicIcon name="Star" className={`w-3.5 h-3.5 ${isFav ? "text-[#D4A373] fill-[#D4A373]" : "text-stone-400"}`} />
                        </button>
                      </div>

                      <div className="pt-3.5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <p className="text-[10px] text-[#A3A380] italic font-medium uppercase tracking-wider">{product.category}</p>
                          <h4 className="font-serif font-bold text-base text-[#3D3D33] mt-0.5 truncate">{product.name}</h4>
                          <p className="text-xs text-[#5A5A40] font-medium mt-1 flex items-center gap-1">
                            <DynamicIcon name="MapPin" className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                            {pOwner.propertyName} • {dist} km
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-[#F0F0E8] space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-serif font-bold text-[#5A5A40]">
                              R$ {product.price.toFixed(2)} <span className="text-[10px] font-sans text-[#8E8E7A] font-normal">/{product.unit}</span>
                            </p>
                            
                            {/* Pre-Add Quantity selector */}
                            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) - 1)}
                                className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono text-xs font-bold text-stone-900 w-5 text-center">
                                {getSelectedQuantity(product.id)}
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) + 1)}
                                className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddToCart(product.id)}
                            className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] py-2 text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <DynamicIcon name="ShoppingBag" className="w-3.5 h-3.5" />
                            Adicionar ao carrinho
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Bento-grid Proximidade & Produtor Destaque */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Perto de Você sorted column */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="font-serif font-bold text-[#5A5A40] text-xl sm:text-2xl">📍 Perto de Você</h3>
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {products
                  .filter(p => p.isVisible && producers.some(g => g.id === p.producerId))
                  .map(p => {
                    const pOwner = producers.find(g => g.id === p.producerId);
                    if (!pOwner) return null;
                    const distVal = getProducerDistance(pOwner);
                    return { ...p, owner: pOwner, distance: distVal };
                  })
                  .filter((x): x is NonNullable<typeof x> => x !== null)
                  .sort((a, b) => a.distance - b.distance)
                  .slice(0, 5)
                  .map((product) => (
                    <div key={product.id} className="p-4 bg-white/60 rounded-2xl flex items-center justify-between border border-[#F0F0E8] hover:bg-white hover:border-[#D4A373] transition-all shadow-2xs">
                      <div className="flex gap-4 items-center min-w-0">
                        <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm text-[#3D3D33] truncate">{product.name}</h4>
                          <p className="text-xs text-[#A3A380] font-medium">{product.owner.propertyName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 shrink-0">
                        <span className="font-serif font-bold text-lg text-[#5A5A40]">R$ {product.price.toFixed(2)}</span>
                        <span className="bg-[#E9EDC9] text-[#5A5A40] text-[10px] font-bold px-2.5 py-1 rounded-lg font-mono uppercase tracking-wider">
                          {product.distance} km
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Produtor Destaque Promotion Block */}
            {producers.length > 0 ? (
              <div className="lg:col-span-1 bg-[#5A5A40] text-white p-6 rounded-[40px] shadow-xl flex flex-col justify-between relative overflow-hidden h-full min-h-[320px]">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full pointer-events-none"></div>
                <div className="relative z-10 space-y-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#E9EDC9]/90 font-mono">
                    Produtor Destaque
                  </span>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="w-14 h-14 rounded-2xl bg-[#E9EDC9]/20 flex items-center justify-center text-white shrink-0">
                      <DynamicIcon name="Store" className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-white leading-tight">{producers[0].propertyName}</h3>
                      <div className="flex items-center gap-1 text-[#E9EDC9] text-xs font-bold mt-1">
                        <span>★ 4.9</span>
                        <span className="text-white/60 font-normal">(128 avaliações)</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-[#2E2E1F] leading-relaxed italic mt-1 line-clamp-3">
                    "{producers[0].description}"
                  </p>
                </div>

                <button
                  onClick={() => setViewingProducerId(producers[0].id)}
                  className="w-full bg-[#E9EDC9] text-[#5A5A40] hover:bg-white hover:text-black font-bold py-3 rounded-2xl transition-all uppercase text-xs tracking-widest mt-4 cursor-pointer shadow-sm"
                >
                  Visitar Propriedade
                </button>
              </div>
            ) : (
              <div className="lg:col-span-1 bg-stone-100 text-stone-500 p-6 rounded-[40px] border border-dashed flex flex-col justify-center items-center text-center h-full min-h-[320px]">
                <DynamicIcon name="Store" className="w-8 h-8 text-stone-400 mb-2" />
                <p className="text-xs font-semibold">Nenhum produtor cadastrado</p>
                <p className="text-[10px] text-stone-400 mt-1">Visite o painel administrativo para adicionar produtores.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SCREEN B: MULTI-FILTER SEARCH BRWOSER */}
      {currentScreen === "search" && !viewingProducerId && (
        <div className="space-y-6 animate-fade-in">
          {/* Header query selector */}
          <div className="flex gap-2 bg-white p-3 rounded-2xl border border-stone-100 shadow-2xs">
            <input
              type="text"
              placeholder="Pesquise legumes, mel, artesanatos, verduras..."
              className="flex-1 p-2.5 bg-stone-50 rounded-xl text-sm focus:outline-emerald-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold flex items-center gap-1.5">
              <DynamicIcon name="Search" className="w-4 h-4" /> Buscar
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 overflow-x-auto pr-1">
            <button
              onClick={() => setSelectedCategorySlug(null)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                selectedCategorySlug === null ? "bg-emerald-600 text-white" : "bg-stone-105 hover:bg-stone-200 text-stone-700"
              }`}
            >
              Todos os Produtos
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategorySlug(cat.name)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  selectedCategorySlug === cat.name ? "bg-emerald-600 text-white" : "bg-stone-100 hover:bg-stone-200 text-stone-700"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Results list mapping */}
          <div>
            <h4 className="text-xs text-stone-400 font-semibold mb-3">Resultados da Pesquisa</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {products
                .filter((p) => {
                  const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
                  const matchCat = selectedCategorySlug === null || p.category === selectedCategorySlug;
                  const hasProducer = producers.some(g => g.id === p.producerId);
                  return p.isVisible && matchQuery && matchCat && hasProducer;
                })
                .map((product) => {
                  const pOwner = producers.find(g => g.id === product.producerId);
                  if (!pOwner) return null;
                  const dist = getProducerDistance(pOwner);
                  const supportsDelivery = pOwner.deliveryOption !== "pickup" && dist <= pOwner.deliveryRadiusKm;

                  return (
                    <div key={product.id} className="bg-white rounded-3xl border border-stone-150 overflow-hidden shadow-2xs hover:shadow-sm transition-shadow flex flex-col justify-between">
                      <div className="relative">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-36 object-cover" />
                        <span className="absolute top-2 left-2 bg-stone-900/40 text-white text-[9px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                          {product.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-3.5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-display font-bold text-sm text-stone-905">{product.name}</h4>
                            <p className="text-[10px] text-stone-500 font-semibold whitespace-nowrap">{dist} km</p>
                          </div>
                          <p className="text-xs text-stone-500 leading-snug mt-1 line-clamp-2">{product.description}</p>
                          
                          {/* Store connection public profile button */}
                          <button
                            onClick={() => setViewingProducerId(pOwner.id)}
                            className="text-[10px] text-emerald-800 font-bold hover:underline mt-2 inline-flex items-center gap-1"
                          >
                            <DynamicIcon name="MapPin" className="w-3 h-3 text-emerald-600" />
                            {pOwner.propertyName} <DynamicIcon name="ChevronRight" className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delivery Method Selector details badge */}
                        <div className="space-y-2 pt-2 border-t border-stone-100">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                            supportsDelivery ? "bg-sky-50 text-sky-700" : "bg-amber-50 text-amber-700"
                          }`}>
                            {supportsDelivery ? "Entrega Disponivel" : "Retirada no Local"}
                          </span>

                          <div className="space-y-2 pt-1">
                            <div className="flex justify-between items-center bg-stone-50/50 p-2 rounded-xl">
                              <p className="text-sm font-bold font-mono text-emerald-950">
                                R$ {product.price.toFixed(2)}{" "}
                                <span className="text-[10px] text-stone-400 font-normal">/{product.unit}</span>
                              </p>
                              
                              {/* Pre-Add Quantity selector */}
                              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) - 1)}
                                  className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-bold text-stone-900 w-5 text-center">
                                  {getSelectedQuantity(product.id)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(product.id, getSelectedQuantity(product.id) + 1)}
                                  className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            <button
                              onClick={() => handleAddToCart(product.id)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <DynamicIcon name="ShoppingBag" className="w-3.5 h-3.5" />
                              Adicionar ao carrinho
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN C: VENDOR / PRODUCER STORE PUBLIC PAGE OVERLAY */}
      {viewingProducerId && (
        <div className="space-y-6 animate-fade-in bg-stone-50 p-6 rounded-3xl border border-stone-150">
          {/* Back trigger */}
          <button
            onClick={() => setViewingProducerId(null)}
            className="flex items-center gap-1.5 text-xs text-stone-650 hover:text-stone-950 font-bold select-none cursor-pointer"
          >
            <DynamicIcon name="ChevronLeft" className="w-4 h-4" /> Voltar para a Feira
          </button>

          {/* Active grower store info */}
          {(() => {
            const grower = producers.find(g => g.id === viewingProducerId);
            if (!grower) return <p className="text-xs text-stone-500">Erro: Produtor não encontrado.</p>;

            const growerProducts = products.filter(p => p.producerId === grower.id && p.isVisible);
            const isFollowing = currentUser.followedProducerIds.includes(grower.id);

            return (
              <div className="space-y-6">
                {/* Visual Cover card */}
                <div className="relative h-48 bg-emerald-950 rounded-2xl overflow-hidden shadow-xs">
                  <img src={grower.coverUrl} alt="Store Cover" className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 to-transparent"></div>
                  <div className="absolute bottom-5 left-6 right-6 flex items-end justify-between flex-wrap gap-4 text-white">
                    <div className="flex gap-4 items-center">
                      <img src={grower.logoUrl} alt="logo" className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 bg-white" />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-display font-bold">{grower.propertyName}</h2>
                        <div className="flex gap-1 items-center text-xs mt-1 text-emerald-300">
                          <DynamicIcon name="Star" className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span className="font-bold text-white">{grower.ratingAverage}</span>
                          <span>({grower.ratingCount} avaliações)</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollowProducer(grower.id)}
                      className={`py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                        isFollowing ? "bg-white text-stone-900" : "bg-emerald-600 text-white"
                      }`}
                    >
                      {isFollowing ? "✓ Seguindo" : "Seguir Produtor"}
                    </button>
                  </div>
                </div>

                {/* Sub row detail specifications split */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left sidebar: description badges and delivery options */}
                  <div className="md:col-span-1 space-y-4">
                    <div className="bg-white p-5 rounded-2xl border border-stone-150 space-y-4">
                      <h4 className="font-display font-semibold text-stone-900 text-sm">Nossa História</h4>
                      <p className="text-xs text-stone-600 leading-relaxed">{grower.description}</p>

                      <div className="pt-3 border-t border-stone-100 space-y-2.5 text-xs text-stone-600">
                        <p className="flex items-center gap-1.5">
                          <DynamicIcon name="Clock" className="w-4 h-4 text-emerald-600" /> {grower.openingHours}
                        </p>
                        <p className="flex items-center gap-1.5">
                          <DynamicIcon name="MapPin" className="w-4 h-4 text-emerald-600" /> {grower.address}
                        </p>
                        {grower.localFairDescription && (
                          <div className="pt-2.5 border-t border-dashed border-stone-200">
                            <div className="flex gap-1.5 text-[#a16207]">
                              <DynamicIcon name="Sparkles" className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <strong className="block text-stone-800">Feirinhas da Região:</strong>
                                <span className="font-medium text-stone-700">{grower.localFairDescription}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Assigned badges and seals */}
                    {grower.seloIds.length > 0 && (
                      <div className="bg-white p-5 rounded-2xl border border-stone-105 space-y-3">
                        <h4 className="font-display font-semibold text-stone-900 text-xs">Selos e Certificações</h4>
                        <div className="flex flex-col gap-2">
                          {grower.seloIds.map((sId) => {
                            const badge = selos.find(s => s.id === sId);
                            if (!badge) return null;
                            return (
                              <div key={sId} className="flex gap-2.5 items-center p-2 rounded-xl bg-stone-50 border">
                                <span className={`p-1.5 rounded-full ${badge.color}`}>
                                  <DynamicIcon name={badge.icon} className="w-3.5 h-3.5" />
                                </span>
                                <div>
                                  <p className="text-[10px] font-bold text-stone-900">{badge.name}</p>
                                  <p className="text-[9px] text-stone-500">{badge.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Contact Direct Box (Whatsapp / Phone triggers) */}
                    <div className="bg-white p-5 rounded-2xl border border-stone-150 space-y-3">
                      <h4 className="font-display font-semibold text-stone-950 text-xs">Fale Direto Conosco</h4>
                      <p className="text-[10px] text-stone-500">Dúvidas sobre colheita ou encomendas especiais? Envie mensagems directas.</p>
                      <div className="space-y-2">
                        <a
                          href={`https://wa.me/${grower.whatsapp}`}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex justify-center items-center gap-1.5"
                        >
                          <DynamicIcon name="Phone" className="w-3.5 h-3.5" /> WhatsApp da Propriedade
                        </a>
                        {grower.showPhonePublicly && (
                          <div className="p-2.5 bg-stone-50 rounded-xl text-center border text-xs">
                            <span className="font-medium text-stone-500">Telefone Fixo:</span>{" "}
                            <span className="font-semibold text-stone-800">{grower.whatsapp}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right catalogue products lists */}
                  <div className="md:col-span-2 space-y-4">
                    <h3 className="font-display font-semibold text-stone-900 text-base">Produtos Disponíveis Hoje</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {growerProducts.map((p) => {
                        const isFav = currentUser.favoriteProductIds.includes(p.id);
                        return (
                          <div key={p.id} className="p-4 bg-white rounded-2xl border border-stone-100 flex flex-col sm:flex-row gap-3.5 justify-between items-start sm:items-center hover:border-emerald-300 transition-colors">
                            <div className="flex gap-3 items-center min-w-0">
                              <img src={p.imageUrl} alt={p.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                              <div className="min-w-0">
                                <h4 className="font-medium text-sm text-stone-800 truncate">{p.name}</h4>
                                <p className="text-[10px] text-stone-400 line-clamp-1">{p.description}</p>
                                <p className="text-xs font-bold font-mono text-emerald-800 mt-1">
                                  R$ {p.price.toFixed(2)}/ <span className="font-normal text-[10px] text-stone-400">{p.unit}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end shrink-0 pt-2 sm:pt-0">
                              {/* Pre-Add Quantity selector */}
                              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(p.id, getSelectedQuantity(p.id) - 1)}
                                  className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs font-bold text-stone-900 w-5 text-center">
                                  {getSelectedQuantity(p.id)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setSelectedQuantity(p.id, getSelectedQuantity(p.id) + 1)}
                                  className="w-5 h-5 bg-white hover:bg-stone-50 rounded-md flex items-center justify-center text-stone-800 text-xs font-bold border cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Favorite product toggle */}
                                <button
                                  onClick={() => handleToggleFavoriteProduct(p.id)}
                                  className="p-1.5 bg-stone-50 hover:bg-stone-100 rounded-lg text-stone-500 cursor-pointer"
                                >
                                  <DynamicIcon name="Star" className={`w-3.5 h-3.5 ${isFav ? "text-amber-400 fill-amber-400" : "text-stone-300"}`} />
                                </button>
                                
                                <button
                                  onClick={() => handleAddToCart(p.id)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer flex items-center gap-1 text-xs font-bold"
                                >
                                  <DynamicIcon name="Plus" className="w-4 h-4" />
                                  comprar
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
            );
          })()}
        </div>
      )}

      {/* SCREEN D: MULTI-VENDOR CART AGGREGATOR */}
      {currentScreen === "cart" && !viewingProducerId && (
        <div className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs">
          <div className="border-b pb-3.5">
            <h3 className="font-display font-bold text-stone-900 text-lg">Meu Carrinho de Compras</h3>
            <p className="text-xs text-stone-500 mt-1">Ao finalizar, seus itens serão subdivididos automaticamente por produtor.</p>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-xs">
              <DynamicIcon name="ShoppingBag" className="w-12 h-12 text-stone-300 mx-auto" />
              <p className="text-stone-600 font-medium mt-3">Carrinho vazio</p>
              <p className="text-stone-400 text-[11px] mt-1">Navegue pelas ofertas da feira livre e adicione orgânicos deliciosos!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cart List Grouped per Vendor */}
              {cartAggrList.map((entry) => (
                <div key={entry.producerId} className="p-5 bg-stone-50 rounded-2xl border border-stone-150 space-y-4">
                  {/* Vendor Title details */}
                  <div className="flex justify-between items-center border-b border-stone-200 pb-2.5">
                    <div>
                      <h4 className="font-display font-bold text-stone-900 text-sm">{entry.producerName}</h4>
                      <p className="text-[10px] text-stone-500 font-mono">Distância de entrega: {entry.distance} km</p>
                    </div>

                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${
                      entry.supportsDelivery ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {entry.supportsDelivery ? "Suporta Entrega" : "Sítio aceita apenas Retirada"}
                    </span>
                  </div>

                  {/* Cart items inside this vendor */}
                  <div className="space-y-4">
                    {entry.items.map((it) => (
                      <div key={it.product.id} className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-stone-100 last:border-0 last:pb-0 gap-3">
                        <div className="flex gap-2.5 items-center min-w-0">
                          <img src={it.product.imageUrl} alt={it.product.name} className="w-11 h-11 rounded-lg object-cover border shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-stone-850 text-xs truncate">{it.product.name}</p>
                            <span className="text-[10px] text-stone-400 font-mono leading-none">R$ {it.product.price.toFixed(2)} / {it.product.unit}</span>
                          </div>
                        </div>

                        {/* Selection and Quantity Control Group */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 flex-wrap">
                          {/* Choose delivery/pickup selector FOR THIS PRODUCT */}
                          <div className="flex bg-[#E6E6DF]/50 p-1 rounded-lg border border-[#E6E6DF] items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleSetItemDeliveryMethod(it.product.id, "delivery")}
                              disabled={!entry.supportsDelivery}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                it.deliveryMethod === "delivery"
                                  ? "bg-[#5A5A40] text-white shadow-xs"
                                  : "text-stone-500 hover:text-[#5A5A40] disabled:opacity-30"
                              }`}
                              title={!entry.supportsDelivery ? "Entrega indisponível para esta distância ou produtor" : "Escolher Entrega para este produto"}
                            >
                              🚚 Enviar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSetItemDeliveryMethod(it.product.id, "pickup")}
                              className={`px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all ${
                                it.deliveryMethod === "pickup"
                                  ? "bg-[#D4A373] text-white shadow-xs"
                                  : "text-stone-500 hover:text-[#D4A373]"
                              }`}
                              title="Escolher Retirar este produto diretamente"
                            >
                              🛍️ Retirar
                            </button>
                          </div>

                          {/* Quantity control */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityChange(it.product.id, -1)}
                              className="p-1.5 bg-stone-200 hover:bg-stone-300 rounded text-xs cursor-pointer font-bold shrink-0 w-7 h-7 flex items-center justify-center text-stone-700"
                            >
                              -
                            </button>
                            <span className="font-mono text-xs w-6 text-center font-bold text-stone-800">{it.quantity}</span>
                            <button
                              onClick={() => handleAddToCart(it.product.id)}
                              className="p-1.5 bg-stone-200 hover:bg-stone-300 rounded text-xs cursor-pointer font-bold shrink-0 w-7 h-7 flex items-center justify-center text-stone-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Individual sub totals calculation */}
                  <div className="flex justify-between text-xs font-semibold pt-3 border-t text-[#8E8E7A]">
                    <p>Total dos Produtos: <span className="text-stone-800 font-mono">R$ {entry.subtotal.toFixed(2)}</span></p>
                    <p>Frete do Produtor: <span className="text-stone-800 font-mono">{entry.deliveryFee > 0 ? `R$ ${entry.deliveryFee.toFixed(2)}` : "Grátis / Retirar"}</span></p>
                  </div>
                </div>
              ))}

              {/* Total Costs Checkout actions details */}
              <div className="bg-stone-50 p-6 rounded-[24px] border border-stone-150 space-y-4">
                <h4 className="text-xs font-bold uppercase text-stone-600 tracking-wider font-mono">Resumo Financeiro da Compra</h4>
                
                <div className="space-y-2 text-xs border-b border-stone-200 pb-3">
                  <div className="flex justify-between text-stone-600">
                    <span>Valor em Alimentos:</span>
                    <span className="font-mono text-stone-900 font-bold">R$ {totalProductsCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Valor Total do Frete/Envio:</span>
                    <span className="font-mono text-stone-900 font-bold">R$ {totalDeliveryCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center font-bold text-base py-1">
                  <p className="font-serif text-[#5A5A40] font-bold text-lg">Total Geral a Pagar</p>
                  <p className="font-mono text-xl text-[#3D3D33]">R$ {totalCartCost.toFixed(2)}</p>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-[#5A5A40] hover:bg-[#4A4A35] text-white text-xs font-bold rounded-xl uppercase tracking-widest cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <DynamicIcon name="ShoppingBag" className="w-4 h-4" />
                  <span>Finalizar e Enviar Pedidos</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SCREEN E: ORDER HISTORY & REALTIME TRACKING PROGRESS */}
      {currentScreen === "orders" && !viewingProducerId && (
        <div className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs">
          <div className="border-b pb-3.5">
            <h3 className="font-display font-bold text-stone-904 text-lg">Pedidos e Rastreamento</h3>
            <p className="text-xs text-stone-500 mt-1">Fique por dentro das atualizações de frescor de cada sitiante.</p>
          </div>

          {/* Evaluating completed review */}
          {reviewingOrderId && (
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 animate-slide-up space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-bold text-stone-900 text-sm">⭐ Avaliar Produtor</h4>
                <button onClick={() => setReviewingOrderId(null)} className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer">
                  <DynamicIcon name="X" className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-stone-600">Por regras do aplicativo, você avalia estrelas de 1 a 5 para expressar seu grau de satisfação (não há comentários comentados publicamente para evitar discussões).</p>

              <form onSubmit={handleReviewSubmit} className="flex gap-4 items-center">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewFormRating(star)}
                      className="p-1"
                    >
                      <DynamicIcon
                        name="Star"
                        className={`w-6 h-6 hover:scale-110 transition-transform ${
                          star <= reviewFormRating ? "text-amber-400 fill-amber-400" : "text-stone-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  className="bg-emerald-600 text-xs font-bold text-white px-4 py-2 rounded-xl hover:bg-emerald-700 cursor-pointer"
                >
                  Enviar Nota
                </button>
              </form>
            </div>
          )}

          {orders.filter(o => o.userId === currentUser.id).length === 0 ? (
            <p className="text-xs text-stone-400 text-center py-6">Você ainda não realizou pedidos na cidade.</p>
          ) : (
            <div className="space-y-6">
              {orders
                .filter(o => o.userId === currentUser.id)
                .map((o) => {
                  return (
                    <div key={o.id} className="bg-stone-50 rounded-3xl p-5 border border-stone-150 space-y-4 shadow-2xs">
                      {/* Meta information row */}
                      <div className="flex justify-between items-start flex-wrap gap-2.5">
                        <div>
                          <p className="bg-stone-200 text-stone-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase inline-block">
                            Pedido #{o.id}
                          </p>
                          <h4 className="font-display font-bold text-stone-900 text-sm mt-1">{o.producerName}</h4>
                          <p className="text-[10px] text-stone-400">
                            {new Date(o.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Review button if delivered */}
                        {o.status === "entregue" && !o.hasBeenReviewed && (
                          <button
                            onClick={() => {
                              setReviewingOrderId(o.id);
                              setReviewFormRating(5);
                            }}
                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold p-1 px-3 rounded-xl cursor-pointer"
                          >
                            Avaliar Compra ⭐
                          </button>
                        )}
                        {o.status === "entregue" && o.hasBeenReviewed && (
                          <span className="text-[10px] bg-stone-200 text-stone-500 font-bold px-2.5 py-1 rounded">✓ Avaliado</span>
                        )}
                      </div>

                      {/* Line products list */}
                      <div className="space-y-1 bg-white p-3.5 rounded-2xl border">
                        {o.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-stone-700">{it.quantity}x {it.productName} ({it.unit})</span>
                            <span className="font-mono text-stone-900">R$ {(it.price * it.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Live Tracking Milestones indicator progress bar 7 points */}
                      <div>
                        <p className="text-[9px] uppercase font-bold text-stone-400 tracking-wide mb-2.5">Passos de Acompanhamento</p>
                        <div className="grid grid-cols-7 gap-1 font-sans text-center">
                          {[
                            { step: "recebido", label: "Recebido" },
                            { step: "aguardando_aceitacao", label: "Aguard. Aceite" },
                            { step: "aceito", label: "Aceito" },
                            { step: "preparacao", label: "Em Preparo" },
                            { step: "entrega", label: o.deliveryMethod === "pickup" ? "Pronto p/ Retirada" : "Saiu p/ Envio" },
                            { step: "entregue", label: o.deliveryMethod === "pickup" ? "Retirado" : "Entregue" },
                            { step: "cancelado", label: "Cancelado" },
                          ].map((t, stepIdx) => {
                            const isCurrent = o.status === t.step;
                            // Check previous steps to shade correctly
                            const activeStepsList: OrderStatus[] = ["recebido", "aguardando_aceitacao", "aceito", "preparacao", "entrega", "entregue"];
                            const currentIdx = activeStepsList.indexOf(o.status);
                            const thisStepIdx = activeStepsList.indexOf(t.step as any);
                            const isPassed = thisStepIdx !== -1 && currentIdx >= thisStepIdx;

                            // Skip cancel view if not canceled
                            if (t.step === "cancelado" && o.status !== "cancelado") return null;

                            return (
                              <div key={stepIdx} className="space-y-1 text-center flex flex-col items-center">
                                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center  ${
                                  isCanceled(o, t) ? "bg-red-400" :
                                  isCurrent ? "bg-emerald-600 scale-125 border border-emerald-300 animate-pulse" :
                                  isPassed ? "bg-emerald-500" : "bg-stone-200"
                                }`}>
                                </div>
                                <p className={`text-[8px] font-bold leading-none ${isCurrent ? "text-emerald-800" : "text-stone-450"}`}>{t.label}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Chat communication toggle */}
                      <div className="flex justify-end pt-3">
                        <button
                          onClick={() => {
                            onSendMessage("Olá, gostaria de informações sobre meu pedido!", o.id, o.producerId);
                            // Simulates chat redirection automatically
                            alert("Chat iniciado com o produtor! Vá para a guia de conversas e continue.");
                          }}
                          className="px-3 py-1.5 border border-stone-250 hover:bg-stone-100 rounded-xl text-xs font-semibold text-stone-700 cursor-pointer flex items-center gap-1"
                        >
                          <DynamicIcon name="MessageSquare" className="w-3.5 h-3.5 text-emerald-600" /> Conversar sobre o pedido
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* RENDER VIEW FAVORITES LOOP */}
      {currentScreen === "favorites" && !viewingProducerId && (
        <div className="space-y-6 animate-fade-in bg-white p-6 rounded-3xl border border-stone-100 shadow-2xs">
          <div>
            <h3 className="font-display font-bold text-stone-900 text-base">Meus Produtores Seguidos ({currentUser.followedProducerIds.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              {currentUser.followedProducerIds.map((pId) => {
                const prod = producers.find(p => p.id === pId);
                if (!prod) return null;
                return (
                  <div key={pId} className="p-4 bg-stone-50 rounded-2xl border border-stone-150 flex justify-between items-center shadow-2xs">
                    <div className="flex gap-3 items-center">
                      <img src={prod.logoUrl} alt="Store logo" className="w-10 h-10 rounded-xl object-cover shrink-0" />
                      <div>
                        <p className="font-bold text-xs text-stone-900">{prod.propertyName}</p>
                        <p className="text-[10px] text-stone-500">{prod.address.split(",")[0]}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewingProducerId(prod.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                    >
                      Ver catalogo
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-stone-101">
            <h3 className="font-display font-bold text-stone-900 text-base">Produtos Favoritos ({currentUser.favoriteProductIds.length})</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
              {currentUser.favoriteProductIds.map((pId) => {
                const pItem = products.find(p => p.id === pId);
                if (!pItem) return null;
                return (
                  <div key={pId} className="p-3.5 bg-white rounded-2xl border border-stone-150 flex gap-3.5 items-center justify-between shadow-2xs">
                    <div className="flex gap-2.5 items-center min-w-0">
                      <img src={pItem.imageUrl} alt={pItem.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-stone-800 truncate">{pItem.name}</p>
                        <p className="text-[10px] text-emerald-800 font-semibold font-mono">R$ {pItem.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddToCart(pItem.id)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer shrink-0"
                    >
                      <DynamicIcon name="Plus" className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SCREEN: CLIENT PROFILE & ADDRESSES */}
      {currentScreen === "profile" && !viewingProducerId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-stone-800">
          
          {/* Left Column: Personal Information & Avatar */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-stone-150 shadow-2xs space-y-6 h-fit">
            <h3 className="font-display font-bold text-stone-900 text-base">Meus Dados Cadastrais</h3>
            
            <form onSubmit={handleSavePersonalProfile} className="space-y-4">
              {/* Profile Avatar Upload */}
              <div className="flex flex-col items-center space-y-3">
                <div className="relative w-24 h-24 rounded-full border border-stone-200 overflow-hidden bg-stone-100 flex items-center justify-center shrink-0">
                  {profileAvatar ? (
                    <img src={profileAvatar} className="w-full h-full object-cover" alt="Foto de perfil" />
                  ) : (
                    <div className="text-3xl font-display text-stone-450">
                      {profileName ? profileName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="client-avatar-file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setProfileAvatar(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <label
                    htmlFor="client-avatar-file"
                    className="px-3 py-1.5 bg-stone-100 border border-stone-250 rounded-xl text-xs font-bold cursor-pointer hover:bg-stone-200 text-stone-700 transition-colors inline-block"
                  >
                    Alterar Foto de Perfil
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs text-stone-600 font-semibold block mb-1">Nome Completo</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 font-semibold block mb-1">Email de Contato</label>
                <input
                  type="email"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-emerald-600"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-stone-600 font-semibold block mb-1">Celular / WhatsApp</label>
                <input
                  type="text"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-emerald-600 font-mono"
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Salvar Dados Pessoais
              </button>
            </form>
          </div>

          {/* Right Column: Address Management */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Selection List */}
            <div className="bg-white p-6 rounded-3xl border border-stone-150 shadow-2xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-display font-bold text-stone-900 text-base">Meus Endereços de Entrega</h3>
                  <p className="text-[10px] text-stone-500">Selecione o endereço padrão de entrega nos círculos de seleção.</p>
                </div>
                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#5A5A40] border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <DynamicIcon name={showAddressForm ? "ChevronUp" : "Plus"} className="w-3.5 h-3.5" />
                  {showAddressForm ? "Cancelar" : "Novo Endereço"}
                </button>
              </div>

              {/* Add New Address Form Expansion */}
              {showAddressForm && (
                <form onSubmit={handleAddNewAddressSubmit} className="p-4 bg-stone-50 rounded-2xl border border-stone-150 space-y-3 animate-fade-in">
                  <span className="text-[10px] font-bold text-stone-500 uppercase block tracking-wider">Novo Endereço de Entrega</span>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">Identificar como (Ex: Sítio)</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                        placeholder="Ex: Trabalho"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">Rua / Logradouro</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={addrForm.street}
                        onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                        placeholder="Rua da Lagoa"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">Número</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={addrForm.number}
                        onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                        placeholder="123"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">Bairro</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={addrForm.neighborhood}
                        onChange={(e) => setAddrForm({ ...addrForm, neighborhood: e.target.value })}
                        placeholder="Centro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">Cidade</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-stone-600 font-semibold block mb-1">CEP</label>
                      <input
                        type="text"
                        className="w-full p-2 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                        value={addrForm.zipCode}
                        onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })}
                        placeholder="13485-100"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#5A5A40] text-white font-bold py-2 rounded-xl text-xs mt-2 cursor-pointer"
                  >
                    Adicionar e Ativar Endereço
                  </button>
                </form>
              )}

              {/* List Cards */}
              <div className="space-y-3">
                {currentUser.addresses.map((addr) => {
                  const isSelected = addr.id === currentUser.selectedAddressId;
                  return (
                    <label
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr.id)}
                      className={`p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-emerald-50/50 border-emerald-500 scale-[1.01] shadow-xs"
                          : "bg-stone-50 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={isSelected}
                        onChange={() => handleSelectAddress(addr.id)}
                        className="accent-emerald-600 mt-1 cursor-pointer w-4 h-4"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isSelected ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                          }`}>
                            {addr.label}
                          </span>
                          {isSelected && (
                            <span className="text-[9px] text-emerald-700 font-semibold">Endereço de Entrega Selecionado</span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-stone-850 mt-1">
                          {addr.street}, {addr.number}
                        </p>
                        <p className="text-[10px] text-stone-500">
                          {addr.neighborhood} - {addr.city} / {addr.state}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Floating alert toast notification display */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 border border-stone-800 text-white font-bold py-3 px-5 rounded-2xl shadow-xl z-50 text-xs sm:text-sm animate-bounce flex items-center gap-2">
          <DynamicIcon name="Check" className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

function isCanceled(o: Order, t: any) {
  return t.step === "cancelado" && o.status === "cancelado";
}
