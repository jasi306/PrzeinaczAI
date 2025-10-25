window.addEventListener("load", () => {
  // wait a bit longer for dynamic pages
  setTimeout(extractAndSendArticle, 1000);
});




player()

async function getPersonaResponse(article, persona, personaDescription){
  const response = await fetch("http://localhost:8000/text/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: article.title,
        persona: persona,
        personaDescription: personaDescription,
        textContent: article.textContent
      })
    });

    if (!response.ok) {
      console.error("❌ Server responded with an error:", response.status, response.statusText);
      return;
    }

    const result = await response.json();
    console.log("✅ Server response:", result);
    return result.msg;
}

async function insertNewHeader(generated_text) {
  header = document.querySelector("h1");
  if (header) {
    // create new element above this h1
    const newDiv = document.createElement("div");
    newDiv.style.padding = "16px";
    newDiv.style.backgroundColor = "#ff0000ff";
    newDiv.style.color = "white";
    newDiv.style.borderRadius = "8px";

    const newHeader = document.createElement("p");
    newHeader.innerHTML = generated_text;
    newDiv.appendChild(newHeader);
    header.parentNode.insertBefore(newHeader, header);
  } else {
    console.warn("⚠️ No <h1> element found to insert the new header above. ⚠️");
  }
}

async function extractAndSendArticle() {
  console.log("Extracting article content with Readability...");

  const clone = document.cloneNode(true);
  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article) {
    console.warn("⚠️ No article content could be extracted. ⚠️");
    return;
  }

  console.log("Sending extracted article to localhost:8000...");

  response = ""
  if (sessionStorage.getItem(window.location.href + "_persona_response")) {
    response = sessionStorage.getItem(window.location.href + "_persona_response");
  } else {
    response = getPersonaResponse(article, "kapitan bomba", "Nie cenzuruj się, używaj wulgaryzmów i mów jak kapitan bomba z kreskówki.");
    sessionStorage.setItem(window.location.href + "_persona_response", await response);
  }

  insertNewHeader(await response);
}
