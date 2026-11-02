/* =========================================================
   SPENDWISE - SHARED USER PROFILE
   ========================================================= */

const API_BASE ="https://spendwise-backend-stvh.onrender.com/api";

async function loadSharedUserProfile() {
  try {
    const response = await fetch(`${PROFILE_API_BASE}/auth/me`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (response.status === 401) {
      window.location.replace("login.html");
      return;
    }

    if (!response.ok) {
      throw new Error(`Profile request failed: ${response.status}`);
    }

    const user = await response.json();

    const fullName = user.fullName?.trim();

    if (!fullName) {
      throw new Error("User name was not returned by the server.");
    }

    const firstName = fullName.split(/\s+/)[0];
    const initial = firstName.charAt(0).toUpperCase();

    document.querySelectorAll(".profile-info strong").forEach((element) => {
      element.textContent = firstName;
    });

    document.querySelectorAll(".profile-avatar").forEach((element) => {
      element.textContent = initial;
    });

    const welcomeHeading = document.getElementById("welcomeHeading");

    if (welcomeHeading) {
      welcomeHeading.textContent = `Welcome back, ${firstName}!`;
    }
  } catch (error) {
    console.error("Shared profile loading error:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadSharedUserProfile);
