// window.addEventListener("load", () => {
//   // wait a bit longer for dynamic pages
//   setTimeout(extractAndSendArticle, 1000);
// });

player()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "RUN_EXTRACTION") {
    extractAndSendArticle(message.persona, message.absurd_level);
    sendResponse({ status: "Extraction started" });
  }
  return true;
});

async function getPersonaResponse(article, persona, absurd_level, personaDescription){
  console.log("🌟 Sending article to server for persona:", persona, "with absurd level:", absurd_level);
  const response = await fetch("http://localhost:8000/text/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: article.title,
        persona: persona,
        absurd_level: absurd_level,
        personaDescription: personaDescription,
        textContent: article.textContent
      })
    });

    if (!response.ok) {
      console.error("❌ Server responded with an error:", response.status, response.statusText);
      return;
    }

    const result = await response.json();
    return result.msg;
}

async function insertNewHeader(generated_text) {
  header = document.querySelector("h1");
  if (header) {

    if (document.getElementById("przeinaczai")) {
      div = document.getElementById("przeinaczai");
      div.getElementsByTagName("p")[0].innerHTML = generated_text;
    } else {
      // create new element above this h1
      let newDiv = document.createElement("div");
      newDiv.id = "przeinaczai";
      newDiv.style.padding = "16px";
      newDiv.style.backgroundColor = "#ff0000ff";
      newDiv.style.color = "white";
      newDiv.style.borderRadius = "8px";

      let newHeader = document.createElement("p");
      newHeader.innerHTML = generated_text;
      newDiv.appendChild(newHeader);
      header.parentNode.insertBefore(newDiv, header);
    }
    
  } else {
    console.error("⚠️ No <h1> element found to insert the new header above. ⚠️");
  }
}

function doesCachedValueExist(url, persona, absurd_level){
  const key = url + "_" + persona + "_" + absurd_level;
  if (sessionStorage.getItem(key)) {
    return true;
  }
  return false;
}

function getCachedValue(url, persona, absurd_level){
  const key = url + "_" + persona + "_" + absurd_level;
  return sessionStorage.getItem(key);
}

function setCachedValue(url, persona, absurd_level, value){
  const key = url + "_" + persona + "_" + absurd_level;
  sessionStorage.setItem(key, value);
}

async function extractAndSendArticle(persona, absurd_level) {
  const clone = document.cloneNode(true);
  const reader = new Readability(clone);
  const article = reader.parse();

  if (!article) {
    console.error("⚠️ No article content could be extracted. ⚠️");
    return;
  }

  response = ""
  if (doesCachedValueExist(window.location.href, persona, absurd_level)) {
    response = getCachedValue(window.location.href, persona, absurd_level);
    console.log(response);
    alert("CACHE " + persona + " " + absurd_level);
  } else {
    response = getPersonaResponse(article, persona, absurd_level, "Nie cenzuruj się, używaj wulgaryzmów i mów jak kapitan bomba z kreskówki.");
    setCachedValue(window.location.href, persona, absurd_level, await response);
    alert("SERVER " + persona + " " + absurd_level);
  }

  insertNewHeader(await response);
}
