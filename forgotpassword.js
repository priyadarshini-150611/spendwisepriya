const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const emailInput = document.getElementById("email");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");

forgotPasswordForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const email = emailInput.value.trim();

  message.textContent = "";
  message.className = "message";

  if (!email) {
    showMessage("Please enter your email address.", "error");
    return;
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    showMessage("Please enter a valid email address.", "error");
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

  try {
    const response = await fetch(
      "http://localhost:8080/api/auth/forgot-password",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email }),
      },
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || "Unable to process your request.");
    }

    showMessage(
      data.message ||
        "If an account exists for this email, password reset instructions will be sent.",
      "success",
    );

    forgotPasswordForm.reset();
  } catch (error) {
    if (error instanceof TypeError) {
      showMessage(
        "Unable to connect to the server. Please try again later.",
        "error",
      );
    } else {
      showMessage(error.message, "error");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send Reset Link";
  }
});

function showMessage(text, type) {
  message.textContent = text;
  message.className = "message " + type;
}
