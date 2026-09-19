const API_URL = "https://casamento-backend-w0y5.onrender.com/api/presentes";

async function buscarPresentes() {
  const container = document.getElementById("grid-presentes");

  try {
    const response = await fetch(API_URL);
    const presentes = await response.json();

    if (presentes.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12 bg-white rounded-3xl p-8 border border-sky-100">
          <span class="text-4xl mb-3 block">🎁</span>
          <p class="text-[#c5a059] font-serif text-2xl mb-1">Todos os presentes já foram escolhidos!</p>
          <p class="text-slate-500 text-sm">Agradecemos imensamente o carinho e o apoio de todos com a nossa união ❤️</p>
        </div>
      `;
      return;
    }

    container.innerHTML = presentes.map(item => `
      <div class="wedding-card bg-white rounded-3xl overflow-hidden border border-sky-100 flex flex-col justify-between shadow-sm">
        
        <!-- Foto do Presente -->
        <div class="relative w-full h-48 overflow-hidden bg-slate-100">
          <img src="${item.imagemUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80'}" 
               alt="${item.nome}" 
               class="w-full h-full object-cover hover:scale-110 transition duration-500">
          <span class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1 rounded-full shadow-sm">
            Disponível
          </span>
        </div>

        <!-- Descrição -->
        <div class="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h4 class="font-serif font-semibold text-slate-800 text-lg leading-snug">${item.nome}</h4>
            <p class="text-xs text-slate-500 mt-2 line-clamp-2">${item.descricao || ''}</p>
          </div>

          <!-- Valor e Botão de Ação -->
          <div class="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
            <div>
              <span class="text-[10px] uppercase text-slate-400 font-bold tracking-wider block">Valor</span>
              <p class="text-xl font-serif font-bold text-[#c5a059]">
                R$ ${Number(item.valor).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <button onclick="iniciarPagamento(${item.id})" 
                    class="btn-presentear text-white text-xs font-semibold uppercase tracking-wider px-5 py-3 rounded-2xl shadow-sm">
              Presentear
            </button>
          </div>
        </div>

      </div>
    `).join('');

  } catch (error) {
    console.error("Erro ao carregar os presentes:", error);
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <p class="text-red-400 text-sm">Não foi possível carregar os presentes no momento. Verifique se o backend está ligado.</p>
      </div>
    `;
  }
}

function baixarICS() {
  const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Casamento Adiel e Julia//PT
BEGIN:VEVENT
UID:casamento-adiel-julia-2026@casamento.com
DTSTAMP:20260919T120000Z
DTSTART:20261114T183000Z
DTEND:20261115T020000Z
SUMMARY:Casamento Adiel & Julia
DESCRIPTION:Celebração do Casamento de Adiel e Julia.
LOCATION:Local do Casamento
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'casamento-adiel-e-julia.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const MENSAGENS_API = "https://casamento-backend-w0y5.onrender.com/api/mensagens";

async function carregarRecados() {
  const container = document.getElementById("listaRecados");
  if (!container) return;

  try {
    const res = await fetch(MENSAGENS_API);
    const dados = await res.json();

    if (dados.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-6 text-slate-400 text-sm">Seja o primeiro a deixar uma mensagem de carinho!</div>`;
      return;
    }

    container.innerHTML = dados.map(item => `
      <div class="bg-white p-5 rounded-xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
        <p class="font-serif italic text-slate-700 text-sm mb-4">"${item.texto}"</p>
        <div class="border-t border-slate-100 pt-3 flex justify-between items-center text-xs text-slate-400">
          <span class="font-semibold text-slate-800 font-sans">${item.autor}</span>
          <span>${item.dataEnvio ? new Date(item.dataEnvio).toLocaleDateString('pt-BR') : ''}</span>
        </div>
      </div>
    `).join("");
  } catch (error) {
    container.innerHTML = `<div class="col-span-full text-center py-4 text-rose-500 text-sm">Não foi possível carregar as mensagens.</div>`;
  }
}

async function enviarRecado(e) {
  e.preventDefault();
  const btn = document.getElementById("btnEnviarRecado");
  const autorInput = document.getElementById("recadoAutor");
  const textoInput = document.getElementById("recadoTexto");

  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const resposta = await fetch(MENSAGENS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        autor: autorInput.value,
        texto: textoInput.value
      })
    });

    if (!resposta.ok) throw new Error("Erro ao salvar mensagem");

    autorInput.value = "";
    textoInput.value = "";
    await carregarRecados();
  } catch (err) {
    alert("Erro ao enviar mensagem. Tente novamente!");
  } finally {
    btn.disabled = false;
    btn.textContent = "Publicar Mensagem";
  }
}

// Inicia a busca das mensagens ao abrir a página
document.addEventListener("DOMContentLoaded", () => {
  carregarRecados();
});

async function iniciarPagamento(id) {
  try {
    const res = await fetch(`${API_URL}/${id}/checkout`, { method: "POST" });
    const data = await res.json();
    
    if (data.initPoint) {
      window.location.href = data.initPoint;
    } else {
      alert("Erro ao iniciar pagamento: " + (data.error || "Tente novamente mais tarde."));
    }
  } catch (e) {
    alert("Erro de conexão ao tentar iniciar o pagamento.");
  }
}

// Inicia a busca ao abrir a página
buscarPresentes();