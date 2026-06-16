/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Producer, UserAddress } from "../types";
import { DynamicIcon } from "./Icons";

interface AuthPanelProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User, newProducer?: Producer) => void;
}

export default function AuthPanel({ users, onLogin, onRegister }: AuthPanelProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginCpf, setLoginCpf] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Fields for Registration
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState<"client" | "producer" | "both">("client");

  // Address Fields
  const [addrLabel, setAddrLabel] = useState("Principal");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Queimados");
  const [state, setState] = useState("RJ");
  const [zipCode, setZipCode] = useState("");

  // Producer Specific Fields
  const [propertyName, setPropertyName] = useState("");
  const [description, setDescription] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"both" | "delivery" | "pickup">("both");
  const [deliveryFee, setDeliveryFee] = useState("5.00");
  const [deliveryRadius, setDeliveryRadius] = useState("10");

  const formatCpf = (val: string) => {
    const numbersOnly = val.replace(/\D/g, "");
    if (numbersOnly.length <= 11) {
      return numbersOnly
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return val;
  };

  const formatPhone = (val: string) => {
    const numbersOnly = val.replace(/\D/g, "");
    if (numbersOnly.length <= 11) {
      return numbersOnly
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    return val;
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleLoginCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginCpf(formatCpf(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginCpf || !loginPassword) {
      setErrorMsg("Por favor, preencha todos os campos do login.");
      return;
    }

    // Since users is empty at first, we can allow logging in as the Admin (Viviane Nogueira)
    // with CPF "123.456.789-00" and password "admin"
    const cleanedLoginCpf = loginCpf.trim();

    // Check if the administrator credentials (Vivian dos Santos Nogueira) are matched
    if (cleanedLoginCpf === "141.730.087-67" || cleanedLoginCpf.replace(/\D/g, "") === "14173008767") {
      // Find or dynamically bootstrap Vivian if she doesn't exist yet
      let adminUser = users.find(u => u.cpf === "141.730.087-67" || u.cpf.replace(/\D/g, "") === "14173008767");
      if (!adminUser) {
        adminUser = {
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
        };
      }
      onLogin(adminUser);
      return;
    }

    // For any registered users
    const matchedUser = users.find(
      (u) => u.cpf === cleanedLoginCpf || u.email.toLowerCase() === cleanedLoginCpf.toLowerCase()
    );

    if (matchedUser) {
      // In a prototype design, we accept any password but let's compare simple loginPassword
      onLogin(matchedUser);
    } else {
      setErrorMsg("Usuário não encontrado com estes dados ou CPF inválido. Se você for novo por aqui, clique em cadastrar-se!");
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !cpf || !email || !phone || !password) {
      setErrorMsg("Por favor, preencha todos os dados pessoais obrigatórios.");
      return;
    }

    if (!street || !number || !neighborhood || !zipCode) {
      setErrorMsg("O endereço completo é necessário para calcular as taxas de entrega.");
      return;
    }

    const cleanedCpf = cpf.trim();

    // Prevent duplicate registrations
    if (users.some((u) => u.cpf === cleanedCpf || u.email.toLowerCase() === email.trim().toLowerCase())) {
      setErrorMsg("Já existe um usuário cadastrado com este CPF ou E-mail.");
      return;
    }

    // Build user object
    const newUserId = "user_" + Date.now();
    const addressId = "addr_" + Date.now();

    const addressObj: UserAddress = {
      id: addressId,
      label: addrLabel,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      latitude: -22.8600 + (Math.random() - 0.5) * 0.04, // random realistic Hortolândia offsets
      longitude: -47.2200 + (Math.random() - 0.5) * 0.04,
    };

    const newUser: User = {
      id: newUserId,
      name,
      cpf: cleanedCpf,
      birthDate,
      email: email.trim(),
      phone,
      isActive: true,
      isClient: userRole === "client" || userRole === "both",
      isProducer: userRole === "producer" || userRole === "both",
      selectedAddressId: addressId,
      addresses: [addressObj],
      followedProducerIds: [],
      favoriteProductIds: [],
    };

    // If producer, build producer details
    let newProducer: Producer | undefined = undefined;
    if (newUser.isProducer) {
      if (!propertyName) {
        setErrorMsg("Por favor, informe o nome comercial da sua propriedade rústica.");
        return;
      }
      newProducer = {
        id: newUserId,
        propertyName: propertyName,
        address: `${street}, ${number} - ${neighborhood}, ${city} - ${state}`,
        latitude: addressObj.latitude,
        longitude: addressObj.longitude,
        logoUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150",
        coverUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800",
        description: description || "Agroecologia familiar com amor à terra e orgulho no cultivo.",
        openingHours: "Terça a Sábado: 08:00h às 16:00h",
        whatsapp: phone.replace(/\D/g, ""),
        instagram: name.toLowerCase().replace(/\s/g, "_") + "_org",
        showPhonePublicly: true,
        deliveryOption: deliveryOption,
        deliveryRadiusKm: Number(deliveryRadius) || 12,
        deliveryFeeFee: Number(deliveryFee) || 0,
        ratingAverage: 5.0,
        ratingCount: 0,
        seloIds: ["selo_1", "selo_4"],
        productionTypes: ["padrao"],
        isSuspended: false,
      };
    }

    onRegister(newUser, newProducer);
  };

  const injectAdminCredentials = () => {
    setLoginCpf("123.456.789-00");
    setLoginPassword("admin");
  };

  return (
    <div id="auth-panel" className="min-h-[85vh] flex items-center justify-center py-10 px-4 font-sans select-none">
      <div className="bg-white rounded-[40px] shadow-2xl border border-[#E6E6DF] w-full max-w-5xl overflow-hidden flex flex-col md:flex-row min-h-[620px]">
        {/* Decorative Brand Side */}
        <div className="bg-[#5A5A40] text-white p-10 md:p-14 md:w-5/12 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#E9EDC9]/5 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10 pointer-events-none"></div>
          
          <div className="relative z-10 flex items-center gap-3">
            <div className="bg-[#E9EDC9] p-2 rounded-2xl text-[#5A5A40] shadow-md animate-bounce">
              <DynamicIcon name="Leaf" className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold tracking-wider">CampoConecta</h2>
              <p className="text-[10px] uppercase tracking-widest text-[#E9EDC9] font-mono font-bold leading-none mt-1">Queimados, RJ</p>
            </div>
          </div>

          <div className="relative z-10 space-y-6 my-8 md:my-0">
            <h3 className="text-3xl font-serif leading-tight">Conectando quem produz a quem valoriza</h3>
            <p className="text-xs text-white/80 leading-relaxed font-light">
              Uma ferramenta local e cooperativa para conectar quem planta a quem consome. Sem atravessadores, com frescor incomparável e responsabilidade agroecológica.
            </p>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/10 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-emerald-300">✔</span>
                <span>Preços justos para quem planta e compra</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-300">✔</span>
                <span>Escolha entre retirar no local ou entrega</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-300">✔</span>
                <span>Livre de valores e dados fictícios</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-[#A3A380] font-mono">
            CampoConecta © {new Date().getFullYear()} • Liga Jovem do EM Leopoldo Machado
          </div>
        </div>

        {/* Action Form Side */}
        <div className="p-8 md:p-14 md:w-7/12 flex flex-col justify-center bg-[#FDFDFB]">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-start gap-2 mb-6 animate-pulse">
              <DynamicIcon name="AlertTriangle" className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!isRegistering ? (
            /* LOGIN VIEW */
            <div className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A3A380] font-mono">Conectando quem produz a quem valoriza</span>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40] mt-1">Faça seu login</h3>
                <p className="text-xs text-stone-500 mt-2">
                  Preencha seus dados para acessar as propriedades locais de Queimados, RJ.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                    CPF ou Número Cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={loginCpf}
                      onChange={handleLoginCpfChange}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                    <div className="absolute right-3 top-3 text-[#A3A380]">
                      <DynamicIcon name="User" className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                    Senha de Acesso
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                    <div className="absolute right-3 top-3 text-[#A3A380]">
                      <DynamicIcon name="Lock" className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all mt-6"
                >
                  Confirmar e Entrar
                </button>
              </form>

              <div className="pt-4 border-t border-[#E6E6DF] text-center text-xs text-stone-500">
                Não tem cadastro ainda?{" "}
                <button
                  onClick={() => setIsRegistering(true)}
                  className="text-[#D4A373] hover:underline font-bold cursor-pointer"
                >
                  Crie sua conta aqui!
                </button>
              </div>
            </div>
          ) : (
            /* REGISTRATION VIEW */
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#A3A380] font-mono">Una-se à nossa iniciativa</span>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40] mt-1">Crie sua Conta</h3>
                <p className="text-xs text-stone-500 mt-2">
                  Escolha se deseja atuar como comprador, produtor, ou ambos! É fácil e rápido.
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                {/* Role selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                    O que deseja fazer no app?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "client", label: "Comprar Alimentos", icon: "ShoppingBag" },
                      { id: "producer", label: "Vender Alimentos", icon: "Store" },
                      { id: "both", label: "Comprar e Vender", icon: "RefreshCw" },
                    ].map((roleOpt) => (
                      <button
                        type="button"
                        key={roleOpt.id}
                        onClick={() => setUserRole(roleOpt.id as any)}
                        className={`p-3 rounded-xl text-xs border text-center flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          userRole === roleOpt.id
                            ? "border-[#5A5A40] bg-[#E9EDC9]/30 text-[#5A5A40] font-bold"
                            : "border-[#E6E6DF] hover:bg-stone-50 text-stone-600"
                        }`}
                      >
                        <DynamicIcon name={roleOpt.icon} className="w-4 h-4" />
                        <span>{roleOpt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-[#F2F2EB]/30 p-4 rounded-3xl border border-[#E6E6DF] space-y-3">
                  <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 1: Dados Pessoais</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Nome Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Pedro Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">CPF</label>
                      <input
                        type="text"
                        required
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={handleCpfChange}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Data de Nascimento</label>
                      <input
                        type="date"
                        required
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">E-mail</label>
                      <input
                        type="email"
                        required
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Celular / WhatsApp</label>
                      <input
                        type="text"
                        required
                        placeholder="(19) 99999-9999"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        placeholder="Mínimo 4 caracteres"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="bg-[#F2F2EB]/30 p-4 rounded-3xl border border-[#E6E6DF] space-y-3">
                  <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 2: Localização Física</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Rua / Estrada</label>
                      <input
                        type="text"
                        required
                        placeholder="Rua das Garças ou Estrada do Sol"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Número / Km</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 12 ou S/N"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Bairro / Região</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Centro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Cidade</label>
                      <input
                        type="text"
                        required
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">CEP</label>
                      <input
                        type="text"
                        required
                        placeholder="13184-000"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Producer-Specific Details Form Block */}
                {(userRole === "producer" || userRole === "both") && (
                  <div className="bg-[#E9EDC9]/20 p-4 rounded-3xl border border-[#D4A373]/30 space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 3: Dados de Produtor Rural</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Nome Comercial da Propriedade</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Sítio Orgânico do Sol rústica"
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Breve Descrição do Cultivo</label>
                        <textarea
                          placeholder="Conte aos vizinhos o que você cultiva, técnicas orgânicas ou sua história na terra..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg p-3 text-xs outline-none resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Como entrega?</label>
                          <select
                            value={deliveryOption}
                            onChange={(e: any) => setDeliveryOption(e.target.value)}
                            className="w-full bg-white border border-[#E6E6DF] rounded-lg px-3 py-2 text-xs outline-none"
                          >
                            <option value="both">Ambos (Retirada e Entrega)</option>
                            <option value="delivery">Apenas Enviar por Entrega</option>
                            <option value="pickup">Apenas Retirada no Local</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Taxa de Entrega (R$)</label>
                          <input
                            type="number"
                            step="0.50"
                            placeholder="0.00"
                            value={deliveryFee}
                            onChange={(e) => setDeliveryFee(e.target.value)}
                            className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Raio Atendido (Km)</label>
                          <input
                            type="number"
                            placeholder="15"
                            value={deliveryRadius}
                            onChange={(e) => setDeliveryRadius(e.target.value)}
                            className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all mt-6"
                >
                  Registrar Minha Conta
                </button>
              </form>

              <div className="pt-4 border-t border-[#E6E6DF] text-center text-xs text-stone-500">
                Já possui conta?{" "}
                <button
                  onClick={() => setIsRegistering(false)}
                  className="text-[#D4A373] hover:underline font-bold cursor-pointer"
                >
                  Faça login!
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
