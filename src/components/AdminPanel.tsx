/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Producer, Product, Selo, Category, Review, Order } from "../types";
import { DynamicIcon } from "./Icons";
import { calculateDistance } from "../data";

interface AdminPanelProps {
  users: User[];
  producers: Producer[];
  products: Product[];
  selos: Selo[];
  categories: Category[];
  reviews: Review[];
  orders: Order[];
  currentUser: User;
  onUpdateUsers: (users: User[]) => void;
  onUpdateProducers: (producers: Producer[]) => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateSelos: (selos: Selo[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateReviews: (reviews: Review[]) => void;
}

export default function AdminPanel({
  users,
  producers,
  products,
  selos,
  categories,
  reviews,
  orders,
  currentUser,
  onUpdateUsers,
  onUpdateProducers,
  onUpdateProducts,
  onUpdateSelos,
  onUpdateCategories,
  onUpdateReviews,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "users" | "producers" | "products" | "categories" | "selos" | "reviews" | "map">("dashboard");

  // Admin states for creations
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSeloName, setNewSeloName] = useState("");
  const [newSeloDesc, setNewSeloDesc] = useState("");
  const [newSeloIcon, setNewSeloIcon] = useState("Leaf");
  const [newSeloColor, setNewSeloColor] = useState("bg-emerald-100 text-emerald-800 border-emerald-300");

  // Filter alerts / active modals
  const [assigningSeloProducerId, setAssigningSeloProducerId] = useState<string | null>(null);

  // Stats calculation
  const totalUsers = users.length;
  const totalProducers = producers.length;
  const totalOrders = orders.length;
  const totalCompletedOrders = orders.filter(o => o.status === "entregue").length;
  
  // Volume by period
  const totalRevenue = orders
    .filter(o => o.status !== "cancelado")
    .reduce((sum, o) => sum + o.total, 0);

  // Top products (most viewed or ordered)
  const sortedProductsByViews = [...products].sort((a, b) => b.viewsCount - a.viewsCount).slice(0, 5);
  const sortedProductsByOrders = [...products].sort((a, b) => b.ordersCount - a.ordersCount).slice(0, 5);

  // Top producers (highest count of active reviews and products)
  const getProducerProductsCount = (pId: string) => products.filter(p => p.producerId === pId).length;
  const getProducerRating = (pId: string) => {
    const prodReviews = reviews.filter(r => r.producerId === pId && r.isApproved);
    if (!prodReviews.length) return 5.0;
    return Math.round((prodReviews.reduce((sum, r) => sum + r.rating, 0) / prodReviews.length) * 10) / 10;
  };

  // Toggles User Status
  const handleToggleUserStatus = (userId: string) => {
    const updated = users.map(u => (u.id === userId ? { ...u, isActive: !u.isActive } : u));
    onUpdateUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm("Você quer mesmo excluir este usuário permanentemente? Ele perderá o acesso e terá que refazer o cadastro.")) {
      const isProd = producers.some(p => p.id === userId);
      if (isProd) {
        if (!confirm("Este usuário também é um Produtor cadastrado. Excluir o usuário irá remover automaticamente seu perfil de produtor e todos os seus produtos cadastrados. Deseja continuar?")) {
          return;
        }
      }
      
      const updatedUsers = users.filter(u => u.id !== userId);
      onUpdateUsers(updatedUsers);

      const updatedProducers = producers.filter(p => p.id !== userId);
      onUpdateProducers(updatedProducers);

      const updatedProducts = products.filter(p => p.producerId !== userId);
      onUpdateProducts(updatedProducts);

      alert("Usuário, propriedade e produtos associados apagados com sucesso.");
    }
  };

  const handleDeleteProducer = (producerId: string) => {
    if (confirm("Você quer mesmo excluir permanentemente o perfil de produtor desta propriedade? Seus produtos catalogados serão deletados e ele precisará refazer o cadastro de produtor.")) {
      const updatedProducers = producers.filter(p => p.id !== producerId);
      onUpdateProducers(updatedProducers);

      const updatedProducts = products.filter(p => p.producerId !== producerId);
      onUpdateProducts(updatedProducts);

      const updatedUsers = users.map(u => u.id === producerId ? { ...u, isProducer: false } : u);
      onUpdateUsers(updatedUsers);

      alert("Perfil de produtor e produtos removidos com sucesso. O usuário foi mantido como consumidor comum.");
    }
  };

  // Toggles Producer Suspend Status
  const handleToggleProducerSuspension = (prodId: string) => {
    const updated = producers.map(p => (p.id === prodId ? { ...p, isSuspended: !p.isSuspended } : p));
    onUpdateProducers(updated);
  };

  // Toggles Product Visibility or Removes It
  const handleToggleProductVisibility = (prodId: string) => {
    const updated = products.map(p => (p.id === prodId ? { ...p, isVisible: !p.isVisible } : p));
    onUpdateProducts(updated);
  };

  const handleRemoveProduct = (prodId: string) => {
    const updated = products.filter(p => p.id !== prodId);
    onUpdateProducts(updated);
  };

  // Category Actions
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    const slug = newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const newCat = {
      id: "cat_" + Date.now(),
      name: newCategoryName,
      slug,
    };
    onUpdateCategories([...categories, newCat]);
    setNewCategoryName("");
  };

  const handleRemoveCategory = (catId: string) => {
    onUpdateCategories(categories.filter(c => c.id !== catId));
  };

  // Selos Actions
  const handleAddSelo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeloName.trim() || !newSeloDesc.trim()) return;
    const newS = {
      id: "selo_" + Date.now(),
      name: newSeloName,
      description: newSeloDesc,
      icon: newSeloIcon,
      color: newSeloColor,
    };
    onUpdateSelos([...selos, newS]);
    setNewSeloName("");
    setNewSeloDesc("");
  };

  const handleRemoveSelo = (seloId: string) => {
    // Remove from selos list
    onUpdateSelos(selos.filter(s => s.id !== seloId));
    // Remove from any producer having it
    const updatedProducers = producers.map(p => ({
      ...p,
      seloIds: p.seloIds.filter(id => id !== seloId),
    }));
    onUpdateProducers(updatedProducers);
  };

  const handleAssignSelo = (producerId: string, seloId: string) => {
    const updatedProducers = producers.map(p => {
      if (p.id === producerId) {
        const alreadyHas = p.seloIds.includes(seloId);
        const seloIds = alreadyHas
          ? p.seloIds.filter(id => id !== seloId)
          : [...p.seloIds, seloId];
        return { ...p, seloIds };
      }
      return p;
    });
    onUpdateProducers(updatedProducers);
  };

  // Review Actions
  const handleApproveReview = (revId: string) => {
    const updated = reviews.map(r => (r.id === revId ? { ...r, isApproved: !r.isApproved } : r));
    onUpdateReviews(updated);
  };

  const handleRemoveReview = (revId: string) => {
    onUpdateReviews(reviews.filter(r => r.id !== revId));
  };

  // SVG Coordinates bounds for Growers map
  // Map center will be placed around client address coordinates (weighted -22.86, -47.22)
  const mapCenterLat = -22.86;
  const mapCenterLng = -47.22;
  const getMapCoords = (lat: number, lng: number) => {
    // Scale up and translate coordinates so it visually distributes cleanly on a 400x250 canvas
    const x = 200 + (lng - mapCenterLng) * 4000;
    const y = 125 - (lat - mapCenterLat) * 4000;
    // Bounds limit
    return {
      x: Math.max(15, Math.min(385, x)),
      y: Math.max(15, Math.min(235, y)),
    };
  };

  return (
    <div id="admin-panel" className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden font-sans">
      {/* Admin Title Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-emerald-950 p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-1 rounded-full font-medium inline-flex items-center gap-1.5 uppercase tracking-wide">
              <DynamicIcon name="Shield" className="w-3.5 h-3.5" /> Painel de Moderação e Gestão
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold mt-2">CampoConecta Queimados</h1>
            <p className="text-stone-300 text-sm mt-1">Gestor do sistema de conexão produtor-consumidor.</p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
            <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center font-display font-medium text-white shadow-inner">
              A
            </div>
            <div>
              <p className="text-xs text-stone-400">Administrador Ativo</p>
              <p className="text-sm font-medium">{currentUser.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Row Indicator */}
      <div className="flex border-b border-stone-100 overflow-x-auto bg-stone-50/50">
        {[
          { id: "dashboard", label: "Relatórios & Estatísticas", icon: "Activity" },
          { id: "users", label: "Usuários", icon: "User" },
          { id: "producers", label: "Produtores", icon: "Store" },
          { id: "products", label: "Produtos", icon: "ShoppingBag" },
          { id: "categories", label: "Categorias", icon: "Filter" },
          { id: "selos", label: "Selos", icon: "Award" },
          { id: "reviews", label: "Avaliações", icon: "Star" },
          { id: "map", label: "Mapa Geográfico", icon: "Map" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "border-emerald-600 text-emerald-700 bg-white"
                : "border-transparent text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <DynamicIcon name={tab.icon} className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6 sm:p-8">
        {/* TAB 1: DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-fade-in">
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center gap-4">
                <div className="p-3.5 bg-sky-100 text-sky-700 rounded-2xl">
                  <DynamicIcon name="User" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Total de Usuários</p>
                  <p className="text-2xl font-display font-bold">{totalUsers}</p>
                  <p className="text-xs text-stone-500 mt-0.5">👥 Cadastrados na Cidade</p>
                </div>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center gap-4">
                <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl">
                  <DynamicIcon name="Store" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Total de Produtores</p>
                  <p className="text-2xl font-display font-bold">{totalProducers}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Agricultura Familiar</p>
                </div>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center gap-4">
                <div className="p-3.5 bg-amber-100 text-amber-700 rounded-2xl">
                  <DynamicIcon name="ShoppingBag" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Volume de Pedidos</p>
                  <p className="text-2xl font-display font-bold">{totalOrders}</p>
                  <p className="text-xs text-stone-500 mt-0.5">📈 {totalCompletedOrders} entregues com sucesso</p>
                </div>
              </div>

              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex items-center gap-4">
                <div className="p-3.5 bg-teal-100 text-teal-700 rounded-2xl">
                  <DynamicIcon name="DollarSign" className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-stone-500 text-xs">Volume Negociado</p>
                  <p className="text-2xl font-display font-bold text-emerald-700">
                    R$ {totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">💰 Transações locais simuladas</p>
                </div>
              </div>
            </div>

            {/* Structured Report Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Sales and volume estimation */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="font-display font-semibold text-lg text-stone-900">Volume de Pedidos por Período</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">Histórico Geral</span>
                </div>
                
                {/* Visual Chart Bars */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Hoje</span>
                      <span className="font-semibold text-stone-700">1 pedido (R$ 25,00)</span>
                    </div>
                    <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "20%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Últimos 3 dias</span>
                      <span className="font-semibold text-stone-700">2 pedidos (R$ 61,50)</span>
                    </div>
                    <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: "45%" }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs text-stone-500 mb-1">
                      <span>Últimos 7 dias</span>
                      <span className="font-semibold text-stone-700">{totalOrders} pedidos (R$ {totalRevenue.toFixed(2)})</span>
                    </div>
                    <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600 rounded-full" style={{ width: "100%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <h3 className="font-display font-semibold text-sm text-stone-900 mb-3">Produtores mais Acessados</h3>
                  <div className="space-y-3">
                    {producers.map((producer) => {
                      const totalC = products
                        .filter(p => p.producerId === producer.id)
                        .reduce((sum, p) => sum + p.viewsCount, 0);
                      return (
                        <div key={producer.id} className="flex justify-between items-center text-sm">
                          <span className="text-stone-600 truncate max-w-[200px]">{producer.propertyName}</span>
                          <span className="font-mono text-xs bg-stone-200/60 px-2.5 py-0.5 rounded-md text-stone-700">{totalC} visualizações</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Top products and stats */}
              <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 space-y-6">
                <div>
                  <h3 className="font-display font-semibold text-lg text-stone-900 mb-3">Produtos Mais Procurados (Cliques)</h3>
                  <div className="divide-y divide-stone-200">
                    {sortedProductsByViews.map((p, index) => (
                      <div key={p.id} className="py-2.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm font-semibold text-emerald-600">#{index + 1}</span>
                          <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <p className="text-sm font-medium text-stone-800">{p.name}</p>
                            <p className="text-xs text-stone-400">{p.category}</p>
                          </div>
                        </div>
                        <span className="text-xs bg-stone-200 px-2.5 py-1 rounded-full text-stone-700 font-medium">
                          {p.viewsCount} cliques
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-200">
                  <h3 className="font-display font-semibold text-sm text-stone-900 mb-3 flex items-center gap-1">
                    <DynamicIcon name="Activity" className="w-4 h-4 text-emerald-600" /> Mais Pedidos da Semana
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    {sortedProductsByOrders.slice(0, 4).map((p) => (
                      <div key={p.id} className="bg-white p-3 rounded-xl border border-stone-100 shadow-xs">
                        <p className="text-xs text-stone-500 font-medium truncate">{p.name}</p>
                        <p className="text-lg font-bold font-display text-emerald-800 mt-1">{p.ordersCount}x</p>
                        <p className="text-[10px] text-stone-400">pedidos confirmados</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: GESTÃO DE USUÁRIOS */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Controle de Clientes cadastrados</h3>
                <p className="text-stone-500 text-xs">Bloqueie ou reative contas instantaneamente.</p>
              </div>
              <span className="text-xs text-stone-500 font-semibold">{users.length} usuários</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-xs font-semibold text-stone-500 border-b border-stone-100 uppercase tracking-widest">
                      <th className="p-4">Nome & CPF</th>
                      <th className="p-4">Contato & Email</th>
                      <th className="p-4">Endereços</th>
                      <th className="p-4">Perfis Ativos</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-50/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={u.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150"} alt={u.name} className="w-9 h-9 rounded-full object-cover" />
                            <div>
                              <p className="font-medium text-stone-900">{u.name}</p>
                              <p className="text-xs text-stone-400 font-mono">CPF: {u.cpf}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-stone-800">{u.email}</p>
                          <p className="text-xs text-stone-400">{u.phone}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs bg-stone-100 py-1 px-2.5 rounded-full font-medium">
                            {u.addresses.length} cadastrados
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1.5 flex-wrap">
                            {u.isClient && <span className="text-[10px] uppercase font-bold tracking-wide bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md border border-blue-100">Cliente</span>}
                            {u.isProducer && <span className="text-[10px] uppercase font-bold tracking-wide bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100">Produtor</span>}
                          </div>
                        </td>
                        <td className="p-4">
                          {u.isActive ? (
                            <span className="bg-emerald-100 text-emerald-800 text-xs py-1 px-2.5 rounded-full font-medium inline-flex items-center gap-1">
                              ● Ativo
                            </span>
                          ) : (
                            <span className="bg-red-100 text-red-800 text-xs py-1 px-2.5 rounded-full font-medium inline-flex items-center gap-1">
                              ● Bloqueado
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleUserStatus(u.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                                u.isActive
                                  ? "border-red-200 text-red-600 hover:bg-red-50"
                                  : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                              }`}
                            >
                              {u.isActive ? "Bloquear" : "Reativar"}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center justify-center"
                              title="Excluir Usuário"
                            >
                              <DynamicIcon name="Trash" className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GESTÃO DE PRODUTORES */}
        {activeTab === "producers" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Moderação de Produtores Locais</h3>
                <p className="text-stone-500 text-xs">Acompanhe as marcas e gerencie suspensões.</p>
              </div>
              <span className="text-xs text-stone-500 font-semibold">{producers.length} marcas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {producers.map((p) => {
                const userOwner = users.find(u => u.id === p.id);
                return (
                  <div key={p.id} className={`p-6 rounded-2xl border shadow-xs transition-colors bg-white ${p.isSuspended ? "border-red-200 bg-red-50/10" : "border-stone-150"}`}>
                    <div className="flex gap-4 items-start">
                      <img src={p.logoUrl} alt={p.propertyName} className="w-14 h-14 rounded-xl object-cover border" />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-display font-semibold text-stone-900 text-base">{p.propertyName}</h4>
                          {p.isSuspended && (
                            <span className="text-[10px] tracking-wide uppercase font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded border border-red-200">Suspenso</span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 leading-normal line-clamp-2">{p.description}</p>
                        <p className="text-xs font-mono text-stone-400">Dono: {userOwner?.name || "Desconhecido"}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-100 flex flex-wrap gap-1.5">
                      {p.seloIds.map(sId => {
                        const selo = selos.find(s => s.id === sId);
                        if (!selo) return null;
                        return (
                          <span key={sId} className="text-[10px] px-2 py-0.5 rounded border inline-flex items-center gap-0.5 font-medium bg-stone-100 text-stone-700">
                            <DynamicIcon name={selo.icon} className="w-2.5 h-2.5" /> {selo.name}
                          </span>
                        );
                      })}
                    </div>

                    <div className="mt-6 flex gap-2 justify-end">
                      <button
                        onClick={() => {
                          setAssigningSeloProducerId(p.id);
                        }}
                        className="px-3 py-1.5 border border-stone-200 text-stone-600 rounded-xl text-xs font-semibold hover:bg-stone-50 cursor-pointer flex items-center gap-1"
                      >
                        <DynamicIcon name="Award" className="w-3.5 h-3.5 text-amber-500" /> Selos
                      </button>

                      <button
                        onClick={() => handleToggleProducerSuspension(p.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-colors ${
                          p.isSuspended
                            ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            : "border-amber-200 text-amber-600 hover:bg-amber-50"
                        }`}
                      >
                        {p.isSuspended ? "Reativar" : "Suspender"}
                      </button>

                      <button
                        onClick={() => handleDeleteProducer(p.id)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold hover:border-red-300 cursor-pointer flex items-center gap-1 transition-colors"
                        title="Excluir Produtor permanentemente"
                      >
                        <DynamicIcon name="Trash" className="w-3.5 h-3.5" /> Excluir
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selos Assignment Modal overlay-like slider */}
            {assigningSeloProducerId && (
              <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 animate-slide-up space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-display font-semibold text-stone-900 text-sm">
                      Atribuir Selos para:{" "}
                      <span className="text-emerald-700">
                        {producers.find(p => p.id === assigningSeloProducerId)?.propertyName}
                      </span>
                    </h4>
                    <p className="text-xs text-stone-500">Selecione quais selos destacar na página pública do produtor.</p>
                  </div>
                  <button
                    onClick={() => setAssigningSeloProducerId(null)}
                    className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <DynamicIcon name="X" className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {selos.map((s) => {
                    const prod = producers.find(p => p.id === assigningSeloProducerId);
                    const isChecked = prod?.seloIds.includes(s.id) || false;
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleAssignSelo(assigningSeloProducerId, s.id)}
                        className={`p-3.5 border rounded-xl text-left transition-all cursor-pointer flex gap-3 items-start ${
                          isChecked ? "border-emerald-600 bg-emerald-50/40" : "border-stone-200 bg-white"
                        }`}
                      >
                        <div className={`p-1.5 rounded-full ${s.color}`}>
                          <DynamicIcon name={s.icon} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-stone-900 flex justify-between items-center">
                            {s.name}
                            {isChecked && <DynamicIcon name="Check" className="w-3.5 h-3.5 text-emerald-600" />}
                          </p>
                          <p className="text-[10px] text-stone-500 leading-snug line-clamp-2 mt-0.5">{s.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GESTÃO DE PRODUTOS */}
        {activeTab === "products" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Moderação de Anúncios</h3>
                <p className="text-stone-500 text-xs">Exclua itens fora do regulamento ou force ocultação.</p>
              </div>
              <span className="text-xs text-stone-500 font-semibold">{products.length} anúncios</span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 text-xs font-semibold text-stone-500 border-b border-stone-100 uppercase tracking-widest">
                      <th className="p-4">Produto</th>
                      <th className="p-4">Produtor</th>
                      <th className="p-4">Categoria</th>
                      <th className="p-4 font-mono">Preço</th>
                      <th className="p-4 text-center">Visualização</th>
                      <th className="p-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm">
                    {products.map((p) => {
                      const prodInfo = producers.find(producer => producer.id === p.producerId);
                      return (
                        <tr key={p.id} className="hover:bg-stone-50/50">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div className="max-w-[200px]">
                                <p className="font-medium text-stone-900 truncate">{p.name}</p>
                                <p className="text-[10px] text-stone-400 line-clamp-1">{p.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-medium text-emerald-800">
                            {prodInfo ? prodInfo.propertyName : "Não Encontrado"}
                          </td>
                          <td className="p-4">
                            <span className="text-xs bg-stone-100 py-1 px-2.5 rounded-full font-medium">
                              {p.category}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-medium">
                            R$ {p.price.toFixed(2)} / {p.unit}
                          </td>
                          <td className="p-4 text-center">
                            {p.isVisible ? (
                              <span className="text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100 font-medium">Exibindo</span>
                            ) : (
                              <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-medium">Oculto</span>
                            )}
                          </td>
                          <td className="p-4 text-right flex justify-end gap-2">
                            <button
                              onClick={() => handleToggleProductVisibility(p.id)}
                              className="p-1 px-2.5 border border-stone-200 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-600 cursor-pointer"
                            >
                              {p.isVisible ? "Ocultar" : "Exibir"}
                            </button>
                            <button
                              onClick={() => handleRemoveProduct(p.id)}
                              className="p-1.5 border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer"
                              title="Remover definitivamente"
                            >
                              <DynamicIcon name="Trash" className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: GESTÃO DE CATEGORIAS */}
        {activeTab === "categories" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Add form */}
              <div className="md:col-span-1 bg-stone-50 p-6 rounded-2xl border border-stone-150 space-y-4">
                <h4 className="font-display font-semibold text-stone-900">Nova Categoria</h4>
                <p className="text-xs text-stone-500">Crie novas categorias de feira livre que estarão disponíveis para categorizar os produtos.</p>
                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Nome da Categoria</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-stone-200 bg-white rounded-xl text-sm focus:outline-emerald-600"
                      placeholder="Ex: Cogumelos, Doces, Chás..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-2.5 text-white font-semibold text-sm rounded-xl cursor-pointer flex justify-center items-center gap-1 shadow-xs"
                  >
                    <DynamicIcon name="Plus" className="w-4 h-4" /> Adicionar Categoria
                  </button>
                </form>
              </div>

              {/* List grid */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="font-display font-semibold text-stone-900 text-sm">Categorias Registradas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((c) => (
                    <div key={c.id} className="p-4 bg-white rounded-2xl border border-stone-100 flex justify-between items-center hover:shadow-xs transition-shadow">
                      <div>
                        <p className="text-sm font-semibold text-stone-800">{c.name}</p>
                        <p className="text-[10px] text-stone-400 font-mono">slug: {c.slug}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveCategory(c.id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <DynamicIcon name="Trash" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: GESTÃO DE SELOS */}
        {activeTab === "selos" && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Creator form */}
              <div className="lg:col-span-1 bg-stone-50 p-6 rounded-2xl border border-stone-150 space-y-4">
                <h4 className="font-display font-semibold text-stone-900">Customizador de Selos</h4>
                <p className="text-xs text-stone-500">Crie selos de selamento profissional para outorgar aos produtores destaque.</p>
                <form onSubmit={handleAddSelo} className="space-y-4">
                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Título do Selo</label>
                    <input
                      type="text"
                      className="w-full p-2.5 border border-stone-200 bg-white rounded-xl text-sm focus:outline-emerald-600"
                      placeholder="Ex: Orgânico Certificado"
                      value={newSeloName}
                      onChange={(e) => setNewSeloName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Descrição do Selo</label>
                    <textarea
                      rows={2}
                      className="w-full p-2.5 border border-stone-200 bg-white rounded-xl text-sm focus:outline-emerald-600"
                      placeholder="Explicação do selo que vai aparecer ao consumidor"
                      value={newSeloDesc}
                      onChange={(e) => setNewSeloDesc(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-2">Ícone Representativo</label>
                    <div className="grid grid-cols-5 gap-2">
                      {["Leaf", "Sprout", "Award", "Truck", "CheckCircle", "Compass", "Star", "Heart", "Clock", "Activity"].map((ico) => (
                        <button
                          key={ico}
                          type="button"
                          onClick={() => setNewSeloIcon(ico)}
                          className={`p-2 rounded-xl border flex items-center justify-center cursor-pointer transition-all ${
                            newSeloIcon === ico ? "border-emerald-600 bg-emerald-50 text-emerald-800 scale-105" : "border-stone-200 bg-white text-stone-400 hover:text-stone-700"
                          }`}
                        >
                          <DynamicIcon name={ico} className="w-5 h-5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-stone-600 font-medium block mb-1">Visual / Cor</label>
                    <select
                      className="w-full p-2.5 border border-stone-200 bg-white rounded-xl text-sm focus:outline-emerald-600"
                      value={newSeloColor}
                      onChange={(e) => setNewSeloColor(e.target.value)}
                    >
                      <option value="bg-emerald-100 text-emerald-800 border-emerald-300">Emeralda / Verde Orgânico</option>
                      <option value="bg-amber-100 text-amber-800 border-amber-300">Âmbar e Mel / Artesanal</option>
                      <option value="bg-sky-100 text-sky-800 border-sky-300">Sky / Entrega Flexível</option>
                      <option value="bg-teal-100 text-teal-800 border-teal-300">Teal / Sustentável</option>
                      <option value="bg-indigo-100 text-indigo-800 border-indigo-300">Indigo / Distrital Local</option>
                      <option value="bg-red-100 text-red-800 border-red-300">Vermelho / Oferta Especial</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 text-white font-semibold text-sm rounded-xl cursor-pointer shadow-xs"
                  >
                    Salvar Novo Selo
                  </button>
                </form>
              </div>

              {/* Layout view */}
              <div className="lg:col-span-2 space-y-4">
                <h4 className="font-display font-semibold text-stone-900 text-sm">Biblioteca de Selos do Sistema</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selos.map((s) => (
                    <div key={s.id} className="p-4 bg-white rounded-2xl border border-stone-150 hover:shadow-xs transition-shadow flex gap-3.5 items-start">
                      <div className={`p-2.5 rounded-full border ${s.color}`}>
                        <DynamicIcon name={s.icon} className="w-5 h-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-bold text-stone-800">{s.name}</p>
                          <button
                            onClick={() => handleRemoveSelo(s.id)}
                            className="text-stone-300 hover:text-red-600 p-0.5"
                          >
                            <DynamicIcon name="Trash" className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-stone-500 leading-normal">{s.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AVALIAÇÕES */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <div>
                <h3 className="font-display font-semibold text-stone-900 text-base">Controle de Feedbacks (Sem comentários públicos)</h3>
                <p className="text-stone-500 text-xs">Acompanhe a integridade das avaliações de estrelas e aprove/remova notas nocivas.</p>
              </div>
              <span className="text-xs text-stone-500 font-semibold">{reviews.length} notas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => {
                const prod = producers.find(p => p.id === r.producerId);
                return (
                  <div key={r.id} className="p-5 bg-white rounded-2xl border border-stone-150 flex flex-col justify-between shadow-xs">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-bold text-stone-800">{r.userName}</p>
                          <p className="text-[10px] text-stone-400">ID Pedido: {r.orderId}</p>
                        </div>
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${r.isApproved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {r.isApproved ? "Aprovada" : "Ocultada"}
                        </span>
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <DynamicIcon
                            key={star}
                            name="Star"
                            className={`w-4 h-4 ${star <= r.rating ? "text-amber-400 fill-amber-400" : "text-stone-200"}`}
                          />
                        ))}
                      </div>

                      <p className="text-xs text-stone-500">
                        Destinado a: <span className="font-semibold text-emerald-700">{prod ? prod.propertyName : "Produtor Desconhecido"}</span>
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-stone-100 flex justify-end gap-2">
                      <button
                        onClick={() => handleApproveReview(r.id)}
                        className="px-3 py-1 border border-stone-250 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        {r.isApproved ? "Moderar / Ocultar" : "Aprovar"}
                      </button>
                      <button
                        onClick={() => handleRemoveReview(r.id)}
                        className="p-1.5 border border-red-100 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer"
                      >
                        <DynamicIcon name="Trash" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 8: MAPA GEOGRÁFICO DE PRODUTORES */}
        {activeTab === "map" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100">
              <h3 className="font-display font-semibold text-stone-900 text-base">Espacialização Geográfica de Queimados</h3>
              <p className="text-stone-500 text-xs">Mapa dinâmico simulado desenhando propriedades cadastradas com distâncias calculadas a partir da região metropolitana.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Graphic container */}
              <div className="lg:col-span-2 bg-stone-900 rounded-3xl p-6 relative flex flex-col items-center justify-center min-h-[350px] border border-stone-800">
                <div className="absolute top-4 left-4 bg-black/40 text-stone-300 text-[10px] font-mono p-2.5 rounded-xl space-y-1">
                  <p className="text-emerald-400 font-bold">🟢 Queimados Geo-Grid</p>
                  <p>Escala: 1 deg ≈ 111 km</p>
                  <p>Centralizer: -22.71, -43.55</p>
                </div>

                {/* Simulated SVG Map Vector Background */}
                <svg className="w-full max-w-[450px] h-[260px] " viewBox="0 0 400 250">
                  {/* Grid Lines */}
                  <line x1="0" y1="125" x2="400" y2="125" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />
                  <line x1="200" y1="0" x2="200" y2="250" stroke="#334155" strokeWidth="0.5" strokeDasharray="5,5" />

                  {/* Fictional River flow */}
                  <path d="M 0,40 Q 120,50 180,110 T 400,160" fill="none" stroke="#0284c7" strokeWidth="3" strokeOpacity="0.3" />

                  {/* Main Road */}
                  <path d="M 80,0 Q 200,100 280,250" fill="none" stroke="#475569" strokeWidth="4" strokeOpacity="0.4" />

                  {/* City Center Ring */}
                  <circle cx="200" cy="125" r="30" fill="none" stroke="#10b981" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="3,3" />
                  <text x="200" y="112" fill="#10b981" fontSize="8" textAnchor="middle" opacity="0.6" className="font-display font-semibold uppercase tracking-wider">Centro Queimados</text>

                  {/* Plot active addresses from client to map */}
                  {currentUser.addresses.map((addr) => {
                    const coords = getMapCoords(addr.latitude, addr.longitude);
                    return (
                      <g key={addr.id}>
                        <circle cx={coords.x} cy={coords.y} r="6" fill="#0ea5e9" className="animate-pulse" />
                        <circle cx={coords.x} cy={coords.y} r="1.5" fill="white" />
                        <text x={coords.x} y={coords.y - 10} fill="#0ea5e9" fontSize="9" textAnchor="middle" className="font-semibold bg-stone-900 pointer-events-none">
                          {addr.label.substring(0, 4)}
                        </text>
                      </g>
                    );
                  })}

                  {/* Plot Producer Pins */}
                  {producers.filter(p => !p.isSuspended).map((p) => {
                    const coords = getMapCoords(p.latitude, p.longitude);
                    return (
                      <g key={p.id} className="cursor-pointer group">
                        {/* Selector background aura */}
                        <circle cx={coords.x} cy={coords.y} r="14" fill="#22c55e" fillOpacity="0" className="group-hover:fill-opacity-15 transition-all" />
                        <circle cx={coords.x} cy={coords.y} r="7" fill="#15803d" stroke="#fff" strokeWidth="1.5" />
                        <text x={coords.x} y={coords.y - 12} fill="#efeff1" fontSize="8" fontWeight="bold" textAnchor="middle" className="pointer-events-none drop-shadow-md">
                          {p.propertyName.split(" ")[0]}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="flex gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2.5 h-2.5 bg-sky-500 rounded-full inline-block"></span> Endereço Consumidor
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block"></span> Sítio / Produtor
                  </span>
                </div>
              </div>

              {/* Sidebar Info cards */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold text-stone-900 text-sm">Distâncias Relativas (Cidade Centro)</h4>
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {producers.map((p) => {
                    // Compute distance from first address (Casa) for demo visualization
                    const userLat = currentUser.addresses?.[0]?.latitude ?? -22.9068;
                    const userLong = currentUser.addresses?.[0]?.longitude ?? -43.1729;
                    const distHome = calculateDistance(
                      userLat,
                      userLong,
                      p.latitude,
                      p.longitude
                    );
                    return (
                      <div key={p.id} className="p-3 bg-white rounded-xl border border-stone-150 flex justify-between items-center hover:bg-stone-50">
                        <div>
                          <p className="text-xs font-bold text-stone-800">{p.propertyName}</p>
                          <p className="text-[10px] text-stone-500 truncate max-w-[150px]">{p.address}</p>
                        </div>
                        <span className="text-xs bg-emerald-50 text-emerald-800 font-mono px-2 py-1 rounded font-bold border border-emerald-100">
                          {distHome} Km
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
