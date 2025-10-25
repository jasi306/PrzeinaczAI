window.addEventListener("load", () => {
  // Wait a bit for dynamic pages to finish rendering
  setTimeout(extractAndSendArticle, 1200);
});

async function extractAndSendArticle() {
  try {
    console.log("🔍 Extracting article content with Readability...");

    const clone = document.cloneNode(true);
    const reader = new Readability(clone);
    const article = reader.parse();

    if (!article) {
      console.warn("⚠️ No article content could be extracted.");
      return;
    }

    console.log("📤 Sending extracted article to localhost:8000...");

    const response = await fetch("http://localhost:8000", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: window.location.href,
        title: article.title,
        excerpt: article.excerpt,
        textContent: article.textContent
        // htmlContent: article.content
      })
    });

    if (!response.ok) {
      console.error("❌ Server responded with an error:", response.status, response.statusText);
      return;
    }

    const result = await response.text();
    console.log("✅ Server response:", result);
  } catch (err) {
    console.error("❌ Error while parsing or sending article:", err);
  }
}
