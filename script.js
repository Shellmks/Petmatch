// ================= SUPABASE =================
const SUPABASE_URL = "https://sowbkxqakhipmvoxhzyf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvd2JreHFha2hpcG12b3hoenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDcxODQsImV4cCI6MjA4MzgyMzE4NH0.TAc9wSQroF8FBY_GZjcib5h7MeB5jepCNHvL7llVZjU"; 
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================= ELEMENTOS =================
const nome = document.getElementById("nome");
const tipo = document.getElementById("tipo");
const cidade = document.getElementById("cidade");
const contato = document.getElementById("contato");
const fotoPet = document.getElementById("fotoPet");

const form = document.getElementById("petForm");
const listaPets = document.getElementById("listaPets");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCidade = document.getElementById("filtroCidade");

const adminArea = document.getElementById("adminArea");
const loginArea = document.getElementById("loginArea");
const btnLogout = document.getElementById("btnLogout");

let adminLogado = false;
let session = null;

// ================= PAGINAÇÃO =================
let petsPorPagina = 20;
let paginaAtual = 1;
let petsCarregados = [];

// ================= MAGIC LINK =================
window.enviarMagicLink = async function () {
  const email = document.getElementById("email").value;
  if (!email) { alert("Digite o email do administrador"); return; }

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href, shouldCreateUser: false }
  });

  if (error) alert("Erro ao enviar link: " + error.message);
  else alert("Link enviado! Verifique seu e-mail.");
};

// ================= AUTH STATE =================
supabaseClient.auth.onAuthStateChange((_event, newSession) => {
  session = newSession;
  adminLogado = !!newSession;

  adminArea.style.display = adminLogado ? "block" : "none";
  loginArea.style.display = adminLogado ? "none" : "block";

  if (adminLogado) carregarPets();
});

// ================= LOGOUT =================
btnLogout.addEventListener("click", async () => {
  await supabaseClient.auth.signOut();
  alert("Você saiu!");
});

// ================= PETS =================
async function carregarPets() {
  const { data, error } = await supabaseClient
    .from("pets")
    .select("*")
    .order("destaque", { ascending: false });

  if (error) { console.error(error); return; }

  petsCarregados = data;
  paginaAtual = 1;
  mostrarPetsPagina();
}

function mostrarPetsPagina() {
  listaPets.innerHTML = "";

  const t = filtroTipo.value.toLowerCase();
  const c = filtroCidade.value.toLowerCase();

  const petsFiltrados = petsCarregados.filter(p => 
    p.tipo.toLowerCase().includes(t) && p.cidade.toLowerCase().includes(c)
  );

  const inicio = (paginaAtual - 1) * petsPorPagina;
  const fim = inicio + petsPorPagina;
  const petsPagina = petsFiltrados.slice(inicio, fim);

  petsPagina.forEach(pet => {
    const card = document.createElement("div");
    card.className = `card ${pet.destaque ? "destaque" : ""}`;

    card.innerHTML = `
      ${pet.foto_url ? `<img src="${pet.foto_url}" alt="${pet.nome}" style="width:100%; border-radius:10px; margin-bottom:10px;">` : ""}
      ${pet.destaque ? `<span class="selo">⭐ Destaque</span>` : ""}
      <h3>${pet.nome}</h3>
      <p><strong>Tipo:</strong> ${pet.tipo}</p>
      <p><strong>Cidade:</strong> ${pet.cidade}</p>
      <a 
  href="https://wa.me/55${pet.contato}?text=Olá!%20Vi%20seu%20pet%20no%20PetMatch%20🐾"
  target="_blank" 
  class="btn-whatsapp"
>
  💬 Falar no WhatsApp
</a>

      ${adminLogado && session.user.id === pet.owner_id 
        ? `<button onclick="removerPet(${pet.id})">Remover</button>` 
        : ""}
    `;

    listaPets.appendChild(card);
  });

  mostrarControles(petsFiltrados.length);
}

function mostrarControles(totalPets) {
  const divControle = document.createElement("div");
  divControle.className = "pagination"; // classe pra estilizar no CSS

  const totalPaginas = Math.ceil(totalPets / petsPorPagina);

  const btnAnterior = document.createElement("button");
  btnAnterior.textContent = "⬅️ Anterior";
  btnAnterior.disabled = paginaAtual === 1;
  btnAnterior.className = "page-btn";
  btnAnterior.onclick = () => {
    paginaAtual--;
    mostrarPetsPagina();
  };

  const btnProximo = document.createElement("button");
  btnProximo.textContent = "Próximo ➡️";
  btnProximo.disabled = paginaAtual === totalPaginas;
  btnProximo.className = "page-btn";
  btnProximo.onclick = () => {
    paginaAtual++;
    mostrarPetsPagina();
  };

  const spanPagina = document.createElement("span");
  spanPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
  spanPagina.className = "page-info";

  divControle.appendChild(btnAnterior);
  divControle.appendChild(spanPagina);
  divControle.appendChild(btnProximo);

  listaPets.appendChild(divControle);
}


// ================= CRUD =================
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!adminLogado) return;

  const user = session.user;
  let fotoUrl = null;

  if (fotoPet.files.length > 0) {
    const foto = fotoPet.files[0];
    const fileName = `public/${Date.now()}_${foto.name}`;

    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from('pets-images')
      .upload(fileName, foto, { upsert: true });

    if (uploadError) {
      alert("Erro ao enviar foto: " + uploadError.message);
      return;
    }

    // pega a URL pública correta
    const { data: { publicUrl } } = supabaseClient
      .storage
      .from('pets-images')
      .getPublicUrl(uploadData.path);

    fotoUrl = publicUrl;
  }

  // Inserir pet na tabela
  const { error } = await supabaseClient.from("pets").insert([{
    nome: nome.value,
    tipo: tipo.value,
    cidade: cidade.value,
    contato: contato.value,
    destaque: document.getElementById("destaque").checked,
    owner_id: user.id,
    foto_url: fotoUrl
  }]);

  if (!error) {
    form.reset();
    carregarPets();
  } else {
    alert("Erro ao adicionar pet: " + error.message);
  }
});

window.removerPet = async function (id) {
  if (!adminLogado) return;

  const user = session.user;

  const { error } = await supabaseClient
    .from("pets")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) alert("Erro ao deletar: " + error.message);
  else carregarPets();
};

// ================= FILTROS =================
filtroTipo.addEventListener("input", () => { paginaAtual = 1; mostrarPetsPagina(); });
filtroCidade.addEventListener("input", () => { paginaAtual = 1; mostrarPetsPagina(); });

// ================= INIT =================
carregarPets();


