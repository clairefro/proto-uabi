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
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (line.trim() === "") continue;
      const obj = JSON.parse(line);
      onData(obj);
    }
  }

  if (buffer.trim()) {
    onData(JSON.parse(buffer));
  }
}

// Render function
function renderIdiom(idiom) {
  const container = document.getElementById("idioms-container");
  const div = document.createElement("div");
  div.className = "idiom";
  div.innerHTML = `
    <strong>${idiom.idiom}</strong> (${idiom.language})<br>
    Meaning: ${idiom.meaning}<br>
    Tags: ${idiom.tags.join(", ")}
  `;
  container.appendChild(div);
}

// Start streaming
streamNDJSON("idioms.ndjson", renderIdiom);
