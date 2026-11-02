/* =========================================================
   SPENDWISE SETTINGS JAVASCRIPT
   ========================================================= */

/* =========================================================
   ELEMENTS
   ========================================================= */
const API_BASE = `${window.location.protocol}//${window.location.hostname}:8080/api`;

const hamburgerBtn = document.getElementById("hamburgerBtn");

const mobileNavOverlay = document.getElementById("mobileNavOverlay");

const sidebar = document.querySelector(".sidebar");

const navLinks = document.querySelectorAll(".sidebar .nav-link");

const profileName = document.getElementById("profileName");

const profileEmail = document.getElementById("profileEmail");

const saveProfileBtn = document.getElementById("saveProfileBtn");

const currentPassword = document.getElementById("currentPassword");

const newPassword = document.getElementById("newPassword");

const confirmPassword = document.getElementById("confirmPassword");

const changePasswordBtn = document.getElementById("changePasswordBtn");

const notificationToggle = document.getElementById("notificationToggle");

const budgetAlertToggle = document.getElementById("budgetAlertToggle");

const insightToggle = document.getElementById("insightToggle");

const lightModeBtn = document.getElementById("lightModeBtn");

const darkModeBtn = document.getElementById("darkModeBtn");

const deleteAccountBtn = document.getElementById("deleteAccountBtn");

/* =========================================================
   STORAGE KEY
   ========================================================= */

const SETTINGS_STORAGE_KEY = "spendwiseSettings";

/* =========================================================
   DEFAULT SETTINGS
   ========================================================= */

const defaultSettings = {
  profileName: "Priya",

  profileEmail: "",

  notifications: true,

  budgetAlerts: true,

  financialInsights: true,

  theme: "light",
};

/* =========================================================
   GET SAVED SETTINGS
   ========================================================= */

function getSavedSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (!saved) {
      return {
        ...defaultSettings,
      };
    }

    return {
      ...defaultSettings,
      ...JSON.parse(saved),
    };
  } catch (error) {
    return {
      ...defaultSettings,
    };
  }
}

/* =========================================================
   SAVE SETTINGS
   ========================================================= */

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function openMobileMenu() {
  if (!sidebar || !mobileNavOverlay || !hamburgerBtn) {
    return;
  }

  sidebar.classList.add("mobile-open");

  mobileNavOverlay.classList.add("active");

  document.body.classList.add("menu-open");

  hamburgerBtn.setAttribute("aria-expanded", "true");

  hamburgerBtn.setAttribute("aria-label", "Close navigation");

  hamburgerBtn.textContent = "✕";
}

function closeMobileMenu() {
  if (!sidebar || !mobileNavOverlay || !hamburgerBtn) {
    return;
  }

  sidebar.classList.remove("mobile-open");

  mobileNavOverlay.classList.remove("active");

  document.body.classList.remove("menu-open");

  hamburgerBtn.setAttribute("aria-expanded", "false");

  hamburgerBtn.setAttribute("aria-label", "Open navigation");

  hamburgerBtn.textContent = "☰";
}

if (hamburgerBtn && sidebar && mobileNavOverlay) {
  hamburgerBtn.addEventListener("click", function () {
    if (sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  mobileNavOverlay.addEventListener("click", closeMobileMenu);

  navLinks.forEach(function (link) {
    link.addEventListener("click", closeMobileMenu);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && sidebar.classList.contains("mobile-open")) {
      closeMobileMenu();
    }
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 600) {
      closeMobileMenu();
    }
  });
}
/* =========================================================
   LOAD LOGGED-IN USER PROFILE - SPRING BOOT
   ========================================================= */

async function loadUserProfile() {
  try {
    const response = await fetch(`${API_BASE}/auth/me`, {
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
      throw new Error(`Profile loading failed: ${response.status}`);
    }

    const user = await response.json();

    if (profileName) {
      profileName.value = user.fullName || "";
    }

    if (profileEmail) {
      profileEmail.value = user.email || "";
    }
  } catch (error) {
    console.error("Unable to load user profile:", error);
    alert("Unable to load your profile information.");
  }
}
/* =========================================================
   LOAD SETTINGS
   ========================================================= */

function loadSettings() {
  const settings = getSavedSettings();

  /* PROFILE */

  if (profileName) {
    profileName.value = settings.profileName || "";
  }

  if (profileEmail) {
    profileEmail.value = settings.profileEmail || "";
  }

  /* NOTIFICATIONS */

  if (notificationToggle) {
    notificationToggle.checked = settings.notifications;
  }

  if (budgetAlertToggle) {
    budgetAlertToggle.checked = settings.budgetAlerts;
  }

  if (insightToggle) {
    insightToggle.checked = settings.financialInsights;
  }

  /* THEME */

  if (settings.theme === "dark") {
    enableDarkMode(false);
  } else {
    enableLightMode(false);
  }
}

/* =========================================================
   SAVE PROFILE - SPRING BOOT BACKEND
   ========================================================= */

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", async function () {
    const name = profileName.value.trim();
    const email = profileEmail.value.trim();

    if (!name) {
      alert("Please enter your full name.");
      profileName.focus();
      return;
    }

    if (!email) {
      alert("Please enter your email address.");
      profileEmail.focus();
      return;
    }

    try {
      saveProfileBtn.disabled = true;

      const response = await fetch(`${API_BASE}/settings/profile`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          fullName: name,
          email: email,
        }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Invalid server response:", responseText);
      }

      if (!response.ok) {
        alert(data.message || data.error || "Unable to update profile.");
        return;
      }

      alert("Profile updated successfully.");

      // Update the profile header on this page.
      const firstName = name.split(/\s+/)[0];

      document.querySelectorAll(".profile-info strong").forEach((element) => {
        element.textContent = firstName;
      });

      document.querySelectorAll(".profile-avatar").forEach((element) => {
        element.textContent = firstName.charAt(0).toUpperCase();
      });
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Unable to connect to the server.");
    } finally {
      saveProfileBtn.disabled = false;
    }
  });
}

/* =========================================================
   CHANGE PASSWORD
   ========================================================= */
/* =========================================================
   CHANGE PASSWORD - SPRING BOOT BACKEND
   ========================================================= */

if (changePasswordBtn) {
  changePasswordBtn.addEventListener("click", async function () {
    const current = currentPassword.value;
    const newPass = newPassword.value;
    const confirm = confirmPassword.value;

    if (!current) {
      alert("Please enter your current password.");
      currentPassword.focus();
      return;
    }

    if (!newPass) {
      alert("Please enter a new password.");
      newPassword.focus();
      return;
    }

    if (newPass.length < 6) {
      alert("New password must contain at least 6 characters.");
      newPassword.focus();
      return;
    }

    if (newPass !== confirm) {
      alert("New password and confirmation do not match.");
      confirmPassword.focus();
      return;
    }

    try {
      changePasswordBtn.disabled = true;

      const response = await fetch(`${API_BASE}/settings/password`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          currentPassword: current,
          newPassword: newPass,
          confirmPassword: confirm,
        }),
      });

      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        console.error("Invalid server response:", responseText);
      }

      if (!response.ok) {
        alert(data.message || data.error || "Unable to change password.");
        return;
      }

      alert(
        "Password changed successfully. Please use your new password next time you log in.",
      );

      currentPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
    } catch (error) {
      console.error("Password change error:", error);
      alert("Unable to connect to the server.");
    } finally {
      changePasswordBtn.disabled = false;
    }
  });
}
/* =========================================================
   NOTIFICATION SETTINGS - SPRING BOOT BACKEND
   ========================================================= */

let preferences = {
  notificationsEnabled: true,
  budgetAlertsEnabled: true,
  insightsEnabled: true,
  theme: "light",
};

/* LOAD PREFERENCES FROM MYSQL */

async function loadPreferences() {
  try {
    const response = await fetch(`${API_BASE}/settings/preferences`, {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load preferences: ${response.status}`);
    }

    preferences = await response.json();

    if (notificationToggle) {
      notificationToggle.checked = preferences.notificationsEnabled;
    }

    if (budgetAlertToggle) {
      budgetAlertToggle.checked = preferences.budgetAlertsEnabled;
    }

    if (insightToggle) {
      insightToggle.checked = preferences.insightsEnabled;
    }

    if (preferences.theme === "dark") {
      enableDarkMode(false);
    } else {
      enableLightMode(false);
    }
  } catch (error) {
    console.error("Unable to load preferences:", error);
    alert("Unable to load notification preferences from the server.");
  }
}

/* SAVE PREFERENCES TO MYSQL */

async function savePreferences() {
  const updatedPreferences = {
    notificationsEnabled: notificationToggle
      ? notificationToggle.checked
      : preferences.notificationsEnabled,

    budgetAlertsEnabled: budgetAlertToggle
      ? budgetAlertToggle.checked
      : preferences.budgetAlertsEnabled,

    insightsEnabled: insightToggle
      ? insightToggle.checked
      : preferences.insightsEnabled,

    theme: preferences.theme || "light",
  };

  try {
    const response = await fetch(`${API_BASE}/settings/preferences`, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(updatedPreferences),
    });

    const responseText = await response.text();

    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (error) {
      console.error("Invalid preferences response:", responseText);
    }

    if (!response.ok) {
      throw new Error(
        data.message || data.error || "Unable to save preferences.",
      );
    }

    preferences = updatedPreferences;

    console.log("Preferences saved successfully:", preferences);
  } catch (error) {
    console.error("Preferences update error:", error);

    alert(`Unable to save preferences. ${error.message}`);

    // Restore the last successfully saved values.
    if (notificationToggle) {
      notificationToggle.checked = preferences.notificationsEnabled;
    }

    if (budgetAlertToggle) {
      budgetAlertToggle.checked = preferences.budgetAlertsEnabled;
    }

    if (insightToggle) {
      insightToggle.checked = preferences.insightsEnabled;
    }
  }
}

/* NOTIFICATION TOGGLE EVENTS */

if (notificationToggle) {
  notificationToggle.addEventListener("change", savePreferences);
}

if (budgetAlertToggle) {
  budgetAlertToggle.addEventListener("change", savePreferences);
}

if (insightToggle) {
  insightToggle.addEventListener("change", savePreferences);
}
/* =========================================================
   LIGHT MODE
   ========================================================= */

function enableLightMode(saveToBackend = true) {
  document.body.classList.remove("dark-mode");

  if (lightModeBtn) {
    lightModeBtn.classList.add("active");
  }

  if (darkModeBtn) {
    darkModeBtn.classList.remove("active");
  }

  preferences.theme = "light";

  const settings = getSavedSettings();
  settings.theme = "light";
  saveSettings(settings);

  if (saveToBackend) {
    savePreferences();
  }
}

/* =========================================================
   DARK MODE
   ========================================================= */

function enableDarkMode(saveToBackend = true) {
  document.body.classList.add("dark-mode");

  if (darkModeBtn) {
    darkModeBtn.classList.add("active");
  }

  if (lightModeBtn) {
    lightModeBtn.classList.remove("active");
  }

  preferences.theme = "dark";

  const settings = getSavedSettings();
  settings.theme = "dark";
  saveSettings(settings);

  if (saveToBackend) {
    savePreferences();
  }
}
/* =========================================================
   THEME BUTTONS
   ========================================================= */

if (lightModeBtn) {
  lightModeBtn.addEventListener("click", enableLightMode);
}

if (darkModeBtn) {
  darkModeBtn.addEventListener("click", enableDarkMode);
}

/* =========================================================
   DELETE ACCOUNT
   ========================================================= */

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", function () {
    const confirmed = confirm(
      "Are you sure you want to delete your account? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    /*
     * Frontend demo cleanup.
     *
     * Backend account deletion will be connected
     * to Spring Boot later.
     */

    localStorage.removeItem("spendwiseSettings");

    localStorage.removeItem("spendwiseExpenses");

    localStorage.removeItem("spendwiseIncome");

    localStorage.removeItem("spendwiseBudgets");

    localStorage.removeItem("spendwiseSavings");

    alert("Your account data has been removed.");

    window.location.href = "index.html";
  });
}

/* =========================================================
   INITIALIZE
   ========================================================= */

loadSettings();
loadUserProfile();
loadPreferences();