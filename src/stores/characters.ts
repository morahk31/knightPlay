import { defineStore } from 'pinia'
import { useRulesStore } from './rules'
import { computed, ref, watch } from 'vue'
import type {
  ArmorState,
  AspectId,
  CaracId,
  Character,
  InstalledModule,
  OwnedWeapon,
  ProgressionState,
  StyleId,
  TransactionKind,
  TransactionSnapshot,
  WeaponProfile,
  DerivedId,
  DerivedSource,
  GaugeId,
  RulesConfig,
  SourcedDerivedId,
} from '../rules/types'
import { blankSheet } from '../rules/catalog'
import { clampGauges, gaugeTotals } from '../rules/derived'
import { CUSTOM_ARMOR, NO_ARMOR, SLOT_LABELS, armorFromDef, moduleFromDef, noArmor, slotOverflow } from '../rules/armor'
import {
  foldRestEnergy,
  resetNods,
  restEnergy,
  spendEnergy,
  useNod as applyNod,
  type EnergyResult,
  type NodKind,
} from '../rules/energy'
import { moduleCostToLevel } from '../data/modules'
import {
  checkAspect,
  checkCarac,
  checkOd,
  checkPurchase,
  type UpgradeCheck,
} from '../rules/progression'
import { applySoak, restoreSoakState, soak, type IncomingHit, type SoakResult, type SoakState } from '../rules/soak'
import { defaultRules } from '../config/defaultRules'
import {
  getBrowserStorage,
  loadState,
  newId,
  saveState,
  type KeyValueStorage,
  type PersistedState,
} from './persistence'

/** Délai de regroupement des sauvegardes automatiques (ms). */
export const SAVE_DEBOUNCE_MS = 300

export const DEFAULT_CHARACTER_NAME = 'Nouveau chevalier'

export function createCharacter(nom = DEFAULT_CHARACTER_NAME, rules: RulesConfig = defaultRules): Character {
  const now = new Date().toISOString()
  return { id: newId(), nom, createdAt: now, updatedAt: now, ...blankSheet(rules) }
}

/** Entier positif ou nul (les saisies vides ou invalides valent 0). */
function toNonNegativeInt(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0
}

export const useCharactersStore = defineStore('characters', () => {
  const rulesStore = useRulesStore()
  /** Règles effectives : référentiel + règles maison. */
  const rules = computed<RulesConfig>(() => rulesStore.effective)
  const findArmor = (id: string) => rulesStore.catalogs.armures.find((a) => a.id === id)
  const findModule = (id: string) => rulesStore.catalogs.modules.find((m) => m.id === id)
  const findWeapon = (id: string) => rulesStore.catalogs.armes.find((w) => w.id === id)
  const characters = ref<Character[]>([])
  const activeId = ref<string | null>(null)
  const storageWarning = ref<string | null>(null)

  let storage: KeyValueStorage | null = null
  let saveTimer: ReturnType<typeof setTimeout> | null = null
  let initialized = false

  const active = computed(() => characters.value.find((c) => c.id === activeId.value) ?? null)

  function snapshot(): PersistedState {
    return {
      version: 1,
      characters: JSON.parse(JSON.stringify(characters.value)) as Character[],
      activeId: activeId.value,
    }
  }

  /** Écrit immédiatement l'état (utilisé à la fermeture de la page et dans les tests). */
  function flush(): void {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = null
    }
    if (!storage) return
    if (!saveState(snapshot(), storage)) {
      storageWarning.value =
        'La sauvegarde automatique a échoué (stockage plein ou refusé). Exportez vos personnages.'
    }
  }

  function scheduleSave(): void {
    if (!storage) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, SAVE_DEBOUNCE_MS)
  }

  /**
   * Charge les personnages et active la sauvegarde automatique.
   * Crée un premier personnage si aucun n'existe.
   */
  function init(customStorage?: KeyValueStorage | null): void {
    if (initialized) return
    initialized = true
    rulesStore.init(customStorage)
    storage = customStorage === undefined ? getBrowserStorage() : customStorage
    const result = loadState(storage)
    characters.value = result.state.characters
    activeId.value = result.state.activeId
    storageWarning.value = result.warning ?? null
    if (!result.storageAvailable) storage = null
    if (characters.value.length === 0) create()
    watch([characters, activeId], scheduleSave, { deep: true })
  }

  function touch(character: Character): void {
    character.updatedAt = new Date().toISOString()
  }

  function create(nom?: string): Character {
    const character = createCharacter(nom, rules.value)
    characters.value.push(character)
    activeId.value = character.id
    return character
  }

  function select(id: string): void {
    if (characters.value.some((c) => c.id === id)) activeId.value = id
  }

  function rename(id: string, nom: string): void {
    const character = characters.value.find((c) => c.id === id)
    const trimmed = nom.trim()
    if (!character || trimmed === '') return
    character.nom = trimmed
    touch(character)
  }

  function duplicate(id: string): Character | null {
    const source = characters.value.find((c) => c.id === id)
    if (!source) return null
    const now = new Date().toISOString()
    const copy: Character = {
      ...(JSON.parse(JSON.stringify(source)) as Character),
      id: newId(),
      nom: `${source.nom} (copie)`,
      createdAt: now,
      updatedAt: now,
    }
    characters.value.push(copy)
    activeId.value = copy.id
    return copy
  }

  function remove(id: string): void {
    const index = characters.value.findIndex((c) => c.id === id)
    if (index === -1) return
    characters.value.splice(index, 1)
    if (activeId.value === id) {
      activeId.value = characters.value[Math.min(index, characters.value.length - 1)]?.id ?? null
    }
    if (characters.value.length === 0) create()
  }

  /** Applique une modification au personnage actif, puis met à jour sa date. */
  function mutateActive(mutator: (c: Character) => void): void {
    const character = active.value
    if (!character) return
    mutator(character)
    touch(character)
  }

  function setAspect(aspect: AspectId, value: number): void {
    mutateActive((c) => {
      c.aspects[aspect] = toNonNegativeInt(value)
    })
  }

  function setCarac(carac: CaracId, field: 'val' | 'od', value: number): void {
    mutateActive((c) => {
      c.caracs[carac][field] = toNonNegativeInt(value)
      clampGauges(c, rules.value)
    })
  }

  function setGauge(gauge: GaugeId, actuel: number): void {
    mutateActive((c) => {
      c.jauges[gauge].actuel = toNonNegativeInt(actuel)
      clampGauges(c, rules.value)
    })
  }

  function adjustGauge(gauge: GaugeId, delta: number): void {
    const character = active.value
    if (character) setGauge(gauge, character.jauges[gauge].actuel + delta)
  }

  /** Total manuel (armure et énergie, avant la phase 4). */
  function setGaugeTotal(gauge: 'armure' | 'energie', total: number): void {
    mutateActive((c) => {
      c.jauges[gauge].total = toNonNegativeInt(total)
      clampGauges(c, rules.value)
    })
  }

  function setDerivedSource(id: SourcedDerivedId, source: DerivedSource): void {
    mutateActive((c) => {
      c.derivedSource[id] = source
      clampGauges(c, rules.value)
    })
  }

  function setOverride(id: DerivedId, value: number | null): void {
    mutateActive((c) => {
      if (value === null || !Number.isFinite(value)) delete c.overrides[id]
      else c.overrides[id] = toNonNegativeInt(value)
      clampGauges(c, rules.value)
    })
  }

  function setBonus(kind: 'sante' | 'espoir', value: number): void {
    mutateActive((c) => {
      c.bonus[kind] = Number.isFinite(value) ? Math.trunc(value) : 0
      clampGauges(c, rules.value)
    })
  }

  /** Remet les jauges santé et espoir à leur maximum (repos à Camelot). */
  function restoreGauge(gauge: GaugeId): void {
    const character = active.value
    if (character) setGauge(gauge, gaugeTotals(character, rules.value)[gauge])
  }

  // --- Méta-armure, modules, énergie (phase 4) ---

  /** Choisit une armure du catalogue (ou aucune / personnalisée) et remplit les jauges. */
  function setArmorModel(modele: string): void {
    mutateActive((c) => {
      if (modele === NO_ARMOR) {
        c.armure = noArmor(rules.value)
      } else if (modele === CUSTOM_ARMOR) {
        c.armure = { ...c.armure, modele: CUSTOM_ARMOR, nom: c.armure.nom || 'Armure personnalisée', aVerifier: false }
      } else {
        const def = findArmor(modele)
        if (!def) return
        c.armure = armorFromDef(def, rules.value)
      }
      const totals = gaugeTotals(c, rules.value)
      c.jauges.armure.actuel = totals.armure
      c.jauges.energie.actuel = totals.energie
    })
  }

  /** Modifie une valeur de l'armure (PA, PE, CdF, slots, OD…). */
  function updateArmor(patch: Partial<ArmorState>): void {
    mutateActive((c) => {
      Object.assign(c.armure, patch)
      clampGauges(c, rules.value)
    })
  }

  function setArmorOd(carac: CaracId, value: number): void {
    mutateActive((c) => {
      const v = toNonNegativeInt(value)
      if (v === 0) delete c.armure.od[carac]
      else c.armure.od[carac] = v
    })
  }

  function setPgTotal(value: number): void {
    mutateActive((c) => {
      c.progression.pgTotal = toNonNegativeInt(value)
    })
  }

  /**
   * Installe un module du catalogue. Refuse si les slots manquent, sauf règle maison
   * ou ajout forcé. Renvoie les zones en dépassement.
   */
  function addModule(moduleId: string, niveau = 1, force = false): { ok: boolean; overflow: string[] } {
    const def = findModule(moduleId)
    const character = active.value
    if (!def || !character) return { ok: false, overflow: [] }
    const installed = moduleFromDef(def, niveau, newId())
    const overflow = slotOverflow(character, installed.slots)
    if (overflow.length && !force && !rules.value.armure.depassementSlots) return { ok: false, overflow }
    mutateActive((c) => {
      c.modules.push(installed)
      clampGauges(c, rules.value)
    })
    return { ok: true, overflow }
  }

  function addCustomModule(nom: string): void {
    mutateActive((c) => {
      c.modules.push({
        uid: newId(),
        moduleId: null,
        nom: nom.trim() || 'Module personnalisé',
        niveau: 1,
        slots: {},
        energie: null,
        activation: '',
        duree: '',
        effet: '',
      })
    })
  }

  function updateModule(uid: string, patch: Partial<InstalledModule>): void {
    mutateActive((c) => {
      const m = c.modules.find((x) => x.uid === uid)
      if (!m) return
      Object.assign(m, patch)
      clampGauges(c, rules.value)
    })
  }

  /** Change le niveau d'un module du catalogue en reprenant son effet. */
  function setModuleLevel(uid: string, niveau: number): void {
    mutateActive((c) => {
      const index = c.modules.findIndex((x) => x.uid === uid)
      const current = c.modules[index]
      const def = current?.moduleId ? findModule(current.moduleId) : undefined
      if (!current) return
      if (!def) {
        current.niveau = Math.max(1, toNonNegativeInt(niveau))
        return
      }
      c.modules[index] = { ...moduleFromDef(def, niveau, current.uid), slots: current.slots }
      clampGauges(c, rules.value)
    })
  }

  function removeModule(uid: string): void {
    mutateActive((c) => {
      c.modules = c.modules.filter((m) => m.uid !== uid)
      clampGauges(c, rules.value)
    })
  }

  /** Dépense de l'énergie (activation d'une capacité ou d'un module). */
  function spend(cost: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = spendEnergy(c, cost)
    })
    return result
  }

  function nod(kind: NodKind, value: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = applyNod(c, kind, value, { sante: gaugeTotals(c, rules.value).sante })
    })
    return result
  }

  function rest(hours: number): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = restEnergy(c, hours, rules.value)
    })
    return result
  }

  function foldRest(): EnergyResult {
    let result: EnergyResult = { ok: false, amount: 0 }
    mutateActive((c) => {
      result = foldRestEnergy(c)
    })
    return result
  }

  function newMission(): void {
    mutateActive((c) => resetNods(c, rules.value))
  }

  // --- Armes et combat (phase 5) ---

  /** Ajoute une arme du catalogue au rack ; refuse si le rack est plein. */
  function addWeapon(weaponId: string): boolean {
    const def = findWeapon(weaponId)
    const c = active.value
    if (!def || !c || c.armes.length >= rules.value.combat.rackMax) return false
    mutateActive((x) => {
      x.armes.push({
        uid: newId(),
        weaponId: def.id,
        nom: def.nom,
        profils: JSON.parse(JSON.stringify(def.profils)) as WeaponProfile[],
        ameliorations: [],
        notes: def.notes ?? '',
      })
    })
    return true
  }

  function addCustomWeapon(nom: string, type: 'contact' | 'distance'): boolean {
    const c = active.value
    if (!c || c.armes.length >= rules.value.combat.rackMax) return false
    mutateActive((x) => {
      x.armes.push({
        uid: newId(),
        weaponId: null,
        nom: nom.trim() || 'Arme personnalisée',
        profils: [
          {
            nom: type === 'contact' ? 'Contact' : 'Tir',
            type,
            degats: { des: 2, fixe: 0 },
            violence: { des: 1, fixe: 0 },
            portee: type === 'contact' ? 'contact' : 'moyenne',
            effets: [],
          },
        ],
        ameliorations: [],
        notes: '',
      })
    })
    return true
  }

  function updateWeapon(uid: string, patch: Partial<Omit<OwnedWeapon, 'uid'>>): void {
    mutateActive((c) => {
      const w = c.armes.find((x) => x.uid === uid)
      if (w) Object.assign(w, patch)
    })
  }

  function updateWeaponProfile(uid: string, index: number, patch: Partial<WeaponProfile>): void {
    mutateActive((c) => {
      const profile = c.armes.find((x) => x.uid === uid)?.profils[index]
      if (profile) Object.assign(profile, patch)
    })
  }

  function toggleWeaponUpgrade(uid: string, upgradeId: string): void {
    mutateActive((c) => {
      const w = c.armes.find((x) => x.uid === uid)
      if (!w) return
      w.ameliorations = w.ameliorations.includes(upgradeId)
        ? w.ameliorations.filter((id) => id !== upgradeId)
        : [...w.ameliorations, upgradeId]
    })
  }

  function removeWeapon(uid: string): void {
    mutateActive((c) => {
      c.armes = c.armes.filter((w) => w.uid !== uid)
    })
  }

  function setStyle(style: StyleId): void {
    mutateActive((c) => {
      c.combat.style = style
    })
  }

  // --- Encaisser (phase 6) ---

  /** État avant le dernier encaissement, pour l'annuler (non sauvegardé). */
  const lastSoak = ref<{ characterId: string; state: SoakState } | null>(null)

  /** Calcule et applique une attaque reçue. */
  function takeHit(hit: IncomingHit): SoakResult | null {
    const c = active.value
    if (!c) return null
    const result = soak(c, hit, rules.value)
    lastSoak.value = { characterId: c.id, state: result.before }
    mutateActive((x) => applySoak(x, result))
    return result
  }

  /** Annule le dernier encaissement du personnage actif. */
  function undoSoak(): boolean {
    const last = lastSoak.value
    if (!last || last.characterId !== activeId.value) return false
    mutateActive((c) => restoreSoakState(c, last.state))
    lastSoak.value = null
    return true
  }

  /** Point d'héroïsme : ignorer la mise à l'agonie et rester à 1 PS (fiche 05). */
  function ignoreAgony(): boolean {
    const c = active.value
    if (!c || c.jauges.sante.actuel > 0 || c.jauges.heroisme.actuel < 1) return false
    mutateActive((x) => {
      x.jauges.heroisme.actuel -= 1
      x.jauges.sante.actuel = 1
    })
    lastSoak.value = null
    return true
  }

  // --- Progression : PX, PG et historique (phase 7) ---

  function snapshotOf(c: Character): TransactionSnapshot {
    const { historique: _historique, ...progression } = c.progression
    return JSON.parse(JSON.stringify({ aspects: c.aspects, caracs: c.caracs, modules: c.modules, armes: c.armes, progression }))
  }

  /**
   * Exécute un changement de progression et l'inscrit dans l'historique.
   * Les variations de PX et de PG sont appliquées après `change`.
   */
  function transact(
    kind: TransactionKind,
    libelle: string,
    delta: { px?: number; pg?: number; pgTotal?: number; pxTotal?: number },
    change: (c: Character) => void,
    outrepasse = false,
  ): void {
    const c = active.value
    if (!c) return
    const avant = snapshotOf(c)
    change(c)
    mutateActive((x) => {
      const p = x.progression
      p.pxActuel += delta.px ?? 0
      p.pxTotal += delta.pxTotal ?? 0
      p.pgSolde += delta.pg ?? 0
      p.pgTotal = Math.max(0, p.pgTotal + (delta.pgTotal ?? 0))
      p.historique.unshift({
        id: newId(),
        at: new Date().toISOString(),
        kind,
        libelle,
        px: delta.px ?? 0,
        pg: delta.pg ?? 0,
        pgTotal: delta.pgTotal ?? 0,
        ...(outrepasse ? { outrepasse: true } : {}),
        avant,
      })
    })
  }

  /** Fin de mission : PX et PG gagnés (actuels et totaux), aspects de nouveau augmentables. */
  function endMission(libelle: string, px: number, pg: number): void {
    const gainPx = toNonNegativeInt(px)
    const gainPg = toNonNegativeInt(pg)
    transact('mission', libelle.trim() || 'Fin de mission', { px: gainPx, pxTotal: gainPx, pg: gainPg, pgTotal: gainPg }, () =>
      mutateActive((x) => {
        x.progression.aspectsMission = []
      }),
    )
  }

  /** Applique un achat si le contrôle le permet (ou s'il est forcé et forçable). */
  function attempt(check: UpgradeCheck, force: boolean, kind: TransactionKind, change: (c: Character) => void): UpgradeCheck {
    if (!check.ok && !(force && check.forcable)) return check
    const cost = { px: check.devise === 'PX' ? -check.cout : 0, pg: check.devise === 'PG' ? -check.cout : 0 }
    const libelle = kind === 'module' || kind === 'arme' || kind === 'achat' ? check.libelle : `${check.libelle} ${check.de} → ${check.vers}`
    transact(kind, libelle, cost, change, !check.ok)
    return check
  }

  function buyAspect(aspect: AspectId, force = false): UpgradeCheck | null {
    const c = active.value
    if (!c) return null
    return attempt(checkAspect(c, aspect, rules.value), force, 'aspect', () =>
      mutateActive((x) => {
        x.aspects[aspect] += 1
        if (!x.progression.aspectsMission.includes(aspect)) x.progression.aspectsMission.push(aspect)
        clampGauges(x, rules.value)
      }),
    )
  }

  function buyCarac(carac: CaracId, force = false): UpgradeCheck | null {
    const c = active.value
    if (!c) return null
    return attempt(checkCarac(c, carac, rules.value), force, 'carac', () =>
      mutateActive((x) => {
        x.caracs[carac].val += 1
        clampGauges(x, rules.value)
      }),
    )
  }

  function buyOd(carac: CaracId, force = false): UpgradeCheck | null {
    const c = active.value
    if (!c) return null
    return attempt(checkOd(c, carac, rules.value), force, 'od', () =>
      mutateActive((x) => {
        x.caracs[carac].od += 1
        clampGauges(x, rules.value)
      }),
    )
  }

  /** Achète et installe un module (coût cumulé jusqu'au niveau voulu). */
  function buyModule(moduleId: string, niveau: number, force = false): UpgradeCheck | null {
    const c = active.value
    const def = findModule(moduleId)
    if (!c || !def) return null
    const level = Math.min(Math.max(1, Math.trunc(niveau)), def.niveaux.length)
    const dispo = def.niveaux[level - 1]!.dispo
    const check = checkPurchase(c, `${def.nom} niv. ${level}`, moduleCostToLevel(def, level), dispo, rules.value)
    const overflow = slotOverflow(c, def.slots)
    if (overflow.length && !rules.value.armure.depassementSlots) {
      check.raisons.unshift({ texte: `Slots insuffisants : ${overflow.map((z) => SLOT_LABELS[z]).join(', ')}`, bloquant: false })
      check.ok = false
      check.forcable = check.raisons.every((r) => !r.bloquant)
    }
    return attempt(check, force, 'module', () => {
      addModule(moduleId, level, true)
    })
  }

  /** Achète une arme et la range dans le rack. */
  function buyWeapon(weaponId: string, force = false): UpgradeCheck | null {
    const c = active.value
    const def = findWeapon(weaponId)
    if (!c || !def) return null
    const check = checkPurchase(c, def.nom, def.pg, def.dispo, rules.value)
    if (c.armes.length >= rules.value.combat.rackMax) {
      check.raisons.unshift({ texte: `Rack plein (${rules.value.combat.rackMax} armes)`, bloquant: true })
      check.ok = false
      check.forcable = false
    }
    return attempt(check, force, 'arme', () => {
      addWeapon(weaponId)
    })
  }

  /** Autre achat en PG (implant, thérapie, amélioration…). */
  function buyOther(libelle: string, cout: number, force = false): UpgradeCheck | null {
    const c = active.value
    if (!c) return null
    return attempt(checkPurchase(c, libelle.trim() || 'Achat', cout, 'standard', rules.value), force, 'achat', () => {})
  }

  /** Correction manuelle des compteurs, tracée dans l'historique. */
  function adjustProgression(field: 'pxActuel' | 'pxTotal' | 'pgSolde' | 'pgTotal', value: number): void {
    const c = active.value
    if (!c) return
    const v = toNonNegativeInt(value)
    const diff = v - c.progression[field]
    if (!diff) return
    const labels: Record<typeof field, string> = { pxActuel: 'PX actuels', pxTotal: 'PX totaux', pgSolde: 'PG disponibles', pgTotal: 'PG totaux' }
    const delta = { pxActuel: { px: diff }, pxTotal: { pxTotal: diff }, pgSolde: { pg: diff }, pgTotal: { pgTotal: diff } }[field]
    transact('ajustement', `Ajustement ${labels[field]} : ${c.progression[field]} → ${v}`, delta, () => {})
  }

  /** Annule la dernière transaction : valeurs et soldes d'avant. */
  function undoTransaction(): boolean {
    const c = active.value
    const last = c?.progression.historique[0]
    if (!c || !last) return false
    mutateActive((x) => {
      const historique = x.progression.historique.slice(1)
      const avant = JSON.parse(JSON.stringify(last.avant)) as TransactionSnapshot
      x.aspects = avant.aspects
      x.caracs = avant.caracs
      x.modules = avant.modules
      x.armes = avant.armes
      x.progression = { ...(avant.progression as Omit<ProgressionState, 'historique'>), historique }
      clampGauges(x, rules.value)
    })
    return true
  }

  function setArmorEtat(etat: 'deployee' | 'repliee'): void {
    mutateActive((c) => {
      c.armure.etat = etat
    })
  }

  /** Active (ou désactive avec `null`) un type de la Warrior. */
  function setWarriorType(type: AspectId | null): void {
    mutateActive((c) => {
      c.armure.warriorType = type
    })
  }

  /** Ajoute un personnage importé (déjà validé et normalisé) et le sélectionne. */
  function addImported(character: Character): void {
    characters.value.push(character)
    activeId.value = character.id
  }

  return {
    rules,
    characters,
    activeId,
    active,
    storageWarning,
    init,
    flush,
    create,
    select,
    rename,
    duplicate,
    remove,
    addImported,
    mutateActive,
    setAspect,
    setCarac,
    setGauge,
    adjustGauge,
    setGaugeTotal,
    setDerivedSource,
    setOverride,
    setBonus,
    restoreGauge,
    setArmorModel,
    updateArmor,
    setArmorOd,
    setPgTotal,
    addModule,
    addCustomModule,
    updateModule,
    setModuleLevel,
    removeModule,
    spend,
    nod,
    rest,
    foldRest,
    newMission,
    setArmorEtat,
    setWarriorType,
    addWeapon,
    addCustomWeapon,
    updateWeapon,
    updateWeaponProfile,
    toggleWeaponUpgrade,
    removeWeapon,
    setStyle,
    lastSoak,
    takeHit,
    undoSoak,
    ignoreAgony,
    endMission,
    buyAspect,
    buyCarac,
    buyOd,
    buyModule,
    buyWeapon,
    buyOther,
    adjustProgression,
    undoTransaction,
  }
})
