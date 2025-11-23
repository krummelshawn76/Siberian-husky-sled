// game.js – shared game logic for Siberian Husky Saga

const EDITIONS = {
  FRESH: {
    key: "FRESH",
    name: "Fresh Bait Edition",
    maxLevel: 10,
    baseGemsPerRun: 1,
    xpPerRun: 10
  },
  HUNTER: {
    key: "HUNTER",
    name: "Hunter Edition",
    maxLevel: 30,
    baseGemsPerRun: 2,
    xpPerRun: 15
  },
  GOD: {
    key: "GOD",
    name: "GOD Saga Edition",
    maxLevel: 99,
    baseGemsPerRun: 3,
    xpPerRun: 20
  }
};

let state = {
  level: 1,
  xp: 0,
  gems: 0,
  edition: window.GAME_EDITION || "FRESH",
  triggerUnlocked: false
};

function storageKey() {
  return "shs_state_" + state.edition;
}

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey());
    if (saved) {
      const obj = JSON.parse(saved);
      Object.assign(state, obj);
    }
  } catch (err) {
    console.warn("Failed to load state:", err);
  }
}

function saveState() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(state));
  } catch (err) {
    console.warn("Failed to save state:", err);
  }
}

function xpNeededForNextLevel() {
  const editionConfig = EDITIONS[state.edition];
  // Simple curve: base 50 + 10 * current level
  return 50 + state.level * 10;
}

function log(message) {
  const logEl = document.getElementById("log");
  if (!logEl) return;
  const time = new Date().toLocaleTimeString();
  const entry = document.createElement("div");
  entry.textContent = `[${time}] ${message}`;
  logEl.prepend(entry);
}

function updateUI() {
  const editionConfig = EDITIONS[state.edition];

  const levelEl = document.getElementById("level");
  const maxLevelEl = document.getElementById("max-level");
  const xpEl = document.getElementById("xp");
  const xpNextEl = document.getElementById("xp-next");
  const gemsEl = document.getElementById("gems");
  const triggerStatusEl = document.getElementById("trigger-status");

  if (levelEl) levelEl.textContent = state.level;
  if (maxLevelEl && editionConfig) maxLevelEl.textContent = editionConfig.maxLevel;
  if (xpEl) xpEl.textContent = state.xp;
  if (xpNextEl) xpNextEl.textContent = xpNeededForNextLevel();
  if (gemsEl) gemsEl.textContent = state.gems;

  if (triggerStatusEl) {
    triggerStatusEl.textContent = state.triggerUnlocked
      ? "Trigger: unlocked 🐕"
      : "Trigger: locked";
  }
}

function runMission() {
  const editionConfig = EDITIONS[state.edition];
  if (!editionConfig) {
    console.error("Invalid edition:", state.edition);
    return;
  }

  if (state.level >= editionConfig.maxLevel) {
    log("You are already at max level for this edition.");
    return;
  }

  // Base rewards
  state.gems += editionConfig.baseGemsPerRun;
  state.xp += editionConfig.xpPerRun;

  const needed = xpNeededForNextLevel();

  if (state.xp >= needed) {
    state.xp -= needed;
    state.level += 1;
    log(`Level up! You reached level ${state.level}.`);

    // GOD-specific: auto unlock Trigger at max level
    if (state.edition === "GOD") {
      const godCfg = EDITIONS.GOD;
      if (state.level >= godCfg.maxLevel && !state.triggerUnlocked) {
        state.triggerUnlocked = true;
        log("Trigger has joined you permanently! 🐕‍🦺");
      }
    }
  } else {
    log(
      `Mission complete. +${editionConfig.xpPerRun} XP, +${editionConfig.baseGemsPerRun} gems.`
    );
  }

  saveState();
  updateUI();
}

function tryUnlockTrigger() {
  if (state.edition !== "GOD") {
    alert("Trigger early unlock is only for the GOD Saga Edition.");
    return;
  }
  if (state.triggerUnlocked) {
    alert("Trigger is already unlocked.");
    return;
  }
  const cost = 300;
  if (state.gems < cost) {
    alert(`Not enough gems. You need ${cost} gems to unlock Trigger early.`);
    return;
  }
  state.gems -= cost;
  state.triggerUnlocked = true;
  log("You spent 300 gems to unlock Trigger early. 🐕");
  saveState();
  updateUI();
}

/**
 * Called when the "Buy Gems" buttons are clicked.
 * Opens the store page in a new tab and logs the intent.
 */
function buyOfflineNotice(editionLabel) {
  log(`Opening Stripe checkout for ${editionLabel} gems in a new tab...`);
  // Go to store so the player can choose correct Stripe link
  window.open("store.html", "_blank");
}

// Initialize
(function init() {
  state.edition = window.GAME_EDITION || "FRESH";
  loadState();
  updateUI();
})();
