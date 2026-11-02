const registerForm = document.getElementById("registerForm");

registerForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const terms = document.getElementById("terms").checked;

  // Frontend validation
  if (!name || !email || !password || !confirmPassword) {
    alert("Please fill in all required fields.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Passwords do not match.");
    return;
  }

  if (!terms) {
    alert("Please accept the Terms and Privacy Policy.");
    return;
  }

  try {
   const API_BASE ="https://spendwise-backend-stvh.onrender.com/api";

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        fullName: name,
        email: email,
        password: password,
      }),
    });

    // Read the response safely
    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error("Invalid server response:", responseText);
    }

    console.log("Registration status:", response.status);
    console.log("Registration response:", data);

    if (response.ok) {
      alert("Registration successful! You can now log in.");
      registerForm.reset();
      window.location.href = "login.html";
    } else {
      alert(
        data.message ||
          data.error ||
          `Registration failed. Status: ${response.status}`,
      );
    }
  } catch (error) {
    console.error("Registration error:", error);

    alert("Unable to connect to the server. Make sure SpendWise is running.");
  }
});
