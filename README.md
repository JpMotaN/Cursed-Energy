# Cursed Energy

**Cursed Energy** is a custom Foundry VTT module inspired by *Jujutsu Kaisen*.  
It replaces the default spell slot system with a unified pool of **Cursed Energy (CE)**.  
All spellcasting classes now spend CE instead of slots, with automatic scaling by level and caster type.

---

## ✨ Features

- **Unified CE Pool**  
  Spell slots are no longer used — all casters draw from a single pool of Cursed Energy.  
  CE maximum is calculated automatically based on level and caster category (full, half, third, misc).

- **Automatic Costs**  
  Spells consume CE depending on level (configurable curve).  
  Rituals and cantrips can have multipliers or fixed costs.

- **UI Integration**  
  - Compact **badge** in the actor header with CE value/max, +/– buttons, and category override.  
  - Large **bar** under Hit Dice/Resources showing CE visually.  
  - Tooltips on spells show CE cost, and unaffordable spells appear dimmed.

- **Migration Tool**  
  One-click button to populate CE on all actors, hide slots, and enforce CE usage.

- **Rest Recovery**  
  - **Long Rest**: fully restores CE.  
  - **Short Rest**: restores a fraction (25% default, 50% for Warlock-like casters).

- **Customization**  
  - JSON configs for cost curves and class→category mapping.  
  - Per-spell CE cost overrides.  
  - Actor-specific caster category overrides.  
  - `/ea` chat command (`+5`, `-10%`, `set 30`, `max`, `recalc`, etc.).

- **Playground (Simulator)**  
  Test CE scaling by level and category, preview cost curves, and apply results to actors.

---

## 📦 Installation

1. In Foundry VTT, go to **Add-on Modules → Install Module**.  
2. Paste the Manifest URL from the latest [GitHub Release](https://github.com/JpMotaN/Cursed-Energy/releases).  
3. Enable the module in your world settings.  
4. Run the **Cursed Energy Migrator** (in settings) to populate actors.

---

## 📌 Planned Updates

- **“Kokusen” mechanic** — unique feature inspired by *Jujutsu Kaisen*.  
- **New spells and feats** adapted from the manga/anime.  
- **Progression bonuses** — systems granting extra CE or special points per level.  
- **Complementary features** such as cursed techniques, passive traits, or CE-enhanced abilities.  
- **Deeper integration** with popular sheets (Tidy5e, DFreds, Token Action HUD).

---

## 📢 Support & Feedback

This is the **first version**.  
If you’d like to follow updates early and suggest new features, please consider supporting me on **[Patreon](https://www.patreon.com/c/Jotape_Dev)**.
