/******************************************************************************
 SIBERIAN HUSKY SAGA – MASTER GAME FILE
 - Husky: Spartan
 - Companion (GOD edition): Trigger (Yellow Lab)
 - Currency: GEMS
 - Editions: FRESH_BAIT, HUNTER, GOD_SAGA
 - Stripe: uses Game Account ID → Stripe Checkout (front-end only)
******************************************************************************/

(function () {
  // ------------------------
  // EDITIONS CONFIG
  // ------------------------
  const EDITIONS = {
  FRESH: {
    name: "Fresh Bait Edition",
    maxLevel: 10,
    baseGemsPerRun: 1,
    xpPerRun: 10,
    color: "#009f5a",
    // free edition: no paid packs (only in-game earned gems)
    store: {
      gemPacks: []
    }
  },

  HUNTER: {
    name: "Hunter Edition",
    maxLevel: 30,
    baseGemsPerRun: 2,
    xpPerRun: 15,
    color: "#e58a00",
    // Hunter uses low–mid gem packs
    store: {
      gemPacks: [
        { priceLabel: "$2",  gems: 10 },
        { priceLabel: "$5",  gems: 25 },
        { priceLabel: "$10", gems: 50 },
        { priceLabel: "$20", gems: 75 },
        { priceLabel: "$30", gems: 100 },
        { priceLabel: "$40", gems: 300 }
      ],
      // these are logical “uses” for gems in Hunter
      upgrades: [
        {
          id: "hunter_xp_boost",
          name: "XP Booster (+50% XP)",
          costGems: 25,
          apply: (state) => { state.hunterXpBoost = 1.5; }
        },
        {
          id: "hunter_gem_boost",
          name: "Gem Booster (+1 gem per run)",
          costGems: 40,
          apply: (state) => { state.hunterGemBonus = (state.hunterGemBonus || 0) + 1; }
        },
        {
          id: "hunter_autorun",
          name: "Unlock Auto-Run",
          costGems: 50,
          apply: (state) => { state.hunterAutoUnlocked = true; }
        }
      ]
    }
  },

  GOD: {
    name: "GOD Saga Edition",
    maxLevel: 99,
    baseGemsPerRun: 3,
    xpPerRun: 20,
    color: "#6d34d6",
    // GOD can see all tiers including high-end packs
    store: {
      gemPacks: [
        { priceLabel: "$2",  gems: 10 },
        { priceLabel: "$5",  gems: 25 },
        { priceLabel: "$10", gems: 50 },
        { priceLabel: "$20", gems: 75 },
        { priceLabel: "$30", gems: 100 },
        { priceLabel: "$40", gems: 300 },
        { priceLabel: "$50", gems: 500 },
        { priceLabel: "$60", gems: 700 },
        { priceLabel: "$70", gems: 900 },
        { priceLabel: "$80", gems: 1100 },
        { priceLabel: "$90", gems: 2000 },
        { priceLabel: "$100", gems: 1000000 } // crazy “support the dev” pack
      ],
      upgrades: [
        {
          id: "god_xp_boost",
          name: "GOD XP Multiplier (+100% XP)",
          costGems: 100,
          apply: (state) => { state.godXpBoost = 2; }
        },
        {
          id: "god_gem_boost",
          name: "GOD Gem Multiplier (+2 gems per run)",
          costGems: 150,
          apply: (state) => { state.godGemBonus = (state.godGemBonus || 0) + 2; }
        },
        {
          id: "god_trigger_early",
          name: "Early Trigger Unlock",
          costGems: 300,
          apply: (state) => { state.triggerUnlockedEarly = true; }
        },
        {
          id: "god_auras",
          name: "Divine Aura (cosmetic)",
          costGems: 50,
          apply: (state) => { state.godAuraOwned = true; }
        }
      ]
    }
  }
};
    
  // read which edition from HTML
  const editionKey = window.GAME_EDITION || "FRESH_BAIT";
  const EDITION = EDITIONS[editionKey];

  // ------------------------
  // STRIPE SETTINGS
  // ------------------------
  // This is the Stripe Payment 
  // BACKEND / WEBHOOKS must handle actual gem deposits.
  const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZu5kEcah7CS4V61NX1gs00";

  // ------------------------
  // GAME STATE
  // ------------------------
  const state = {
    huskyName: "Spartan",
    level: 1,
    xp: 0,
    xpToLevel: 100,
    gems: 0,
    energy: 100,
    maxEnergy: 100,

    speedLevel: 1,
    staminaLevel: 1,
    gemMultiplierLevel: 1,

    autoRunEnabled: false,
    autoRunIntervalId: null,

    triggerUnlocked: false
  };

  const root = document.getElementById("game-root");

  // ------------------------
  // DOM HELPERS
  // ------------------------
  function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function addLog(message) {
    const log = document.getElementById("log");
    if (!log) return;
    const entry = el("div", "log-entry", message);
    log.prepend(entry);
  }

  // ------------------------
  // STRIPE LINKING (Game Account ID)
  // ------------------------
  window.linkGameAccountId = function () {
    const input = document.getElementById("gameIdInput");
    const status = document.getElementById("link-status");
    if (!input || !status) return;

    const gameId = input.value.trim();
    if (!gameId) {
      status.textContent = "Please enter a valid Game Account ID.";
      return;
    }

    // Save locally so you can reuse it later if needed
    localStorage.setItem("game_id", gameId);

    status.textContent = "Game Account ID linked. Redirecting to Stripe checkout…";

    // IMPORTANT:
    // This ONLY sends player to Stripe with their Game ID attached.
    // Actual gem deposits must be done server-side using Stripe webhooks.
    const url =
      STRIPE_PAYMENT_LINK + "?client_reference_id=" + encodeURIComponent(gameId);

    window.location.href = url;
  };

  // ------------------------
  // RENDER UI
  // ------------------------
  function renderUI() {
    root.innerHTML = "";

    // HEADER
    const header = el("div", "game-header");
    const left = el("div");
    const title = el("h1", null, "Siberian Husky Saga");
    const subtitle = el(
      "div",
      "compact",
      "You are Spartan, a Siberian Husky. Earn gems, level up, and upgrade."
    );
    left.appendChild(title);
    left.appendChild(subtitle);

    const badge = el("span", "badge " + EDITION.badgeClass, EDITION.label);

    header.appendChild(left);
    header.appendChild(badge);
    root.appendChild(header);

    // Edition description
    root.appendChild(el("p", "compact", EDITION.description));

    // STRIPE LINKING SECTION
    const stripeBox = el("div", "stripe-box");
    const stripeTitle = el("div", "section-title", "Link Your Game Account");
    const stripeText = el(
      "p",
      "compact",
      "Enter your Game Account ID so Stripe payments can be connected to the right profile. " +
        "Gems are granted monthly or per purchase by your backend using Stripe webhooks."
    );

    const input = document.createElement("input");
    input.id = "gameIdInput";
    input.type = "text";
    input.placeholder = "Enter Game Account ID";
    input.className = "input";

    // preload saved ID if present
    const savedId = localStorage.getItem("game_id");
    if (savedId) input.value = savedId;

    const linkBtn = el("button", "premium", "Link & Open Stripe Checkout");
    linkBtn.onclick = window.linkGameAccountId;

    const status = el("p", "compact");
    status.id = "link-status";

    stripeBox.appendChild(stripeTitle);
    stripeBox.appendChild(stripeText);
    stripeBox.appendChild(input);
    stripeBox.appendChild(linkBtn);
    stripeBox.appendChild(status);
    root.appendChild(stripeBox);

    // STATS GRID
    const statsGrid = el("div", "stats-grid");
    const stats = [
      ["Husky", state.huskyName],
      ["Level", state.level + "/" + EDITION.maxLevel],
      ["XP", state.xp + "/" + state.xpToLevel],
      ["Gems", state.gems],
      ["Energy", state.energy + "/" + state.maxEnergy],
      ["Speed Lvl", state.speedLevel],
      ["Stamina Lvl", state.staminaLevel],
      ["Gem Multiplier", "x" + state.gemMultiplierLevel]
    ];
    stats.forEach(([label, value]) => {
      const card = el("div", "stat-card");
      card.appendChild(el("div", "stat-label", label));
      card.appendChild(el("div", "stat-value", value));
      statsGrid.appendChild(card);
    });
    root.appendChild(statsGrid);

    // ACTIONS
    const actions = el("div", "actions");

    const missionBtn = el("button", "primary", "Run Sled Mission");
    missionBtn.disabled = state.energy < 10 || state.level >= EDITION.maxLevel;
    missionBtn.onclick = runMission;
    actions.appendChild(missionBtn);

    const restBtn = el("button", "secondary", "Rest (+Energy)");
    restBtn.disabled = state.energy >= state.maxEnergy;
    restBtn.onclick = rest;
    actions.appendChild(restBtn);

    if (EDITION.features.autoRun) {
      const autoBtn = el(
        "button",
        "secondary",
        state.autoRunEnabled ? "Disable Auto-Run" : "Enable Auto-Run"
      );
      autoBtn.onclick = toggleAutoRun;
      actions.appendChild(autoBtn);
    }

    root.appendChild(actions);

    // UPGRADES (gems)
    const upTitle = el("div", "section-title", "Upgrades (Cost: Gems)");
    root.appendChild(upTitle);

    const upActions = el("div", "actions");
    const speedCost = costForUpgrade(state.speedLevel);
    const staminaCost = costForUpgrade(state.staminaLevel);
    const multCost = costForUpgrade(state.gemMultiplierLevel);

    const speedBtn = el(
      "button",
      "secondary",
      "Upgrade Speed (" + speedCost + " gems)"
    );
    speedBtn.disabled = state.gems < speedCost;
    speedBtn.onclick = function () {
      buyUpgrade("speed");
    };
    upActions.appendChild(speedBtn);

    const staminaBtn = el(
      "button",
      "secondary",
      "Upgrade Stamina (" + staminaCost + " gems)"
    );
    staminaBtn.disabled = state.gems < staminaCost;
    staminaBtn.onclick = function () {
      buyUpgrade("stamina");
    };
    upActions.appendChild(staminaBtn);

    const multBtn = el(
      "button",
      "secondary",
      "Upgrade Gem Multiplier (" + multCost + " gems)"
    );
    multBtn.disabled = state.gems < multCost;
    multBtn.onclick = function () {
      buyUpgrade("multiplier");
    };
    upActions.appendChild(multBtn);

    root.appendChild(upActions);

    // PREMIUM SHOP INFO (HUNTER & GOD)
    if (EDITION.features.premiumShop) {
      const shopBox = el("div");
      const shopTitle = el("div", "section-title", "Gem Shop (via Stripe)");
      const shopText = el(
        "p",
        "compact",
        "Gem bundles and subscriptions are purchased through Stripe. " +
          "This game does NOT directly grant gems on button click; your backend must " +
          "listen to Stripe webhooks and deposit gems based on the plan/price."
      );
      shopBox.appendChild(shopTitle);
      shopBox.appendChild(shopText);
      root.appendChild(shopBox);
    }

    // TRIGGER COMPANION (GOD edition)
    if (EDITION.features.triggerCompanion) {
      const compSection = el("div");
      if (!state.triggerUnlocked && state.level >= EDITION.maxLevel) {
        const cTitle = el("div", "section-title", "Legendary Companion Unlock");
        const cText = el(
          "p",
          "compact",
          "Spartan has reached the max level. Unlock Trigger, the Yellow Lab companion, for boosted rewards."
        );
        const unlockBtn = el("button", "premium", "Unlock Trigger");
        unlockBtn.onclick = unlockTrigger;
        compSection.appendChild(cTitle);
        compSection.appendChild(cText);
        compSection.appendChild(unlockBtn);
      } else if (state.triggerUnlocked) {
        const box = el(
          "div",
          "companion",
          "Trigger (Yellow Lab) runs alongside Spartan. Missions reward extra gems and XP."
        );
        compSection.appendChild(box);
      } else {
        compSection.appendChild(
          el(
            "p",
            "compact",
            "Reach level " + EDITION.maxLevel + " to unlock Trigger, the Yellow Lab."
          )
        );
      }
      root.appendChild(compSection);
    }

    // ACTIVITY LOG
    const logTitle = el("div", "section-title", "Activity Log");
    root.appendChild(logTitle);

    const log = el("div", "log");
    log.id = "log";
    root.appendChild(log);

    addLog("Welcome to " + EDITION.label + ". Spartan is ready.");
  }

  // ------------------------
  // GAME MECHANICS
  // ------------------------
  function costForUpgrade(level) {
    // grows quadratically: 50 * level^2
    return 50 * level * level;
  }

  function runMission() {
    if (state.energy < 10) {
      addLog("Spartan is too tired. Rest to recover energy.");
      return;
    }
    if (state.level >= EDITION.maxLevel) {
      addLog("Max level reached for this edition.");
      return;
    }

    // Energy cost reduced by stamina
    const baseCost = 10;
    const staminaReduction = state.staminaLevel * 0.5;
    const energyCost = Math.max(3, Math.floor(baseCost - staminaReduction));
    state.energy = Math.max(0, state.energy - energyCost);

    // Base rewards
    let baseGems = 15 + state.speedLevel * 5;
    let baseXp = 25 + state.speedLevel * 3;

    // Gem multiplier
    baseGems = baseGems * state.gemMultiplierLevel;

    // Trigger boost (GOD edition)
    if (state.triggerUnlocked) {
      baseGems = Math.floor(baseGems * 1.5);
      baseXp = Math.floor(baseXp * 1.2);
    }

    state.gems += baseGems;
    state.xp += baseXp;

    addLog(
      "Mission complete: +" +
        baseGems +
        " gems, +" +
        baseXp +
        " XP (Energy -" +
        energyCost +
        ")."
    );

    // Level up check
    if (state.xp >= state.xpToLevel) {
      levelUp();
    }

    renderUI();
  }

  function levelUp() {
    state.xp -= state.xpToLevel;
    state.level += 1;
    state.xpToLevel = Math.floor(state.xpToLevel * 1.25);

    addLog("Level up! Spartan reached level " + state.level + ".");

    if (state.level >= EDITION.maxLevel) {
      addLog("Max level for " + EDITION.label + " reached.");
    }
  }

  function rest() {
    const recovery = 20 + state.staminaLevel * 5;
    state.energy = Math.min(state.maxEnergy, state.energy + recovery);
    addLog("Spartan rests and recovers " + recovery + " energy.");
    renderUI();
  }

  function buyUpgrade(type) {
    let level;
    if (type === "speed") level = state.speedLevel;
    else if (type === "stamina") level = state.staminaLevel;
    else level = state.gemMultiplierLevel;

    const cost = costForUpgrade(level);
    if (state.gems < cost) {
      addLog("Not enough gems for that upgrade.");
      return;
    }

    state.gems -= cost;

    if (type === "speed") {
      state.speedLevel += 1;
      addLog("Speed upgraded. Missions are now faster and pay more.");
    } else if (type === "stamina") {
      state.staminaLevel += 1;
      state.maxEnergy += 5;
      addLog("Stamina upgraded. Spartan can run longer before resting.");
    } else {
      state.gemMultiplierLevel += 1;
      addLog("Gem multiplier upgraded. Missions now drop more gems.");
    }

    renderUI();
  }

  function toggleAutoRun() {
    if (!EDITION.features.autoRun) return;

    if (state.autoRunEnabled) {
      state.autoRunEnabled = false;
      if (state.autoRunIntervalId) {
        clearInterval(state.autoRunIntervalId);
        state.autoRunIntervalId = null;
      }
      addLog("Auto-run disabled.");
    } else {
      state.autoRunEnabled = true;
      state.autoRunIntervalId = setInterval(function () {
        if (state.energy >= 10 && state.level < EDITION.maxLevel) {
          runMission();
        }
      }, 2000); // every 2 seconds
      addLog("Auto-run enabled. Spartan will auto-run missions.");
    }

    renderUI();
  }

  function unlockTrigger() {
    if (!EDITION.features.triggerCompanion) return;
    if (state.triggerUnlocked) return;

    state.triggerUnlocked = true;
    addLog("Trigger (Yellow Lab) has joined Spartan! Rewards boosted.");
    renderUI();
  }

  // ------------------------
  // INIT
  // ------------------------
  renderUI();
})();
