// URLs das APIs no Render
const API_URL = "https://casamento-backend-w0y5.onrender.com/api/presentes";
const MENSAGENS_API = "https://casamento-backend-w0y5.onrender.com/api/mensagens";

// Variável para guardar o ID do presente selecionado no modal
let presenteSelecionadoId = null;

// Inicializa quando o documento estiver pronto
document.addEventListener("DOMContentLoaded", () => {
  carregarPresentes();
  carregarRecados();
});

/* ==========================================================
   1. LÓGICA DA LISTA DE PRESENTES (presentes.html)
   ========================================================== */

// Busca os presentes no backend
async function carregarPresentes() {
  const container = document.getElementById("grid-presentes");
  if (!container) return; // Se não estiver na página de presentes, ignora

  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar presentes");
    const presentes = await response.json();
    renderizarPresentes(presentes);
  } catch (error) {
    console.error("Erro ao carregar presentes:", error);
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <p class="font-serif italic text-lg text-rose-800">Não foi possível carregar a lista de presentes no momento.</p>
        <p class="text-xs uppercase tracking-widest mt-2 text-slate-400">Tente recarregar a página em alguns instantes.</p>
      </div>
    `;
  }
}

// Renderiza os cartões dos presentes
function renderizarPresentes(presentes) {
  const container = document.getElementById("grid-presentes");
  if (!container) return;
  container.innerHTML = "";

  if (presentes.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <p class="font-serif italic text-lg">A lista de presentes está a ser montada pelos noivos.</p>
      </div>
    `;
    return;
  }

  presentes.forEach((p) => {
    const isDisponivel = p.status === "DISPONIVEL";
    const valorFormatado = Number(p.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    const card = document.createElement("div");
    card.className =
      "bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition duration-300 border border-[#cbe4fa] flex flex-col";

    card.innerHTML = `
      <div class="relative h-48 overflow-hidden bg-[#eaf3fb]">
        <img src="${p.imagemUrl || 'casal.png'}" alt="${p.nome}" class="w-full h-full object-cover transition duration-500 hover:scale-105" />
        ${
          !isDisponivel
            ? `<div class="absolute inset-0 bg-[#1c3852]/75 backdrop-blur-[2px] flex items-center justify-center p-2 text-center">
                 <span class="text-white text-xs uppercase tracking-widest font-semibold px-4 py-1.5 border border-white/40 rounded-full">
                   Já Presenteado ${p.compradorNome ? `por ${p.compradorNome}` : ''}
                 </span>
               </div>`
            : ""
        }
      </div>
      <div class="p-5 flex flex-col flex-grow justify-between text-center bg-gradient-to-b from-white to-[#f9fcff]">
        <div>
          <h3 class="font-serif text-lg text-[#1c3852] font-medium">${p.nome}</h3>
          <p class="text-slate-500 text-xs mt-1 line-clamp-2 leading-relaxed font-light">${p.descricao || ""}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-[#e2effa] flex flex-col items-center gap-3">
          <span class="font-serif text-xl font-semibold text-[#23496d]">${valorFormatado}</span>
          ${
            isDisponivel
              ? `<button onclick="abrirModalPresentear(${p.id}, '${p.nome}',${p.valor})" 
                         style="background-color: #23496d !important; color: #ffffff !important; border: 1px solid #23496d !important;" 
                         class="w-full py-2.5 rounded-xl font-sans text-xs uppercase tracking-widest font-semibold flex items-center justify-center gap-2 shadow-sm transition hover:opacity-90 active:scale-[0.99] cursor-pointer">
                   Presentear
                   <svg class="w-3.5 h-3.5 text-[#b8dcfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                   </svg>
                 </button>`
              : `<button disabled class="w-full py-2.5 rounded-xl bg-[#eaf3fb] text-slate-400 font-sans text-xs uppercase tracking-widest font-medium cursor-not-allowed">
                   Indisponível
                 </button>`
          }
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Abre o modal de identificação
function abrirModalPresentear(id, nome, valor) {
  presenteSelecionadoId = id;
  
  const modal = document.getElementById("modalPresentear");
  const modalNome = document.getElementById("modalNomePresente");
  const modalValor = document.getElementById("modalValorPresente");
  const inputNome = document.getElementById("modalInputNome");

  if (!modal) return;

  modalNome.textContent = nome;
  modalValor.textContent = Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  inputNome.value = "";
  
  modal.classList.remove("hidden");
  setTimeout(() => inputNome.focus(), 100);
}

// Fecha o modal de identificação
function fecharModalPresentear() {
  const modal = document.getElementById("modalPresentear");
  if (modal) modal.classList.add("hidden");
  presenteSelecionadoId = null;
}

// Envia o nome e redireciona ao checkout do Mercado Pago
async function confirmarPresentear(e) {
  e.preventDefault();
  
  const inputNome = document.getElementById("modalInputNome");
  const btnConfirmar = document.getElementById("btnModalConfirmar");
  const nomeComprador = inputNome.value.trim();

  if (!nomeComprador) {
    alert("Por favor, digite o seu nome.");
    return;
  }

  btnConfirmar.disabled = true;
  btnConfirmar.innerText = "A carregar Checkout...";

  try {
    const response = await fetch(`${API_URL}/${presenteSelecionadoId}/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nomeComprador }),
    });

    const data = await response.json();
    const linkPagamento = data.initPoint || data.init_point;

    if (response.ok && linkPagamento) {
      window.location.href = linkPagamento;
    } else {
      console.error("Detalhes do erro do servidor:", data);
      alert(data.error || "Não foi possível gerar o link de pagamento. Tente novamente.");
      btnConfirmar.disabled = false;
      btnConfirmar.innerText = "Ir para o Pix / Cartão";
    }
  } catch (error) {
    console.error("Erro ao comprar presente:", error);
    alert("O servidor pode estar a inicializar. Aguarde alguns segundos e tente novamente.");
    btnConfirmar.disabled = false;
    btnConfirmar.innerText = "Ir para o Pix / Cartão";
  }
}

/* ==========================================================
   2. LÓGICA DO MURAL DE RECADOS (index.html)
   ========================================================== */

// Carrega os recados guardados no Supabase
async function carregarRecados() {
  const container = document.getElementById("listaRecados");
  if (!container) return; // Se não estiver na página com o mural, ignora

  try {
    const res = await fetch(MENSAGENS_API);
    if (!res.ok) throw new Error("Erro ao carregar mensagens");
    const mensagens = await res.json();

    if (!Array.isArray(mensagens) || mensagens.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8 text-slate-400 text-sm font-light">
          Seja o primeiro a deixar uma mensagem de carinho para os noivos!
        </div>
      `;
      return;
    }

    container.innerHTML = mensagens.map((m) => `
      <div class="bg-white p-5 rounded-2xl border border-[#cbe4fa] shadow-sm flex flex-col justify-between">
        <p class="font-serif italic text-slate-700 text-sm leading-relaxed mb-4">"${m.texto}"</p>
        <div class="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-400">
          <span class="font-semibold text-[#1c3852] font-sans">${m.autor}</span>
          <span>${m.dataEnvio ? new Date(m.dataEnvio).toLocaleDateString('pt-BR') : ''}</span>
        </div>
      </div>
    `).join("");
  } catch (error) {
    console.error("Erro ao carregar recados:", error);
    container.innerHTML = `
      <div class="col-span-full text-center py-4 text-slate-400 text-sm font-light">
        Não foi possível carregar os recados no momento.
      </div>
    `;
  }
}

// Envia uma nova mensagem escrita no mural
async function enviarRecado(e) {
  e.preventDefault();
  
  const btn = document.getElementById("btnEnviarRecado");
  const autorInput = document.getElementById("recadoAutor");
  const textoInput = document.getElementById("recadoTexto");

  const autor = autorInput.value.trim();
  const texto = textoInput.value.trim();

  if (!autor || !texto) {
    alert("Por favor, preencha o seu nome e a mensagem.");
    return;
  }

  btn.disabled = true;
  btn.innerText = "A publicar...";

  try {
    const res = await fetch(MENSAGENS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ autor, texto }),
    });

    if (!res.ok) throw new Error("Erro ao guardar mensagem");

    autorInput.value = "";
    textoInput.value = "";
    await carregarRecados(); // Atualiza a lista no ecrã imediatamente
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    alert("Erro ao publicar a mensagem. Tente novamente!");
  } finally {
    btn.disabled = false;
    btn.innerText = "Publicar Mensagem";
  }
}