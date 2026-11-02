const loginForm = document.getElementById("login-form");

const API_BASE ="https://spendwise-backend-stvh.onrender.com/api";

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const loginButton = loginForm.querySelector(".login-button");
  loginButton.disabled = true;

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.log("Login response is not JSON:", responseText);
    }

    console.log("Login status:", response.status);
    console.log("Login response:", data);

    if (response.ok) {
      window.location.replace("dashboard.html");
    } else {
      alert(data.message || responseText || "Invalid email or password.");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Unable to connect to the server. Check the browser console.");
  } finally {
    loginButton.disabled = false;
  }
});
