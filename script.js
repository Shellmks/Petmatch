// 🔹 CONFIG SUPABASE
const nome = document.getElementById("nome");
const tipo = document.getElementById("tipo");
const cidade = document.getElementById("cidade");
const contato = document.getElementById("contato");

const SUPABASE_URL = "https://sowbkxqakhipmvoxhzyf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvd2JreHFha2hpcG12b3hoenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDcxODQsImV4cCI6MjA4MzgyMzE4NH0.TAc9wSQroF8FBY_GZjcib5h7MeB5jepCNHvL7llVZjU"; 

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// 🔹 ELEMENTOS
const form = document.getElementById("petForm");
const listaPets = document.getElementById("listaPets");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCidade = document.getElementById("filtroCidade");

let adminLogado = false;

// 🔹 ENVIAR MAGIC LINK
async function enviarMagicLink() {
  const email = "sheldonmarks8@gmail.com";

  const { error } = await supabase.auth.signInWithOtp({
    email: email,
    options: { emailRedirectTo: window.location.href }
  });

  if (error) alert("Erro ao enviar link: " + error.message);
  else alert("Link de login enviado para seu e-mail!");
}

// 🔹 CHECAR SESSÃO
async function checarSessao() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    adminLogado = true;
    document.getElementById("adminArea").style.display = "block";
    document.getElementById("loginArea").style.display = "none";
  }
}

// 🔹 ESCUTAR MUDANÇAS DE AUTENTICAÇÃO
supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    adminLogado = true;
    document.getElementById("adminArea").style.display = "block";
    document.getElementById("loginArea").style.display = "none";
  } else {
    adminLogado = false;
    document.getElementById("adminArea").style.display = "none";
    document.getElementById("loginArea").style.display = "block";
  }
});

// 🔹 MOSTRAR PETS
function mostrarPets(pets) {
  listaPets.innerHTML = "";

  const tipoFiltro = filtroTipo.value.toLowerCase();
  const cidadeFiltro = filtroCidade.value.toLowerCase();

  const filtrados = pets.filter(p =>
    p.tipo.toLowerCase().includes(tipoFiltro) &&
    p.cidade.toLowerCase().includes(cidadeFiltro)
  );

  filtrados.forEach(pet => {
    const card = document.createElement("div");
    card.className = `card ${pet.destaque ? "destaque" : ""}`;

    card.innerHTML = `
      ${pet.destaque ? `<span class="selo">⭐ Destaque</span>` : ""}
      <h3>${pet.nome}</h3>
      <p><strong>Tipo:</strong> ${pet.tipo}</p>
      <p><strong>Cidade:</strong> ${pet.cidade}</p>
      ${adminLogado ? `
        <button onclick="editarPet(${pet.id})">Editar</button>
        <button onclick="removerPet(${pet.id})">Remover</button>
      ` : ""}
    `;

    listaPets.appendChild(card);
  });
}

// 🔹 CARREGAR PETS
async function carregarPets() {
  const { data, error } = await supabase.from("pets").select("*").order("destaque", { ascending: false });
  if (error) console.error(error);
  else mostrarPets(data);
}

// 🔹 ADICIONAR PET
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!adminLogado) return;

  const novoPet = {
    nome: nome.value,
    tipo: tipo.value,
    cidade: cidade.value,
    contato: contato.value,
    destaque: document.getElementById("destaque").checked
  };

  const { error } = await supabase.from("pets").insert([novoPet]);
  if (error) alert("Erro ao adicionar pet");
  else {
    form.reset();
    carregarPets();
  }
});

// 🔹 REMOVER PET
async function removerPet(id) {
  if (!adminLogado) return;
  if (confirm("Deseja remover este pet?")) {
    const { error } = await supabase.from("pets").delete().eq("id", id);
    if (error) alert("Erro ao remover");
    else carregarPets();
  }
}

// 🔹 FILTROS
filtroTipo.addEventListener("input", carregarPets);
filtroCidade.addEventListener("input", carregarPets);

// 🔹 CARREGAR AO ABRIR
carregarPets();
checarSessao();
