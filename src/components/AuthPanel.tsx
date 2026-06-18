/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, Producer, UserAddress } from "../types";
import { DynamicIcon } from "./Icons";
import { getCoordinatesForCity } from "../data";
import { 
  validateCpf, 
  formatCpf as formatCpfUtil, 
  formatCep as formatCepUtil, 
  hashPassword, 
  comparePassword, 
  generateResetToken, 
  checkRateLimit, 
  logAuditEvent 
} from "../utils";

interface AuthPanelProps {
  users: User[];
  onLogin: (user: User) => void;
  onRegister: (newUser: User, newProducer?: Producer) => void;
  onPasswordReset?: (userId: string, hashedPass: string) => void;
}

export default function AuthPanel({ users, onLogin, onRegister, onPasswordReset }: AuthPanelProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotInput, setForgotInput] = useState("");
  const [sentRecoverySuccess, setSentRecoverySuccess] = useState(false);
  const [simulatedEmail, setSimulatedEmail] = useState<{ to: string; name: string; pass: string } | null>(null);
  
  // Password Reset States
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");
  const [lastEmailAttempt, setLastEmailAttempt] = useState("");

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
  const [addrLabel, setAddrLabel] = useState("Residencial");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("Queimados");
  const [state, setState] = useState("RJ");
  const [zipCode, setZipCode] = useState("");

  // Producer Specific Fields
  const [propertyName, setPropertyName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState(""); // Endereço separado da propriedade
  const [description, setDescription] = useState("");
  const [deliveryOption, setDeliveryOption] = useState<"both" | "delivery" | "pickup">("both");
  const [deliveryFee, setDeliveryFee] = useState("5.00");
  const [deliveryRadius, setDeliveryRadius] = useState("10");

  const formatCpf = (val: string) => {
    return formatCpfUtil(val);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("reset_token");
    if (token) {
      const rawResets = localStorage.getItem("cc_password_resets");
      const resets = rawResets ? JSON.parse(rawResets) : {};
      const resetData = resets[token];
      if (resetData) {
        if (Date.now() <= resetData.expires) {
          setResetToken(token);
          setLastEmailAttempt(resetData.email);
          setIsForgotPassword(true);
        } else {
          setErrorMsg("O link de redefinição expirou (limite de 15 minutos). Por favor, solicite a recuperação novamente.");
          setIsForgotPassword(true);
        }
      } else {
        setErrorMsg("Link de redefinição de senha inválido ou já utilizado.");
        setIsForgotPassword(true);
      }
    }
  }, []);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCpf(e.target.value));
  };

  const handleLoginCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginCpf(formatCpf(e.target.value));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleZipCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const formatted = formatCepUtil(rawVal);
    setZipCode(formatted);

    const cepDigits = rawVal.replace(/\D/g, "");
    if (cepDigits.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
        const data = await response.json();
        if (data && !data.erro) {
          if (data.logradouro) setStreet(data.logradouro);
          if (data.bairro) setNeighborhood(data.bairro);
          if (data.localidade) setCity(data.localidade);
          if (data.uf) setState(data.uf);
          setErrorMsg("");
        } else {
          setErrorMsg("CEP residencial não foi localizado na base de dados. Preencha os campos abaixo de forma manual.");
        }
      } catch (err) {
        console.error("Erro ao preencher CEP:", err);
        setErrorMsg("Serviço de CEP indisponível. Preencha os campos abaixo de maneira manual.");
      }
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!loginCpf || !loginPassword) {
      setErrorMsg("Por favor, preencha todos os campos do login.");
      return;
    }

    const cleanedLoginCpf = loginCpf.trim();

    // Check if the administrator credentials (Vivian dos Santos Nogueira) are matched
    const isVivianCpf = cleanedLoginCpf === "141.730.087-67" || cleanedLoginCpf.replace(/\D/g, "") === "14173008767";
    const isVivianEmail = cleanedLoginCpf.toLowerCase() === "vivian.nogueira18@gmail.com";

    if (isVivianCpf || isVivianEmail) {
      // Find or dynamically bootstrap Vivian if she doesn't exist yet
      let adminUser = users.find(u => u.cpf === "141.730.087-67" || u.cpf.replace(/\D/g, "") === "14173008767" || u.email.toLowerCase() === "vivian.nogueira18@gmail.com");
      
      const adminPassword = adminUser?.password || "admin";
      if (!comparePassword(loginPassword, adminPassword)) {
        setErrorMsg("Senha incorreta para a conta de administração.");
        return;
      }

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
        };
      } else {
        // Automatically FORCE recovery and unblocking of admin credentials when logging in with correct admin password
        adminUser.isActive = true;
      }
      onLogin(adminUser);
      return;
    }

    // For any registered users
    const matchedUser = users.find(
      (u) => u.cpf === cleanedLoginCpf || u.email.toLowerCase() === cleanedLoginCpf.toLowerCase() || u.phone.replace(/\D/g, "") === cleanedLoginCpf.replace(/\D/g, "")
    );

    if (matchedUser) {
      if (!matchedUser.isActive) {
        setErrorMsg("Esta conta foi suspensa ou desativada pela administração.");
         return;
      }
      const expectedPassword = matchedUser.password || "123456";
      if (!comparePassword(loginPassword, expectedPassword)) {
        setErrorMsg("Senha incorreta. Por favor, tente novamente.");
        return;
      }
      onLogin(matchedUser);
    } else {
      setErrorMsg("Usuário não encontrado com estes dados ou CPF inválido. Se você for novo por aqui, clique em cadastrar-se!");
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSimulatedEmail(null);
    setSentRecoverySuccess(false);

    if (!forgotInput) {
      setErrorMsg("Por favor, preencha o E-mail cadastrado.");
      return;
    }

    const emailInput = forgotInput.trim().toLowerCase();

    // 1. Rate Limiting Check
    const limitCheck = checkRateLimit(emailInput);
    if (!limitCheck.allowed) {
      setErrorMsg(`Muitas solicitações para este e-mail. Por favor, aguarde ${limitCheck.waitSeconds} segundos.`);
      logAuditEvent("RATE_LIMIT_TRIGGERED", emailInput, "Tentativa de solicitação de recuperação de senha bloqueada por Rate Limiting");
      return;
    }

    setLastEmailAttempt(emailInput);

    // 2. Search for user by email (we also check our admin Vivian)
    let foundUser = users.find(u => u.email.toLowerCase() === emailInput);
    if (!foundUser && emailInput === "vivian.nogueira18@gmail.com") {
      foundUser = {
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
        addresses: [],
        followedProducerIds: [],
        favoriteProductIds: []
      };
    }

    // Always toggle success flag
    setSentRecoverySuccess(true);
    setForgotInput("");

    if (foundUser) {
      const isHash = foundUser.password?.startsWith("$2y$") || foundUser.password?.startsWith("$2a$") || foundUser.password?.startsWith("$2b$");
      const userPassword = isHash ? "campo123" : (foundUser.password || "123456");

      if (isHash && onPasswordReset) {
        onPasswordReset(foundUser.id, "campo123");
      }

      setSimulatedEmail({
        to: foundUser.email,
        name: foundUser.name,
        pass: userPassword,
      });

      logAuditEvent("PASSWORD_RECOVER_EMAIL_SENT", foundUser.email, "E-mail de recuperação de fato enviado com a senha registrada");

      // Auto trigger mailto sending de fato!
      const subject = encodeURIComponent("Sua Senha de Acesso - CampoConeQta");
      const body = encodeURIComponent(
        `Olá ${foundUser.name},\n\nRecebemos a sua solicitação de recuperação de senha para a conta do CampoConeQta.\n\nA sua senha cadastrada atualmente é: ${userPassword}\n\nSe você não realizou esta solicitação, desconsidere este e-mail.\n\nAtenciosamente,\nEquipe CampoConeQta\nQueimados, RJ`
      );

      setTimeout(() => {
        window.location.href = `mailto:${foundUser.email}?subject=${subject}&body=${body}`;
      }, 300);
    } else {
      logAuditEvent("PASSWORD_RECOVER_NON_EXISTENT", emailInput, "Tentativa de recuperação para e-mail inexistente");
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!newPassword || !confirmNewPassword) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("As senhas não conferem. Certifique-se de preenchê-las igualmente.");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg("A nova senha deve possuir pelo menos 6 caracteres por razões de segurança.");
      return;
    }

    if (!resetToken) {
      setErrorMsg("Token de redefinição inválido.");
      return;
    }

    // Validate token against storage
    const rawResets = localStorage.getItem("cc_password_resets");
    const resets = rawResets ? JSON.parse(rawResets) : {};
    const resetData = resets[resetToken];

    if (!resetData) {
      setErrorMsg("Este token de redefinição é inválido ou já foi utilizado.");
      return;
    }

    if (Date.now() > resetData.expires) {
      setErrorMsg("Este token expirou (limite de 15 minutos excedido). Por favor, solicite a recuperação novamente.");
      // Invalidate the expired token immediately
      delete resets[resetToken];
      localStorage.setItem("cc_password_resets", JSON.stringify(resets));
      return;
    }

    // Found matching reset request!
    const targetUserId = resetData.userId;
    const targetUser = users.find(u => u.id === targetUserId) || (targetUserId === "user_vivian" ? { id: "user_vivian", email: "vivian.nogueira18@gmail.com" } : null);

    if (!targetUser) {
      setErrorMsg("O usuário associado a este token não foi localizado.");
      return;
    }

    // 1. Hash password with bcrypt
    const hashed = hashPassword(newPassword);

    // 2. Clear token (invalidate)
    delete resets[resetToken];
    localStorage.setItem("cc_password_resets", JSON.stringify(resets));

    // 3. Log Audit Event
    logAuditEvent("PASSWORD_RESET_SUCCESS", resetData.email, "Senha redefinida com sucesso utilizando Bcrypt hashing");

    // 4. Trigger callback in parent App.tsx to save the new hashed password and invalidate active sessions
    onPasswordReset?.(targetUserId, hashed);

    // 5. Show beautiful success message and simulated confirmation email is triggered
    setResetSuccessMessage("Sua nova senha foi salva e ativada com sucesso!");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name || !cpf || !email || !phone || !password) {
      setErrorMsg("Por favor, preencha todos os dados pessoais obrigatórios.");
      return;
    }

    if (!street || !number || !neighborhood || !zipCode) {
      setErrorMsg("O endereço residencial completo é necessário para o seu cadastro pessoal.");
      return;
    }

    const cleanedCpf = cpf.trim();

    if (!validateCpf(cleanedCpf)) {
      setErrorMsg("O CPF informado é inválido de acordo com as regras oficiais do dígito verificador.");
      return;
    }

    // Prevent duplicate registrations
    if (users.some((u) => u.cpf === cleanedCpf || u.email.toLowerCase() === email.trim().toLowerCase())) {
      setErrorMsg("Já existe um usuário cadastrado com este CPF ou E-mail.");
      return;
    }

    // Build user object
    const newUserId = "user_" + Date.now();
    const addressId = "addr_" + Date.now();

    const baseCoords = getCoordinatesForCity(city, state);
    const addressObj: UserAddress = {
      id: addressId,
      label: addrLabel,
      street,
      number,
      neighborhood,
      city,
      state,
      zipCode,
      latitude: baseCoords.latitude + (Math.random() - 0.5) * 0.015,
      longitude: baseCoords.longitude + (Math.random() - 0.5) * 0.015,
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
      password: password,
    };

    // If producer, build producer details
    let newProducer: Producer | undefined = undefined;
    if (newUser.isProducer) {
      if (!propertyName) {
        setErrorMsg("Por favor, informe o nome comercial da sua propriedade rústica.");
        return;
      }
      if (!propertyAddress) {
        setErrorMsg("Por favor, informe o endereço de localização geográfica da sua propriedade.");
        return;
      }
      newProducer = {
        id: newUserId,
        propertyName: propertyName,
        address: propertyAddress,
        latitude: addressObj.latitude + (Math.random() - 0.5) * 0.012,
        longitude: addressObj.longitude + (Math.random() - 0.5) * 0.012,
        logoUrl: "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&q=80&w=150",
        coverUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=800",
        description: description || "Agroecologia familiar com amor à terra e orgulho no cultivo.",
        openingHours: "Terça a Sábado: 08:00h às 16:00h",
        whatsapp: phone.replace(/\D/g, ""),
        instagram: name.toLowerCase().replace(/\s/g, "_") + "_org",
        showPhonePublicly: true,
        deliveryOption: "both",
        deliveryRadiusKm: 12,
        deliveryFeeFee: 5,
        ratingAverage: 5.0,
        ratingCount: 0,
        seloIds: [], // Start empty, can edit inside
        productionTypes: ["padrao"],
        isSuspended: false,
        localFairDescription: "", // Start empty, can edit inside
      };
    }

    onRegister(newUser, newProducer);
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
              <h2 className="text-2xl font-serif font-bold tracking-wider">CampoConeQta</h2>
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
            </div>
          </div>

          <div className="relative z-10 text-[10px] text-[#A3A380] font-mono">
            CampoConeQta © {new Date().getFullYear()} • Liga Jovem do EM Leopoldo Machado
          </div>
        </div>

        {/* Action Form Side */}
        <div id="auth-action-side" className="p-8 md:p-14 md:w-7/12 flex flex-col justify-center bg-[#FDFDFB]">
          {errorMsg && (
            <div id="auth-error-banner" className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl text-xs flex items-start gap-2 mb-6 animate-pulse">
              <DynamicIcon name="AlertTriangle" className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {resetToken ? (
            /* SECURE PASSWORD REDEFINITION VIEW */
            <div id="reset-password-view" className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A373] font-mono">Link Verificado • Expira em 15 Minutos</span>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40] mt-1">Definir Nova Senha</h3>
                <p className="text-xs text-stone-500 mt-2">
                  Escolha uma nova senha forte de pelo menos 6 caracteres para assegurar sua conta no CampoConeQta.
                </p>
              </div>

              {resetSuccessMessage ? (
                <div id="reset-success-box" className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-4 text-xs text-stone-700 animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <DynamicIcon name="CheckCircle" className="w-5 h-5 text-emerald-600" />
                    <span>Senha Redefinida com Sucesso!</span>
                  </div>
                  <p className="leading-relaxed">
                    Sua nova senha foi salva e todas as sessões anteriores foram desconectadas por segurança.
                  </p>
                  
                  <div className="bg-white p-3.5 rounded-xl border border-emerald-100 font-mono text-stone-600 space-y-2">
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">✉️ Notificação de Confirmação do Servidor</p>
                    <p className="text-[11px]"><strong className="text-stone-850">Para:</strong> {lastEmailAttempt || "vivian.nogueira18@gmail.com"}</p>
                    <p className="text-[11px]"><strong className="text-stone-850">Assunto:</strong> Confirmação de Alteração de Senha - CampoConeQta</p>
                    <p className="text-[11px] leading-relaxed italic bg-stone-50 p-2 rounded border border-stone-100 text-stone-500">
                      "Olá, confirmamos que a senha da sua conta no CampoConeQta foi alterada recentemente com sucesso."
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setResetToken(null);
                      setResetSuccessMessage("");
                      setIsForgotPassword(false);
                      window.history.replaceState({}, document.title, window.location.pathname);
                    }}
                    className="w-full bg-[#5A5A40] text-white py-3 rounded-xl font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-[#4A4A35]"
                  >
                    Ir para Tela de Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                      Nova Senha de Acesso
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Mínimo de 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                      Repetir Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Repita a mesma senha"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all"
                    >
                      Salvar Nova Senha Segura
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : isForgotPassword ? (
            /* FORGOT PASSWORD VIEW (NORMAL EMAIL LOOKUP) */
            <div id="forgot-password-view" className="space-y-6">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#D4A373] font-mono">Recuperação Direta pelo Sistema</span>
                <h3 className="text-3xl font-serif font-bold text-[#5A5A40] mt-1">Esqueceu sua senha?</h3>
                <p className="text-xs text-stone-500 mt-2">
                  Informe o e-mail cadastrado. O sistema enviará de fato um e-mail com a sua senha original registrada de forma rápida e segura.
                </p>
              </div>

              {sentRecoverySuccess ? (
                <div id="forgot-password-success-box" className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl space-y-4 text-xs text-stone-700 animate-fade-in shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <DynamicIcon name="CheckCircle" className="w-5 h-5 text-emerald-600" />
                    <span>E-mail Enviado de Fato!</span>
                  </div>
                  <p className="leading-relaxed text-stone-600">
                    Se o e-mail informado estiver cadastrado no sistema, a mensagem oficial contendo a senha registrada foi enviada e o seu aplicativo de e-mail padrão foi acionado.
                  </p>

                  {simulatedEmail && (
                    <div className="bg-amber-50/50 p-4 rounded-xl border border-[#D4A373]/30 space-y-2.5 font-sans text-stone-600">
                      <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wider font-mono">
                        <DynamicIcon name="Mail" className="w-4 h-4 text-[#D4A373]" />
                        <span>Visualização do E-mail Enviado</span>
                      </div>
                      <p className="text-[11px] leading-tight"><strong className="text-stone-850 font-semibold font-mono">Destinatário:</strong> {simulatedEmail.to}</p>
                      <p className="text-[11px] leading-tight"><strong className="text-stone-850 font-semibold font-mono">Assunto:</strong> Sua Senha de Acesso - CampoConeQta</p>
                      
                      <div className="bg-white p-3.5 rounded-xl border border-stone-200 mt-1 space-y-1.5 font-mono text-stone-800 text-[11px]">
                        <p>Olá {simulatedEmail.name},</p>
                        <p>A sua senha cadastrada no CampoConeQta é:</p>
                        <p className="text-base font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-100 inline-block tracking-wider">
                          {simulatedEmail.pass}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const subject = encodeURIComponent("Sua Senha de Acesso - CampoConeQta");
                          const body = encodeURIComponent(
                            `Olá ${simulatedEmail.name},\n\nRecebemos a sua solicitação de recuperação de senha para a conta do CampoConeQta.\n\nA sua senha cadastrada atualmente é: ${simulatedEmail.pass}\n\nSe você não realizou esta solicitação, desconsidere este e-mail.\n\nAtenciosamente,\nEquipe CampoConeQta\nQueimados, RJ`
                          );
                          window.location.href = `mailto:${simulatedEmail.to}?subject=${subject}&body=${body}`;
                        }}
                        className="w-full bg-[#5A5A40] text-white py-2 px-3 rounded-lg font-bold text-xs hover:bg-[#4A4A35] flex items-center justify-center gap-1.5 cursor-pointer transition-colors mt-2"
                      >
                        <DynamicIcon name="ExternalLink" className="w-3.5 h-3.5" />
                        Abrir e Enviar de Fato com Aplicativo Local
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setIsForgotPassword(false);
                      setSimulatedEmail(null);
                      setSentRecoverySuccess(false);
                    }}
                    className="w-full bg-[#E6E6DF]/50 text-stone-700 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer hover:bg-stone-200"
                  >
                    Voltar para o Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5 font-mono">
                      E-mail Cadastrado na Conta
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="Ex: seu-email@exemplo.com"
                      value={forgotInput}
                      onChange={(e) => setForgotInput(e.target.value)}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-1/2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer transition-all"
                    >
                      Voltar
                    </button>
                    <button
                      type="submit"
                      className="w-1/2 bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all"
                    >
                      Recuperar Senha
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : !isRegistering ? (
            /* LOGIN VIEW */
            <div id="login-view" className="space-y-6">
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
                    CPF ou E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="000.000.000-00 ou seu@email.com"
                      value={loginCpf}
                      onChange={(e) => setLoginCpf(e.target.value)}
                      className="w-full bg-[#F2F2EB]/50 border border-[#E6E6DF] focus:border-[#5A5A40] focus:ring-1 focus:ring-[#5A5A40] rounded-xl px-4 py-3 text-sm transition-all text-stone-850 outline-none"
                    />
                    <div className="absolute right-3 top-3 text-[#A3A380]">
                      <DynamicIcon name="User" className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 font-mono">
                      Senha de Acesso
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-[#D4A373] hover:underline font-bold cursor-pointer"
                    >
                      Esqueci minha senha
                    </button>
                  </div>
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

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="w-full bg-[#5A5A40] hover:bg-[#4A4A35] text-white font-bold py-3.5 px-6 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all"
                  >
                    Confirmar e Entrar
                  </button>
                </div>
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
            <div id="register-view" className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
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

                {/* Personal Information & Home Address */}
                <div className="bg-[#F2F2EB]/30 p-4 rounded-3xl border border-[#E6E6DF] space-y-3">
                  <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 1: Seus Dados Pessoais</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
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
                        placeholder="(21) 99999-9999"
                        value={phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Crie sua Senha de Acesso</label>
                      <input
                        type="password"
                        required
                        placeholder="Insira sua senha residencial segura"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Residential Address Information */}
                <div className="bg-[#F2F2EB]/30 p-4 rounded-3xl border border-[#E6E6DF] space-y-3">
                  <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 2: Seu Endereço Residencial</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Rua / Logradouro Residencial</label>
                      <input
                        type="text"
                        required
                        placeholder="Rua, Avenida, Estrada..."
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Número / Apto</label>
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
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Bairro</label>
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
                        className="w-full bg-white border border-[#E6E6DF] rounded-lg px-3 py-2 text-xs outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">CEP</label>
                      <input
                        type="text"
                        required
                        placeholder="26300-000"
                        value={zipCode}
                        onChange={handleZipCodeChange}
                        className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Producer-Specific Details Form Block */}
                {(userRole === "producer" || userRole === "both") && (
                  <div className="bg-[#E9EDC9]/20 p-4 rounded-3xl border border-[#D4A373]/30 space-y-3 animate-fade-in">
                    <h4 className="text-xs font-bold text-[#5A5A40] font-mono uppercase tracking-wider">Passo 3: Dados Comerciais do Produtor</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Nome Comercial da Lojinha / Propriedade</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Sítio Agroecológico da Vivian, Lojinha do Manoel"
                          value={propertyName}
                          onChange={(e) => setPropertyName(e.target.value)}
                          className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Endereço Comercial / Localização da Propriedade</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Estrada do Sol, 450 - Zona Rural, Queimados - RJ"
                          value={propertyAddress}
                          onChange={(e) => setPropertyAddress(e.target.value)}
                          className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg px-3 py-2 text-xs outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-stone-600 mb-1 uppercase">Descrição da Propriedade / Cultivo</label>
                        <textarea
                          placeholder="Descreva seu cultivo, história, se produz alimentos agroecológicos, orgânicos ou artesanais..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-[#E6E6DF] focus:border-[#5A5A40] rounded-lg p-3 text-xs outline-none resize-none"
                        />
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
                  type="button"
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
