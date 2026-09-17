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