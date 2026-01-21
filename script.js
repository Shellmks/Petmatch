// ================= SUPABASE =================
const SUPABASE_URL = "https://sowbkxqakhipmvoxhzyf.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvd2JreHFha2hpcG12b3hoenlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyNDcxODQsImV4cCI6MjA4MzgyMzE4NH0.TAc9wSQroF8FBY_GZjcib5h7MeB5jepCNHvL7llVZjU";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ================= ELEMENTOS =================
const nome = document.getElementById("nome");
const tipo = document.getElementById("tipo");
const cidade = document.getElementById("cidade");
const contato = document.getElementById("contato");

const form = document.getElementById("petForm");
const listaPets = document.getElementById("listaPets");
const filtroTipo = document.getElementById("filtroTipo");
const filtroCidade = document.getElementById("filtroCidade");

const adminArea = document.getElementById("adminArea");
const loginArea = document.getElementById("loginArea");

let adminLogado = false;

// ================= MAGIC LINK =================
window.enviarMagicLink = async function () {
  const email = document.getElementById("email").value;

  if (!email) {
    alert("Digite o email do administrador");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
      shouldCreateUser: false
    }
  });

  if (error) {
    alert("Erro ao enviar link: " + error.message);
  } else {
    alert("Link enviado! Verifique seu e-mail.");
  }
};

// ================= AUTH STATE =================
supabaseClient.auth.onAuthStateChange((_event, session) => {
  if (session) {
    adminLogado = true;
    adminArea.style.display = "block";
    loginArea.style.display = "none";
  } else {
    adminLogado = false;
    adminArea.style.display = "none";
    loginArea.style.display = "block";
  }
});

// ================= PETS =================
async function carregarPets() {
  const { data, error } = await supabaseClient
    .from("pets")
    .select("*")
    .order("destaque", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  mostrarPets(data);
}

function mostrarPets(pets) {
  listaPets.innerHTML = "";

  const t = filtroTipo.value.toLowerCase();
  const c = filtroCidade.value.toLowerCase();

  pets
    .filter(p =>
      p.tipo.toLowerCase().includes(t) &&
      p.cidade.toLowerCase().includes(c)
    )
    .forEach(pet => {
      const card = document.createElement("div");
      card.className = `card ${pet.destaque ? "destaque" : ""}`;

      card.innerHTML = `
        ${pet.destaque ? `<span class="selo">⭐ Destaque</span>` : ""}
        <h3>${pet.nome}</h3>
        <p><strong>Tipo:</strong> ${pet.tipo}</p>
        <p><strong>Cidade:</strong> ${pet.cidade}</p>
        ${adminLogado ? `<button onclick="removerPet(${pet.id})">Remover</button>` : ""}
      `;

      listaPets.appendChild(card);
    });
}

// ================= CRUD =================
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (!adminLogado) return;

  const { error } = await supabaseClient.from("pets").insert([{
    nome: nome.value,
    tipo: tipo.value,
    cidade: cidade.value,
    contato: contato.value,
    destaque: document.getElementById("destaque").checked
  }]);

  if (!error) {
    form.reset();
    carregarPets();
  }
});

window.removerPet = async function (id) {
  if (!adminLogado) return;
  await supabaseClient.from("pets").delete().eq("id", id);
  carregarPets();
};

// ================= INIT =================
filtroTipo.addEventListener("input", carregarPets);
filtroCidade.addEventListener("input", carregarPets);
carregarPets();

