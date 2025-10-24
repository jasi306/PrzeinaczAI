console.log("hello-world");

const API_KEY = "";

async function askGpt() {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Jesteś zwięzły i precyzyjny." },
          { role: "user", content: "Napisz dokładnie: hello-worldx2" }
        ],
        temperature: 0
      })
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn("GPT error", data);
      return;
    }

    const text = data?.choices?.[0]?.message?.content ?? "";
    console.log("GPT says:", text);
  } catch (e) {
    console.warn("Fetch failed", e);
  }
}

askGpt();


console.log("hello-world3");
