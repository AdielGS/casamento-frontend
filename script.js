// URLs das APIs no Render
const API_URL = "https://casamento-backend-w0y5.onrender.com/api/presentes";
const MENSAGENS_API = "https://casamento-backend-w0y5.onrender.com/api/mensagens";

// SUA PUBLIC KEY DO MERCADO PAGO
const MP_PUBLIC_KEY = "APP_USR-c338b80c-ba09-40ba-948d-32126f0d1620"; 


let mpInstance = null;
let bricksBuilder = null;
let paymentBrickController = null;

let presenteSelecionado = null;

// Função para inicializar o SDK com segurança
function inicializarMercadoPago() {
  if (window.MercadoPago && !mpInstance) {
    mpInstance = new MercadoPago(MP_PUBLIC_KEY, { locale: 'pt-BR' });
    bricksBuilder = mpInstance.bricks();
  }
}

// Inicializa listas
document.addEventListener("DOMContentLoaded", () => {
  inicializarMercadoPago();
  carregarPresentes();
  carregarRecados();
});

/* ==========================================================
   1. LISTA DE PRESENTES
   ========================================================== */

async function carregarPresentes() {
  const container = document.getElementById("grid-presentes");
  if (!container) return;

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

function renderizarPresentes(presentes) {
  const container = document.getElementById("grid-presentes");
  if (!container) return;
  container.innerHTML = "";

  if (presentes.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <p class="font-serif italic text-lg">A lista de presentes está sendo montada pelos noivos.</p>
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
              ? `<button onclick="abrirCheckoutBrick(${p.id}, '${p.nome.replace(/'/g, "\\'")}', ${p.valor})" 
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

/* ==========================================================
   2. CHECKOUT BRICKS (PIX, CARTÃO, BOLETO)
   ========================================================== */

async function abrirCheckoutBrick(id, nome, valor) {
  inicializarMercadoPago();

  presenteSelecionado = { id, nome, valor };

  const modal = document.getElementById("modalPresentear");
  document.getElementById("modalNomePresente").textContent = nome;
  document.getElementById("modalValorPresente").textContent = Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  document.getElementById("modalInputNome").value = "";
  
  // Reseta visualizações
  document.getElementById("step-nome").classList.remove("hidden");
  document.getElementById("container-brick").classList.remove("hidden");
  document.getElementById("resultado-pix").classList.add("hidden");
  document.getElementById("paymentBrick_container").innerHTML = `
    <div class="py-10 text-center text-xs text-slate-400">
      Carregando formas de pagamento...
    </div>
  `;

  modal.classList.remove("hidden");

  // Destrói brick anterior se existir
  if (paymentBrickController) {
    try {
      paymentBrickController.unmount();
    } catch(e) {}
  }

  if (!bricksBuilder) {
    document.getElementById("paymentBrick_container").innerHTML = `
      <div class="p-4 text-center text-xs text-rose-600 bg-rose-50 rounded-xl">
        Não foi possível carregar o Mercado Pago. Verifique sua conexão ou recarregue a página.
      </div>
    `;
    return;
  }

  // Renderiza o Brick com Pix, Cartão e Boleto
  const settings = {
    initialization: {
      amount: Number(valor),
    },
    customization: {
      paymentMethods: {
        bankTransfer: 'all',     // Pix
        creditCard: 'all',       // Cartão de Crédito
        ticket: 'all',           // Boleto
      },
      visual: {
        style: {
          theme: 'bootstrap',
        }
      }
    },
    callbacks: {
      onReady: () => {
        // Brick carregado com sucesso
      },
      onSubmit: ({ selectedPaymentMethod, formData }) => {
        return new Promise((resolve, reject) => {
          const nomeComprador = document.getElementById("modalInputNome").value.trim();

          const dadosEnvio = {
            ...formData,
            presenteId: presenteSelecionado.id,
            compradorNome: nomeComprador || "Convidado",
          };

          fetch(`${API_URL}/processar-pagamento`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dadosEnvio),
          })
          .then(res => res.json())
          .then(data => {
            if (data.status === "approved") {
              alert("Pagamento aprovado com sucesso! Muito obrigado pelo carinho!");
              fecharModalPresentear();
              carregarPresentes();
              resolve();
            } else if (data.qr_code_base64 || data.qr_code) {
              // É PIX: Exibe o QR Code na tela
              document.getElementById("step-nome").classList.add("hidden");
              document.getElementById("container-brick").classList.add("hidden");
              
              const imgQr = document.getElementById("pix-qr-img");
              imgQr.src = `data:image/png;base64,${data.qr_code_base64}`;
              document.getElementById("pix-copia-cola").value = data.qr_code;
              
              document.getElementById("resultado-pix").classList.remove("hidden");
              resolve();
            } else if (data.ticket_url) {
              // É Boleto
              window.open(data.ticket_url, '_blank');
              alert("Boleto gerado com sucesso! Abrimos em uma nova aba para você pagar.");
              fecharModalPresentear();
              resolve();
            } else {
              alert("Status do pagamento: " + (data.status || "Pendente"));
              resolve();
            }
          })
          .catch(err => {
            console.error("Erro ao processar:", err);
            alert("Erro ao processar pagamento. Verifique os dados e tente novamente.");
            reject();
          });
        });
      },
      onError: (error) => {
        console.error("Erro no Brick:", error);
      },
    },
  };

  paymentBrickController = await bricksBuilder.create(
    'payment',
    'paymentBrick_container',
    settings
  );
}

function fecharModalPresentear() {
  const modal = document.getElementById("modalPresentear");
  if (modal) modal.classList.add("hidden");
  if (paymentBrickController) {
    try { paymentBrickController.unmount(); } catch(e) {}
  }
}

function copiarPix() {
  const input = document.getElementById("pix-copia-cola");
  input.select();
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById("btn-copiar-pix");
  btn.innerText = "Chave Copiada!";
  setTimeout(() => { btn.innerText = "Copiar Código Pix"; }, 2000);
}

/* ==========================================================
   3. MURAL DE RECADOS
   ========================================================== */

async function carregarRecados() {
  const container = document.getElementById("listaRecados");
  if (!container) return;

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
    container.innerHTML = `<div class="col-span-full text-center py-4 text-slate-400 text-sm font-light">Não foi possível carregar os recados.</div>`;
  }
}

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
    await carregarRecados();
  } catch (err) {
    console.error("Erro ao enviar mensagem:", err);
    alert("Erro ao publicar mensagem.");
  } finally {
    btn.disabled = false;
    btn.innerText = "Publicar Mensagem";
  }
}