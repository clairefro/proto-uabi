const languages = ["en", "zh", "ja"];
const container = document.getElementById("idioms-container");
const searchInput = document.getElementById("search");

// Virtualized render
const visibleIdioms = [];
const batchSize = 100;

// Simple in-memory search index
let allIdioms = [];

// Streaming NDJSON
async function streamNDJSON(url, onData) {
  const response = await fetch(url);
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;
      const obj = JSON.parse(line);
      onData(obj);
    }
  }

  if (buffer.trim()) onData(JSON.parse(buffer));
}

// Render idiom batch
function renderBatch(batch) {
  const fragment = document.createDocumentFragment();
  batch.forEach((idiom) => {
    const div = document.createElement("div");
    div.className = "idiom";
    div.innerHTML = `<strong>${idiom.idiom}</strong> (${idiom.language})<br>
                    ${idiom.romanization ? idiom.romanization + "<br>" : ""}
                    ${
                      idiom.literal
                        ? "Translation: " + idiom.literal + "<br>"
                        : ""
                    }
                     Meaning: ${idiom.meaning}<br>
                     Tags: ${idiom.tags.join(", ")}`;
    fragment.appendChild(div);
  });
  container.appendChild(fragment);
}

// Add idiom to buffer and render in batches
function addIdiom(idiom) {
  allIdioms.push(idiom);
  visibleIdioms.push(idiom);
  if (visibleIdioms.length >= batchSize) {
    renderBatch(visibleIdioms.splice(0, visibleIdioms.length));
  }
}

// Filter idioms by search
function filterIdioms(query) {
  container.innerHTML = "";
  const filtered = allIdioms.filter((i) =>
    i.idiom.toLowerCase().includes(query.toLowerCase())
  );
  renderBatch(filtered);
}

// Load single language
function loadLanguage(lang) {
  container.innerHTML = "";
  allIdioms = [];
  visibleIdioms.length = 0;
  streamNDJSON(`idioms/${lang}.ndjson`, addIdiom);
}

// Load all languages concurrently
function loadAllLanguages() {
  container.innerHTML = "";
  allIdioms = [];
  visibleIdioms.length = 0;
  languages.forEach((lang) => streamNDJSON(`idioms/${lang}.ndjson`, addIdiom));
}

// Event listeners
document
  .getElementById("language-select")
  .addEventListener("change", (e) => loadLanguage(e.target.value));
document.getElementById("load-all").addEventListener("click", loadAllLanguages);
searchInput.addEventListener("input", (e) => filterIdioms(e.target.value));

// Initial load
loadLanguage("en");
