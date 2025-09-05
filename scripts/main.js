// scripts/main.js
const MOD_ID = "cursed-energy";

/* =========================
   I18N HELPERS (with English fallback)
   ========================= */
const EN_FALLBACK = {
  "CE.moduleName": "Cursed Energy",
  "CE.short": "CE",

  "CE.migrate.title": "Migrate to Cursed Energy",
  "CE.migrate.populate.label": "Populate Cursed Energy on all actors",
  "CE.migrate.populate.hint": "Sets label/value/max based on level & caster category.",
  "CE.migrate.hideSlots.label": "Hide spell slots on sheets (per-actor)",
  "CE.migrate.hideSlots.hint": "Visual only; does not delete data.",
  "CE.migrate.force.label": "Force CE (ignore slot consumption)",
  "CE.migrate.force.hint": "Casting always uses CE; dialog won't ask about slots.",
  "CE.migrate.run": "Run",
  "CE.migrate.done": "Migration completed.",

  "CE.settings.resourcePath.name": "Attribute path for CE",
  "CE.settings.resourcePath.hint": "E.g. system.resources.primary",
  "CE.settings.shortRest.name": "Short Rest Recovery (typical casters)",
  "CE.settings.warlockShortRest.name": "Short Rest Recovery (misc/Warlock)",
  "CE.settings.ritualMult.name": "Ritual Cost Multiplier",
  "CE.settings.cantripCost.name": "Cantrip Cost (level 0)",
  "CE.settings.costCurve.name": "Cost Curve (JSON 1..9)",
  "CE.settings.classMap.name": "Class → Category Map (JSON)",
  "CE.settings.forceByDefault.name": "Force CE by default",
  "CE.settings.forceByDefault.hint": "Ignores slots (consumeSlot=false) and cleans slot warnings in cast dialog.",
  "CE.settings.badge.name": "Show CE badge in sheet header",
  "CE.settings.row.name": "Show big CE bar under Hit Dice/Resources",
  "CE.settings.autoMapBar2.name": "Auto-map Token Bar 2 to CE",
  "CE.settings.hideSlotsGlobal.name": "Hide spell slots on sheets (global)",
  "CE.settings.hideSlotsGlobal.hint": "Hides most spell slot UI on common dnd5e sheets. Visual only.",

  "CE.menu.migrator.name": "Migrate to Cursed Energy",
  "CE.menu.migrator.label": "Open Migrator",
  "CE.menu.migrator.hint": "Populate CE, hide slots and force CE (one click).",
  "CE.menu.playground.name": "Cursed Energy Playground",
  "CE.menu.playground.label": "Open CE Playground",
  "CE.menu.playground.hint": "Simulate CE max, rest recovery and spell costs by level/category.",

  "CE.ui.badge.title": "Cursed Energy ({path})",
  "CE.ui.badge.cat.title": "Caster category (click to change)",
  "CE.ui.row.title": "Cursed Energy",
  "CE.ui.tooltip.cost": "CE cost (base level): {cost}",
  "CE.ui.tooltip.cantrip": "Cantrip (cost {cost})",

  "CE.cat.default": "Default (automatic)",
  "CE.cat.full": "FULL (Wizard/Cleric...)",
  "CE.cat.half": "HALF (Paladin/Ranger/Artificer)",
  "CE.cat.third": "THIRD (Eldritch Knight/Arcane Trickster)",
  "CE.cat.misc": "MISC (Warlock-like)",
  "CE.cat.dialog.title": "Caster Category (Override)",
  "CE.cat.dialog.text": "Select the category to apply <i>only</i> to this actor.",
  "CE.cat.dialog.apply": "Apply",

  "CE.item.override.label": "[Cursed Energy] CE Cost (override)",
  "CE.item.override.notes": "Leave empty to use the curve. A value here replaces the calculated cost.",
  "CE.item.override.clear": "Clear",
  "CE.item.override.cleared": "Spell cost override removed.",

  "CE.cast.notEnough": "[Cursed Energy] Not enough CE ({curr}/{cost}) for {spell}.",
  "CE.cast.spent": "[Cursed Energy] {actor} spent {cost} CE on {spell}. Left: {left}/{max}.",

  "CE.rest.recoveredShort": "Recovered {amount} CE on Short Rest.",
  "CE.rest.recoveredLong": "Cursed Energy fully restored on Long Rest.",

  "CE.commands.usage": "Usage: /ea +N | -N | +10% | -25% | set N | setmax | max | recalc | show",
  "CE.commands.noActor": "Link a character to your user to use /ea.",
  "CE.commands.show": "CE: {value}/{max}",
  "CE.commands.recalcAll": "CE maximum recomputed for all actors.",
  "CE.commands.selectFirst": "Select a token/actor first.",

  "CE.play.title": "Cursed Energy – Playground",
  "CE.play.category": "Category",
  "CE.play.level": "Level",
  "CE.play.pool": "Pool & Recovery",
  "CE.play.max": "Max CE",
  "CE.play.sr": "Short Rest",
  "CE.play.lr": "Long Rest",
  "CE.play.curve": "Curve (costs)",
  "CE.play.table": "Spell Cost Table",
  "CE.play.apply": "Apply to Selected Actor",
  "CE.play.applied": "Applied {cat} L{lvl} → CE {max} to {name}.",

  "CE.buttons.recomputeAll": "[Cursed Energy] Recompute CE (all actors)"
};

function L(key){
  try {
    const v = game?.i18n?.localize?.(key);
    if (v && v !== key) return v;
  } catch {}
  return EN_FALLBACK[key] ?? key;
}
function F(key, data){
  try {
    const v = game?.i18n?.format?.(key, data);
    if (v && v !== key) return v;
  } catch {}
  // poor-man formatter for fallback:
  let s = EN_FALLBACK[key] ?? key;
  if (data && typeof s === "string"){
    for (const [k,val] of Object.entries(data)){
      s = s.replaceAll(`{${k}}`, String(val));
    }
  }
  return s;
}

/* =========================
   CONFIG / TABLES
   ========================= */
const DEFAULT_COST_CURVE = {1:2,2:3,3:5,4:7,5:10,6:13,7:17,8:21,9:26};
const DEFAULT_SHORT_REST_FRACTION = 0.25;
const DEFAULT_WARLOCK_SHORT_REST_FRACTION = 0.5;
const DEFAULT_RESOURCE_PATH = "system.resources.primary";
const DEFAULT_RITUAL_MULTIPLIER = 0.0;
const DEFAULT_CANTRIP_COST = 0;

const TABLE_FULL  = [0,4,8,12,16,20,24,29,34,39,44,50,56,62,69,76,83,91,99,108,118];
const TABLE_HALF  = [0,2,4,6,8,10,12,15,18,21,24,27,30,33,37,41,45,49,53,58,63];
const TABLE_THIRD = [0,1,2,3,4,5,6,8,10,12,14,16,18,20,23,26,29,32,35,39,43];
const TABLE_MISC  = [0,3,6,9,12,15,18,22,26,30,34,38,42,46,51,56,61,66,71,77,83];

const DEFAULT_CLASS_MAP = {
  "wizard":"full","cleric":"full","druid":"full","sorcerer":"full","bard":"full",
  "warlock":"misc","paladin":"half","ranger":"half","artificer":"half",
  "fighter":"third","rogue":"third"
};

/* =========================
   HELPERS
   ========================= */
const getSetting = (k)=>game.settings.get(MOD_ID,k);
const setSetting = (k,v)=>game.settings.set(MOD_ID,k,v);
const clamp = (v,a,b)=>Math.min(Math.max(Number(v),a),b);

function getNested(obj, path){ return path.split(".").reduce((o,k)=>o?.[k], obj); }
function actorLevel(actor){ return actor.system?.details?.level ?? actor.system?.details?.xp?.level ?? 1; }
function tableForCategory(cat){ return {full:TABLE_FULL,half:TABLE_HALF,third:TABLE_THIRD,misc:TABLE_MISC}[cat] ?? TABLE_THIRD; }

function inferCasterCategory(actor){
  // per-actor override wins
  const flag = actor.getFlag(MOD_ID,"casterCategoryOverride");
  if (flag) return flag;
  const clsMap = getSetting("classMapParsed") ?? DEFAULT_CLASS_MAP;
  const classes = actor.items.filter(i=>i.type==="class");
  const rank = { full:3, half:2, misc:1, third:0 };
  let best = "third";
  for (const c of classes){
    const id = (c.system?.identifier || c.name || "").toLowerCase().replace(/\s+/g,"");
    const cat = clsMap[id] ?? "third";
    if (rank[cat] > rank[best]) best = cat;
  }
  return best;
}
function computeMaxCE(actor){
  const lvl = Math.min(Math.max(actorLevel(actor),0),20);
  return tableForCategory(inferCasterCategory(actor))[lvl] ?? 0;
}
function getResource(actor){
  const path = getSetting("resourcePath");
  const base = getNested(actor, path) ?? {};
  return { path, value: Number(base.value ?? 0), max: Number(base.max ?? 0), label: base.label ?? L("CE.ui.row.title") };
}
function ensureResourcePopulated(actor){
  const res = getResource(actor);
  if (res.max > 0) return null;
  const max = computeMaxCE(actor);
  return { [`${res.path}.label`]: L("CE.ui.row.title"), [`${res.path}.max`]: max, [`${res.path}.value`]: max };
}
function getCastLevel(config, item){
  return Number(
    config?.level ??
    config?.castLevel ??
    config?.spellLevel ??
    config?.itemLevel ??
    item?.system?.level ?? 0
  );
}
function itemOverrideCost(item){
  const v = item.getFlag(MOD_ID,"eaCostOverride");
  return (v === 0 || v) ? Number(v) : null;
}
function costForSpell(item, levelOverride){
  if (item?.type !== "spell") return 0;

  // 1) per-spell override, if any
  const ov = itemOverrideCost(item);
  if (ov !== null) return Math.max(0, Number(ov));

  // 2) default by level / cast level
  const sys = item.system ?? {};
  const base = Number(sys.level ?? 0);
  if (base === 0) return Number(getSetting("cantripCost") ?? 0);
  const curve = getSetting("costCurveParsed") ?? DEFAULT_COST_CURVE;
  const castLevel = Number(levelOverride ?? sys.level ?? base);
  let cost = Number(curve[Math.max(base, castLevel)] ?? 0);
  const ritualFlag = sys.components?.ritual || sys.ritual === true;
  if (ritualFlag) cost = Math.round(cost * (getSetting("ritualCostMultiplier") ?? DEFAULT_RITUAL_MULTIPLIER));
  return Math.max(0,cost);
}
function forcingEA(actor){
  return actor?.getFlag(MOD_ID,"forceEA") || getSetting("forceEAByDefault");
}
function forceNoSlotsOnConfig(config){
  if (!config) return;
  config.consumeSlot = false;
  if (config.consume !== undefined) config.consume = false;
  if (config.consumeUsage !== undefined) config.consumeUsage = false;
  if (config.consumeQuantity !== undefined) config.consumeQuantity = false;
  if (config.spellSlot !== undefined) config.spellSlot = false;
  if (config.consume?.slot !== undefined) config.consume.slot = false;
  if (config.consume?.spellSlot !== undefined) config.consume.spellSlot = false;
}

/* =========================
   MIGRATOR
   ========================= */
class CEMigratorDialog extends FormApplication {
  render(force, options){
    const content = `
      <form class="cursed-energy-migrator">
        <div class="form-group">
          <label>${L("CE.migrate.populate.label")}</label>
          <input type="checkbox" name="populate" checked/>
          <p class="notes">${L("CE.migrate.populate.hint")}</p>
        </div>
        <div class="form-group">
          <label>${L("CE.migrate.hideSlots.label")}</label>
          <input type="checkbox" name="hideSlots"/>
          <p class="notes">${L("CE.migrate.hideSlots.hint")}</p>
        </div>
        <div class="form-group">
          <label>${L("CE.migrate.force.label")}</label>
          <input type="checkbox" name="forceEA" checked/>
          <p class="notes">${L("CE.migrate.force.hint")}</p>
        </div>
      </form>`;
    new Dialog({
      title: L("CE.migrate.title"),
      content,
      buttons: {
        exec: {
          icon: '<i class="fas fa-bolt"></i>',
          label: L("CE.migrate.run"),
          callback: (html) => {
            const form = html[0].querySelector("form");
            const opts = {
              populate: form.querySelector('input[name="populate"]')?.checked,
              hideSlots: form.querySelector('input[name="hideSlots"]')?.checked,
              forceEA:  form.querySelector('input[name="forceEA"]')?.checked
            };
            runMigration(opts);
          }
        }
      },
      default: "exec"
    }).render(true);
    return this;
  }
}
async function runMigration(opts){
  const ups = [];
  for (const actor of game.actors){
    const res = getResource(actor);
    const patch = {};
    if (opts.populate){
      const max = computeMaxCE(actor);
      const curr = Math.min(Number(res.value ?? 0), max);
      patch[`${res.path}.label`] = L("CE.ui.row.title");
      patch[`${res.path}.max`] = max;
      patch[`${res.path}.value`] = curr || max;
    }
    await actor.setFlag(MOD_ID,"hideSlots", !!opts.hideSlots);
    await actor.setFlag(MOD_ID,"forceEA",  !!opts.forceEA);
    if (Object.keys(patch).length) ups.push({ _id: actor.id, ...patch });
  }
  if (ups.length) await Actor.updateDocuments(ups);
  ui.notifications.info(L("CE.migrate.done"));
}

/* =========================
   SETTINGS
   ========================= */
Hooks.once("init", () => {
  game.settings.register(MOD_ID,"resourcePath",{name:L("CE.settings.resourcePath.name"),hint:L("CE.settings.resourcePath.hint"),scope:"world",config:true,type:String,default:DEFAULT_RESOURCE_PATH});
  game.settings.register(MOD_ID,"shortRestFraction",{name:L("CE.settings.shortRest.name"),scope:"world",config:true,type:Number,default:DEFAULT_SHORT_REST_FRACTION,range:{min:0,max:1,step:0.05}});
  game.settings.register(MOD_ID,"warlockShortRestFraction",{name:L("CE.settings.warlockShortRest.name"),scope:"world",config:true,type:Number,default:DEFAULT_WARLOCK_SHORT_REST_FRACTION,range:{min:0,max:1,step:0.05}});
  game.settings.register(MOD_ID,"ritualCostMultiplier",{name:L("CE.settings.ritualMult.name"),scope:"world",config:true,type:Number,default:DEFAULT_RITUAL_MULTIPLIER,range:{min:0,max:1,step:0.05}});
  game.settings.register(MOD_ID,"cantripCost",{name:L("CE.settings.cantripCost.name"),scope:"world",config:true,type:Number,default:DEFAULT_CANTRIP_COST,range:{min:0,max:5,step:1}});
  game.settings.register(MOD_ID,"costCurve",{name:L("CE.settings.costCurve.name"),scope:"world",config:true,type:String,default:JSON.stringify(DEFAULT_COST_CURVE),onChange:v=>{try{setSetting("costCurveParsed",JSON.parse(v));}catch{}}});
  game.settings.register(MOD_ID,"costCurveParsed",{scope:"world",config:false,type:Object,default:DEFAULT_COST_CURVE});
  game.settings.register(MOD_ID,"classMap",{name:L("CE.settings.classMap.name"),scope:"world",config:true,type:String,default:JSON.stringify(DEFAULT_CLASS_MAP),onChange:v=>{try{setSetting("classMapParsed",JSON.parse(v));}catch{}}});
  game.settings.register(MOD_ID,"classMapParsed",{scope:"world",config:false,type:Object,default:DEFAULT_CLASS_MAP});
  game.settings.register(MOD_ID,"forceEAByDefault",{name:L("CE.settings.forceByDefault.name"),hint:L("CE.settings.forceByDefault.hint"),scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(MOD_ID,"showBadgeInHeader",{name:L("CE.settings.badge.name"),scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(MOD_ID,"showRowUnderHitDice",{name:L("CE.settings.row.name"),scope:"world",config:true,type:Boolean,default:true});
  game.settings.register(MOD_ID,"autoMapTokenBar2",{name:L("CE.settings.autoMapBar2.name"),scope:"world",config:true,type:Boolean,default:true});

  game.settings.register(MOD_ID, "hideSlotsGlobally", {
    name: L("CE.settings.hideSlotsGlobal.name"),
    hint: L("CE.settings.hideSlotsGlobal.hint"),
    scope: "world", config: true, type: Boolean, default: false
  });

  game.settings.registerMenu(MOD_ID,"migrator",{name:L("CE.menu.migrator.name"),label:L("CE.menu.migrator.label"),hint:L("CE.menu.migrator.hint"),icon:"fas fa-bolt",type:CEMigratorDialog,restricted:true});

  game.settings.registerMenu(MOD_ID, "playground", {
    name: L("CE.menu.playground.name"),
    label: L("CE.menu.playground.label"),
    hint: L("CE.menu.playground.hint"),
    icon: "fas fa-sliders",
    type: class CEPlaygroundMenu extends FormApplication {},
    restricted: false
  });
});

Hooks.once("ready", () => {
  try{ setSetting("costCurveParsed", JSON.parse(getSetting("costCurve"))); }catch{ setSetting("costCurveParsed", DEFAULT_COST_CURVE); }
  try{ setSetting("classMapParsed", JSON.parse(getSetting("classMap"))); }catch{ setSetting("classMapParsed", DEFAULT_CLASS_MAP); }

  globalThis.CursedEnergy = {
    getCost:(spell,levelOverride)=>costForSpell(spell,levelOverride),
    getPool:(actor)=>getResource(actor),
    spend:async(actor,amount)=>spendEA(actor,amount),
    canCast:(actor,spell,levelOverride)=>{const cost=costForSpell(spell,levelOverride);const p=getResource(actor);return (p.value??0)>=cost;},
    recomputeAll:async()=>recomputeAllActors(),
    openMigrator:()=>new CEMigratorDialog().render(true),
    openPlayground:()=> (new CEPlayground()).render(true)
  };

  startDialogObserver();

  Hooks.on("chatMessage", (log, msg) => {
    if (msg?.trim()?.toLowerCase() === "/ceplay") { (new CEPlayground()).render(true); return false; }
  });
});

/* =========================
   UI – badge + bar; actor-category override; item override
   ========================= */
function injectBadge(app, html){
  if (!getSetting("showBadgeInHeader")) return;
  html.find(".ce-badge").remove();
  const actor = app.actor;
  const res = getResource(actor);
  const badge = $(`<div class="ce-badge" title="${F("CE.ui.badge.title",{path:res.path})}">
    <strong>${L("CE.short")}:</strong> <span class="ce-val">${res.value}</span>/<span class="ce-max">${res.max}</span>
    <span class="ce-btn" data-op="dec">−</span><span class="ce-btn" data-op="inc">+</span>
    <span class="ce-cat" title="${L("CE.ui.badge.cat.title")}">${inferCasterCategory(actor).toUpperCase()}</span>
  </div>`);
  const header = html.find(".window-header .window-title");
  if (header.length) header.after(badge); else html.prepend(badge);

  badge.on("click",".ce-btn", async ev=>{
    const op = ev.currentTarget.dataset.op;
    const mult = ev.shiftKey ? 5 : 1;
    const fresh = getResource(actor);
    let v = (fresh.value||0) + (op==="inc"?mult:-mult);
    if (ev.ctrlKey && op==="inc") v = fresh.max || v;
    if (ev.ctrlKey && op==="dec") v = 0;
    v = clamp(v, 0, (fresh.max||0) || ((fresh.value||0)+1));
    await actor.update({ [`${fresh.path}.value`]: v, [`${fresh.path}.label`]: L("CE.ui.row.title") });
    badge.find(".ce-val").text(v);
    html.find(".ce-row .ce-count b").text(v);
    const p = (getResource(actor).max||0)>0 ? Math.round((v/(getResource(actor).max||1))*100) : 0;
    html.find(".ce-row .ce-fill").css("width",`${p}%`);
  });

  badge.on("click",".ce-cat", async ()=>{
    const current = inferCasterCategory(actor);
    const dlg = await Dialog.prompt({
      title: L("CE.cat.dialog.title"),
      content: `<p>${L("CE.cat.dialog.text")}</p>
      <select name="cat">
        <option value="" ${!actor.getFlag(MOD_ID,"casterCategoryOverride")?"selected":""}>${L("CE.cat.default")}</option>
        <option value="full"  ${current==="full" && actor.getFlag(MOD_ID,"casterCategoryOverride")==="full" ?"selected":""}>${L("CE.cat.full")}</option>
        <option value="half"  ${current==="half" && actor.getFlag(MOD_ID,"casterCategoryOverride")==="half" ?"selected":""}>${L("CE.cat.half")}</option>
        <option value="third" ${current==="third"&& actor.getFlag(MOD_ID,"casterCategoryOverride")==="third"?"selected":""}>${L("CE.cat.third")}</option>
        <option value="misc"  ${current==="misc" && actor.getFlag(MOD_ID,"casterCategoryOverride")==="misc" ?"selected":""}>${L("CE.cat.misc")}</option>
      </select>`,
      label: L("CE.cat.dialog.apply"),
      callback: (html)=>html[0].querySelector('select[name="cat"]').value
    });
    if (dlg!==undefined){
      if (dlg==="") await actor.unsetFlag(MOD_ID,"casterCategoryOverride");
      else await actor.setFlag(MOD_ID,"casterCategoryOverride", dlg);
      await recomputeActor(actor);
      for (const app of Object.values(actor.apps??{})) if (app.rendered) app.render(false);
    }
  });
}

function injectRow(app, html){
  if (!getSetting("showRowUnderHitDice")) return;
  html.find(".ce-row").remove();

  const patch = ensureResourcePopulated(app.actor);
  if (patch) app.actor.update(patch);

  const actor = app.actor;
  const res = getResource(actor);
  const max = Number(res.max||0), val = Number(res.value||0);
  const pct = max>0? Math.round((val/max)*100) : 0;
  const row = $(`<div class="ce-row">
    <div class="ce-row-title">${L("CE.ui.row.title")}</div>
    <div class="ce-bar"><div class="ce-fill" style="width:${pct}%"></div></div>
    <div class="ce-count"><span><b>${val}</b> / ${max}</span>
      <span class="ce-mini-btn" data-op="dec">−</span>
      <span class="ce-mini-btn" data-op="inc">+</span>
    </div>
  </div>`);

  const anchors = ['.attributes','.primary-attributes','.attribute-list','.resources','.sheet-body','.tab.attributes','.panel.resources'];
  let placed=false;
  for (const sel of anchors){ const el = html.find(sel).first(); if (el.length){ el.after(row); placed=true; break; } }
  if (!placed) html.find('.window-content, .sheet-body').first().prepend(row);

  row.on("click",".ce-mini-btn", async ev=>{
    const op = ev.currentTarget.dataset.op;
    const mult = ev.shiftKey ? 5 : 1;
    const fresh = getResource(actor);
    let v = (fresh.value||0)+(op==="inc"?mult:-mult);
    v = clamp(v, 0, (fresh.max||0) || (fresh.value||0)+1);
    await actor.update({ [`${fresh.path}.value`]: v, [`${fresh.path}.label`]: L("CE.ui.row.title") });
    row.find(".ce-count b").text(v);
    const p = (getResource(actor).max||0)>0 ? Math.round((v/(getResource(actor).max||1))*100) : 0;
    row.find(".ce-fill").css("width",`${p}%`);
    html.find(".ce-badge .ce-val").text(v);
  });

  // spell tips
  html.find('.item[data-item-id]').each((_,el)=>{
    const li = $(el); const item = actor.items.get(li.data('itemId'));
    if (item?.type!=="spell") return;
    const cost = costForSpell(item);
    if (cost>0){
      li.attr("title",F("CE.ui.tooltip.cost",{cost}));
      if (val<cost) li.addClass("ce-insufficient");
    } else if (item.system?.level===0){
      li.attr("title",F("CE.ui.tooltip.cantrip",{cost:getSetting("cantripCost")}));
    }
  });
}

// render hooks
const renderActorHooks = ["renderActorSheet5e","renderActorSheet","renderActorSheet5eCharacter","renderActorSheet5eNPC","renderActorSheet5eVehicle"];
for (const h of renderActorHooks){
  Hooks.on(h,(app,html)=>{
    const actor = app.actor;
    if (actor.getFlag(MOD_ID,"hideSlots") || game.settings.get(MOD_ID,"hideSlotsGlobally")) {
      html.addClass("ce-hide-slots");
    }
    injectBadge(app, html);
    injectRow(app, html);
  });
}
Hooks.on("updateActor",(actor)=>{ for (const app of Object.values(actor.apps??{})) if (app.rendered) app.render(false); });

// item sheet: per-spell cost override field
Hooks.on("renderItemSheet",(app,html)=>{
  try{
    const item = app.item; if (item?.type!=="spell") return;
    if (html.find(".ce-item-override").length) return;

    const wrap = $(`<div class="form-group ce-item-override">
      <label>${L("CE.item.override.label")}</label>
      <div class="form-fields">
        <input type="number" name="ce-cost" step="1" min="0" placeholder="auto"/>
        <button type="button" class="ce-clear">${L("CE.item.override.clear")}</button>
        <p class="notes">${L("CE.item.override.notes")}</p>
      </div>
    </div>`);
    html.find('.tab.details, .sheet-body, form').first().append(wrap);

    const cur = item.getFlag(MOD_ID,"eaCostOverride");
    if (cur || cur===0) wrap.find('input[name="ce-cost"]').val(cur);

    wrap.find('button.ce-clear').on("click", async ()=>{
      await item.unsetFlag(MOD_ID,"eaCostOverride");
      ui.notifications.info(L("CE.item.override.cleared"));
    });
    wrap.find('input[name="ce-cost"]').on("change", async (ev)=>{
      const v = ev.currentTarget.value;
      if (v === "" || v === null) await item.unsetFlag(MOD_ID,"eaCostOverride");
      else await item.setFlag(MOD_ID,"eaCostOverride", Number(v));
    });
  }catch(e){ console.error(e); }
});

/* =========================
   TOKEN: auto-map Bar 2
   ========================= */
Hooks.on("preUpdateActor", (actor, change)=>{
  if (!getSetting("autoMapTokenBar2")) return;
  const resPath = getSetting("resourcePath");
  const bar2 = getNested(actor, "prototypeToken.bar2.attribute");
  if (bar2 === resPath) return;
  change.prototypeToken = mergeObject(change.prototypeToken ?? {}, { bar2: { attribute: resPath } });
});

/* =========================
   DIALOG – hide “Consume Slot?” and clean warnings
   ========================= */
function startDialogObserver(){
  const obs = new MutationObserver((mutations)=>{
    for (const m of mutations){
      m.addedNodes.forEach((n)=>{
        if (!(n instanceof HTMLElement)) return;
        if (!n.closest(".window-app")) return;
        const root = n.matches(".window-app") ? n : n.closest(".window-app");

        const groups = Array.from(root.querySelectorAll(".form-group, label, .checkbox, .checkbox-label, .form-fields"));
        for (const g of groups){
          const text = (g.textContent||"").toLowerCase();
          const byName = g.querySelector('input[name="consumeSlot"]');
          if (byName || /consume.*spell.*slot/.test(text)){
            const cb = byName || g.querySelector('input[type="checkbox"]');
            if (cb) cb.checked = false;
            g.style.display = "none";
          }
        }
        Array.from(root.querySelectorAll(".warning,.notification,.notes")).forEach(el=>{
          const t = (el.textContent||"").toLowerCase();
          if (t.includes("no available") && t.includes("slot")) el.remove();
        });
      });
    }
  });
  obs.observe(document.body, { childList:true, subtree:true });
}
Hooks.on("renderDialog",(_,html)=>{
  const root = html[0];
  const groups = Array.from(root.querySelectorAll(".form-group, label, .checkbox, .checkbox-label, .form-fields"));
  for (const g of groups){
    const text = (g.textContent||"").toLowerCase();
    const byName = g.querySelector('input[name="consumeSlot"]');
    if (byName || /consume.*spell.*slot/.test(text)){
      const cb = byName || g.querySelector('input[type="checkbox"]');
      if (cb) cb.checked = false;
      g.style.display = "none";
    }
  }
  Array.from(root.querySelectorAll(".warning,.notification,.notes")).forEach(el=>{
    const t = (el.textContent||"").toLowerCase();
    if (t.includes("no available") && t.includes("slot")) el.remove();
  });
});

/* =========================
   CE SPENDING – dnd5e + midi-qol + fallbacks
   ========================= */
const _CE_CHARGING = new Set();
const CE_CHARGING_HAS = (item)=>_CE_CHARGING.has(item?.id);

// dnd5e preUse
Hooks.on("dnd5e.preUseItem", async (item, config)=>{
  try{
    if (item?.type!=="spell") return;
    const actor = item.actor; if (!actor) return;
    if (forcingEA(actor)) forceNoSlotsOnConfig(config);
    if (CE_CHARGING_HAS(item)) return;

    const res = getResource(actor);
    const lvl = getCastLevel(config, item);
    let cost = costForSpell(item, lvl);
    if (cost<=0 && item.system.level===0 && getSetting("cantripCost")>0) cost = getSetting("cantripCost");
    if (cost<=0) return;

    const curr = Number(res.value ?? 0);
    if (curr < cost){ ui.notifications.warn(F("CE.cast.notEnough",{curr, cost, spell:item.name})); return false; }

    await actor.update({ [`${res.path}.value`]: curr - cost, [`${res.path}.label`]: L("CE.ui.row.title") });
    config.flags = config.flags || {}; config.flags[MOD_ID] = { charged: true, cost };
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: `<p>${F("CE.cast.spent",{actor:actor.name, cost, spell:item.name, left: (curr - cost), max: (res.max ?? "?")})}</p>` });
    return true;
  }catch(e){ console.error(`[${MOD_ID}] preUseItem`, e); }
});
// dnd5e use (fallback)
Hooks.on("dnd5e.useItem", async (item, config)=>{
  try{
    if (item?.type!=="spell") return;
    if (config?.flags?.[MOD_ID]?.charged) return;
    if (CE_CHARGING_HAS(item)) return;
    const actor = item.actor; if (!actor) return;
    if (forcingEA(actor)) forceNoSlotsOnConfig(config);

    const res = getResource(actor);
    const lvl = getCastLevel(config, item);
    let cost = costForSpell(item, lvl);
    if (cost<=0 && item.system.level===0 && getSetting("cantripCost")>0) cost = getSetting("cantripCost");
    if (cost<=0) return;

    const curr = Number(res.value ?? 0);
    if (curr < cost){ ui.notifications.warn(F("CE.cast.notEnough",{curr, cost, spell:item.name})); return false; }
    await actor.update({ [`${res.path}.value`]: curr - cost, [`${res.path}.label`]: L("CE.ui.row.title") });
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: `<p>${F("CE.cast.spent",{actor:actor.name, cost, spell:item.name, left:(curr - cost), max:(res.max ?? "?")})}</p>` });
  }catch(e){ console.error(`[${MOD_ID}] useItem`, e); }
});
// midi-qol
Hooks.on("midi-qol.preItemRoll", async (workflow)=>{
  try{
    const item = workflow?.item; const actor = workflow?.actor;
    if (!item || !actor || item.type!=="spell") return;

    if (forcingEA(actor)){
      workflow.consumeSpellSlot = false;
      workflow.options = workflow.options || {}; workflow.options.consumeSpellSlot = false;
    }

    const res = getResource(actor);
    const lvl = getCastLevel(workflow?.config ?? workflow?.data ?? {}, item);
    let cost = costForSpell(item, lvl);
    if (cost<=0 && item.system.level===0 && getSetting("cantripCost")>0) cost = getSetting("cantripCost");
    if (cost<=0) return;

    const curr = Number(res.value ?? 0);
    if (curr < cost){ ui.notifications.warn(F("CE.cast.notEnough",{curr, cost, spell:item.name})); return false; }

    await actor.update({ [`${res.path}.value`]: curr - cost, [`${res.path}.label`]: L("CE.ui.row.title") });
    workflow.ceCharged = true;
    ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: `<p>${F("CE.cast.spent",{actor:actor.name, cost, spell:item.name, left:(curr - cost), max:(res.max ?? "?")})}</p>` });
    return true;
  }catch(e){ console.error(`[${MOD_ID}] midi-qol.preItemRoll`, e); }
});
// fallback via ChatMessage
Hooks.on("preCreateChatMessage", async (msg, data)=>{
  if (data.flags?.[MOD_ID]?.done) return;
  const item = fromUuidSync(data.flags?.dnd5e?.itemUuid);
  if (!item || item?.type!=="spell") return;
  const actor = item.actor; if (!actor) return;

  const res = getResource(actor);
  const cost = costForSpell(item);
  if (cost<=0) return;

  const curr = Number(res.value ?? 0);
  if (curr < cost){ ui.notifications.warn(F("CE.cast.notEnough",{curr, cost, spell:item.name})); return false; }
  const newVal = curr - cost;
  await actor.update({ [`${res.path}.value`]: newVal, [`${res.path}.label`]: L("CE.ui.row.title") });
  data.flags = data.flags || {}; data.flags[MOD_ID] = { done: true };
  data.content = `<p>${F("CE.cast.spent",{actor:actor.name, cost, spell:item.name, left:newVal, max:(res.max ?? "?")})}</p>` + (data.content ?? "");
});

/* =========================
   RESTS
   ========================= */
Hooks.on("dnd5e.restCompleted", async (actor, restData)=>{
  try{
    const res = getResource(actor);
    const max = computeMaxCE(actor);
    const up = {};
    if (restData?.longRest){
      up[`${res.path}.value`] = max; up[`${res.path}.max`] = max; up[`${res.path}.label`] = L("CE.ui.row.title");
      ui.notifications?.info?.(L("CE.rest.recoveredLong"));
    } else if (restData?.shortRest){
      const cat = inferCasterCategory(actor);
      const frac = (cat==="misc") ? (getSetting("warlockShortRestFraction") ?? 0.5) : (getSetting("shortRestFraction") ?? 0.25);
      const rec = Math.max(0, Math.floor(max * frac));
      up[`${res.path}.value`] = Math.min(max, (res.value ?? 0) + rec);
      up[`${res.path}.max`] = max; up[`${res.path}.label`] = L("CE.ui.row.title");
      ui.notifications?.info?.(F("CE.rest.recoveredShort",{amount: rec}));
    }
    if (Object.keys(up).length) await actor.update(up);
  }catch(e){ console.error(e); }
});

/* =========================
   API / QoL
   ========================= */
async function spendEA(actor, amount){
  const res = getResource(actor);
  if ((res.value ?? 0) < amount) return false;
  await actor.update({ [`${res.path}.value`]: res.value - amount, [`${res.path}.label`]: L("CE.ui.row.title") });
  return true;
}
async function recomputeActor(actor){
  const res = getResource(actor);
  const max = computeMaxCE(actor);
  const curr = Math.min(Number(res.value ?? 0), max);
  await actor.update({ [`${res.path}.max`]: max, [`${res.path}.value`]: curr, [`${res.path}.label`]: L("CE.ui.row.title") });
}
async function recomputeAllActors(){
  for (const actor of game.actors) await recomputeActor(actor);
  ui.notifications.info(L("CE.commands.recalcAll"));
}

/* =========================
   /ea COMMANDS
   ========================= */
Hooks.on("chatMessage",(log,message)=>{
  if (!message?.trim()?.startsWith("/ea")) return;
  const actor = game.user?.character;
  if (!actor){ ui.notifications.warn(L("CE.commands.noActor")); return false; }
  const res = getResource(actor);
  const parts = message.trim().split(/\s+/).slice(1);
  const cmd = (parts[0]??"").toLowerCase();
  (async()=>{
    if (!cmd || cmd==="help"){ ui.notifications.info(L("CE.commands.usage")); return; }
    if (cmd==="show"){ ui.notifications.info(F("CE.commands.show",{value:res.value, max:res.max})); return; }
    if (cmd==="max" || cmd==="setmax"){ const m=computeMaxCE(actor); await actor.update({ [`${res.path}.value`]: m, [`${res.path}.max`]: m, [`${res.path}.label`]: L("CE.ui.row.title") }); return; }
    if (cmd==="recalc"){ await recomputeAllActors(); return; }
    if (cmd==="set"){ const n=Number(parts[1]??res.value??0); const m=Number(res.max??0); const v=clamp(n,0,m||n); await actor.update({ [`${res.path}.value`]: v, [`${res.path}.label`]: L("CE.ui.row.title") }); return; }
    if (/^[\+\-]\d+%$/.test(cmd)){ const sign = cmd.startsWith("+")?1:-1; const perc = Number(cmd.replace("%","").slice(1))/100; const delta = Math.round((res.max||0)*perc)*sign; const v=clamp((res.value??0)+delta,0,res.max||((res.value??0)+Math.max(0,delta))); await actor.update({ [`${res.path}.value`]: v, [`${res.path}.label`]: L("CE.ui.row.title") }); return; }
    if (/^[\+\-]\d+$/.test(cmd)){ const d=Number(cmd); const m=Number(res.max??0); const v=clamp((res.value??0)+d,0,m||((res.value??0)+Math.max(0,d))); await actor.update({ [`${res.path}.value`]: v, [`${res.path}.label`]: L("CE.ui.row.title") }); return; }
    ui.notifications.warn(L("CE.commands.usage"));
  })();
  return false;
});

/* =========================
   SETTINGS BUTTON
   ========================= */
Hooks.on("renderSettingsConfig",(app,html)=>{
  if (!game.user.isGM) return;
  const btn = $(`<button type="button" style="margin-top:8px;">${L("CE.buttons.recomputeAll")}</button>`);
  btn.on("click",()=>recomputeAllActors());
  html.find(`section[data-tab="modules"]`).append(btn);
});

/* =========================
   PLAYGROUND – quick simulator window
   ========================= */
class CEPlayground extends Application {
  static get defaultOptions(){
    return mergeObject(super.defaultOptions, {
      id: "ce-playground",
      title: L("CE.play.title"),
      width: 540, height: "auto", resizable: true,
      template: null, classes: ["ce-play"]
    });
  }
  render(force=false, options={}){
    const curve = getSetting("costCurveParsed");
    const cats = ["full","half","third","misc"];
    const wrap = document.createElement("div");
    wrap.classList.add("ce-play-wrap");
    wrap.innerHTML = `
      <style>
        .ce-play .ce-row{display:flex;gap:.5rem;align-items:center;margin:.25rem 0}
        .ce-play .grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.5rem}
        .ce-play table{width:100%;border-collapse:collapse}
        .ce-play th,.ce-play td{border:1px solid var(--color-border-light-2,#555);padding:.25rem .4rem;text-align:center}
        .ce-play .num{width:90px}
      </style>
      <div class="ce-row">
        <label>${L("CE.play.category")}</label>
        <select name="cat">
          ${cats.map(c=>`<option value="${c}">${c.toUpperCase()}</option>`).join("")}
        </select>
        <label>${L("CE.play.level")}</label>
        <input class="num" type="number" name="lvl" min="1" max="20" value="5"/>
      </div>
      <div class="grid">
        <div class="box">
          <h3>${L("CE.play.pool")}</h3>
          <div>${L("CE.play.max")}: <b class="out-max">—</b></div>
          <div>${L("CE.play.sr")}: <b class="out-sr">—</b></div>
          <div>${L("CE.play.lr")}: <b>full</b></div>
        </div>
        <div class="box">
          <h3>${L("CE.play.curve")}</h3>
          <div>1→9: ${[1,2,3,4,5,6,7,8,9].map(n=>`<code>${n}:${curve[n]}</code>`).join(" ")}</div>
        </div>
      </div>
      <h3>${L("CE.play.table")}</h3>
      <table>
        <thead><tr><th>Spell Lvl</th>${[1,2,3,4,5,6,7,8,9].map(n=>`<th>${n}</th>`).join("")}</tr></thead>
        <tbody><tr><th>Cost</th>${[1,2,3,4,5,6,7,8,9].map(n=>`<td class="c${n}">-</td>`).join("")}</tr></tbody>
      </table>
      <div class="ce-row" style="justify-content:flex-end;margin-top:.5rem">
        <button type="button" class="apply">${L("CE.play.apply")}</button>
      </div>
    `;
    const app = super.render(force, options);
    this.element[0].querySelector(".window-content").append(wrap);

    const refresh = ()=>{
      const cat = wrap.querySelector('select[name="cat"]').value;
      const lvl = clamp(Number(wrap.querySelector('input[name="lvl"]').value||1), 1, 20);
      const table = tableForCategory(cat);
      const max = table[lvl] || 0;
      const srFrac = (cat==="misc") ? (getSetting("warlockShortRestFraction") ?? 0.5)
                                    : (getSetting("shortRestFraction") ?? 0.25);
      const sr = Math.floor(max * srFrac);
      wrap.querySelector(".out-max").textContent = `${max}`;
      wrap.querySelector(".out-sr").textContent = `${sr}`;
      for (let n=1;n<=9;n++){
        const c = getSetting("costCurveParsed")[n] ?? 0;
        wrap.querySelector(`.c${n}`).textContent = c;
      }
    };
    wrap.querySelector('select[name="cat"]').addEventListener("change", refresh);
    wrap.querySelector('input[name="lvl"]').addEventListener("change", refresh);
    wrap.querySelector(".apply").addEventListener("click", async ()=>{
      const actor = canvas.tokens?.controlled?.[0]?.actor || game.user?.character;
      if (!actor) return ui.notifications.warn(L("CE.commands.selectFirst"));
      const cat = wrap.querySelector('select[name="cat"]').value;
      const lvl = clamp(Number(wrap.querySelector('input[name="lvl"]').value||1), 1, 20);
      await actor.setFlag(MOD_ID, "casterCategoryOverride", cat);
      const res = getResource(actor);
      const max = tableForCategory(cat)[lvl] ?? 0;
      await actor.update({ [`${res.path}.label`]: L("CE.ui.row.title"), [`${res.path}.max`]: max, [`${res.path}.value`]: Math.min(res.value ?? max, max) });
      ui.notifications.info(F("CE.play.applied",{cat:cat.toUpperCase(), lvl, max, name:actor.name}));
    });

    refresh();
    return app;
  }
}
globalThis.openCEPlayground = () => (new CEPlayground()).render(true);

/* =========================
   PATCH: charge CE inside use() and bypass slot validator
   ========================= */
Hooks.once("ready", () => {
  try {
    const ItemCls = CONFIG?.Item?.documentClass || game.items?.documentClass;
    if (!ItemCls || game.system.id !== "dnd5e") return;
    const _origUse = ItemCls.prototype.use;

    ItemCls.prototype.use = async function patchedUse(options = {}) {
      const isSpell = this?.type === "spell";
      const actor = this?.actor;
      const mustForce = isSpell && actor && (
        actor.getFlag(MOD_ID, "forceEA") || game.settings.get(MOD_ID, "forceEAByDefault")
      );
      if (!mustForce) return await _origUse.call(this, options);

      // never consume slot
      options = options ?? {};
      options.consumeSlot = false;
      if (options.consume !== undefined) options.consume = false;
      if (options.consumeUsage !== undefined) options.consumeUsage = false;
      if (options.consumeQuantity !== undefined) options.consumeQuantity = false;

      // charge CE here (before system validators)
      if (!_CE_CHARGING.has(this.id)) {
        const res = getResource(actor);
        const lvl = getCastLevel(options, this);
        let cost = costForSpell(this, lvl);
        if (cost<=0 && this.system.level===0 && getSetting("cantripCost")>0) cost = getSetting("cantripCost");
        if (cost>0){
          const curr = Number(res.value ?? 0);
          if (curr < cost){
            ui.notifications.warn(F("CE.cast.notEnough",{curr, cost, spell:this.name}));
            return; // cancel cast
          }
          await actor.update({ [`${res.path}.value`]: curr - cost, [`${res.path}.label`]: L("CE.ui.row.title") });
          ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: `<p>${F("CE.cast.spent",{actor:actor.name, cost, spell:this.name, left:(curr - cost), max:(res.max ?? "?")})}</p>` });
          _CE_CHARGING.add(this.id); // prevent double charge in hooks
        }
      }

      // temporarily "lend" one slot so dnd5e doesn't block
      const spells = actor?.system?.spells;
      const backup = {};
      if (spells) {
        for (let i = 1; i <= 9; i++) {
          const k = `spell${i}`;
          if (spells[k]) {
            backup[k] = { value: spells[k].value };
            spells[k].value = Math.max(Number(spells[k].value || 0), 1);
          }
        }
        if (spells.pact) {
          backup.pact = { value: spells.pact.value };
          spells.pact.value = Math.max(Number(spells.pact.value || 0), 1);
        }
      }

      try { return await _origUse.call(this, options); }
      finally {
        if (spells) {
          for (let i = 1; i <= 9; i++) { const k = `spell${i}`; if (backup[k] && spells[k]) spells[k].value = backup[k].value; }
          if (backup.pact && spells.pact) spells.pact.value = backup.pact.value;
        }
        _CE_CHARGING.delete(this.id);
      }
    };

    console.info("[cursed-energy] patched Item5e.prototype.use() with CE debit + slot bypass");
  } catch (e) {
    console.error("[cursed-energy] patch use() failed", e);
  }
});
