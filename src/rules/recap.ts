import { unarmedProfile } from '../data/weapons'
import { armorStatus, armorSystemsOnline, effectiveOd, hasArmor } from './armor'
import { CARAC_IDS } from './catalog'
import { DEFAULT_OPTIONS, DEFAULT_TARGET, describeParts, planAttack, planDamage } from './attack'
import { gaugeTotals } from './derived'
import { longbowCaps, longbowProfile } from './longbow'
import type { CaracId, Character, RulesConfig, WeaponProfile } from './types'

/** Synthèse de partie (page « Récap ») : tout est calculé par les moteurs de règles. */

export interface RecapAlert {
  niveau: 'danger' | 'warn' | 'info'
  titre: string
  texte: string
}

/** Situations à surveiller pendant la partie. */
export function recapAlerts(c: Character, rules: RulesConfig): RecapAlert[] {
  const alerts: RecapAlert[] = []
  const totals = gaugeTotals(c, rules)
  const espoir = c.jauges.espoir.actuel
  const seuil = rules.systeme.seuilDesespoir
  if (c.jauges.sante.actuel <= 0) {
    alerts.push({ niveau: 'danger', titre: 'Agonie', texte: 'Blessure aléatoire, ne peut que ramper. 1 point d’héroïsme : rester à 1 PS.' })
  }
  if (espoir <= 0) {
    alerts.push({ niveau: 'danger', titre: 'Plus d’espoir', texte: 'Le chevalier sombre dans le désespoir.' })
  } else if (espoir < seuil) {
    alerts.push({ niveau: 'danger', titre: 'Désespoir', texte: `−${seuil - espoir} dé${seuil - espoir > 1 ? 's' : ''} à tous les tests (espoir sous ${seuil}).` })
  }
  const status = armorStatus(c)
  if (status === 'repliee') {
    alerts.push({
      niveau: 'warn',
      titre: 'Armure repliée',
      texte: `Combinaison Guardian : ${c.armure.guardianPa}/${rules.armure.guardianPa} PA, CdF ${rules.armure.guardianCdf}. Ni capacité, ni module, ni OD de l’armure.`,
    })
  } else if (hasArmor(c) && !armorSystemsOnline(c, rules)) {
    alerts.push({ niveau: 'warn', titre: 'Plus d’énergie', texte: 'Modules et OD de l’armure inactifs. Nod d’énergie : +3D6 PE.' })
  } else if (hasArmor(c) && totals.energie > 0 && c.jauges.energie.actuel <= totals.energie / 4) {
    alerts.push({ niveau: 'info', titre: 'Énergie basse', texte: `${c.jauges.energie.actuel} PE sur ${totals.energie}.` })
  }
  if (hasArmor(c) && status === 'deployee' && totals.armure > 0 && c.jauges.armure.actuel <= totals.armure / 4) {
    alerts.push({ niveau: 'info', titre: 'Armure entamée', texte: `${c.jauges.armure.actuel} PA sur ${totals.armure}. Nod d’armure : +3D6 PA.` })
  }
  if (c.jauges.heroisme.actuel >= 6) {
    alerts.push({ niveau: 'info', titre: 'Mode héroïque disponible', texte: '6 points d’héroïsme : une fois par scène, pour un seul PJ.' })
  }
  return alerts
}

/** Meilleure caractéristique pour la combo (score, puis OD), différente de la base. */
export function bestCombo(c: Character, base: CaracId, rules: RulesConfig): CaracId {
  const score = (k: CaracId) => c.caracs[k].val * 100 + effectiveOd(c, k, rules)
  return CARAC_IDS.filter((k) => k !== base).reduce((best, k) => (score(k) > score(best) ? k : best))
}

export interface AttackSummary {
  arme: string
  profil: WeaponProfile
  base: CaracId
  combo: CaracId
  /** Dés à lancer pour toucher (style et désespoir compris). */
  des: number
  /** Réussites automatiques (OD). */
  auto: number
  degats: string
  violence: string
  /** Note propre au Longbow (PE). */
  longbow?: string
}

function summarize(c: Character, arme: string, profil: WeaponProfile, rules: RulesConfig): AttackSummary {
  const base: CaracId = profil.type === 'contact' ? 'combat' : 'tir'
  const combo = bestCombo(c, base, rules)
  const options = { ...DEFAULT_OPTIONS, style: c.combat.style }
  const plan = planAttack(
    c,
    { base, combo, extra: null, modDes: 0, modReussites: 0, avecOd: true, desSacrifies: 0, profile: profil, ameliorations: [], target: { ...DEFAULT_TARGET }, options },
    rules,
  )
  const dmg = planDamage(c, profil, { reussites: null, excedent: null, target: { ...DEFAULT_TARGET }, options, ameliorations: [] }, rules)
  return { arme, profil, base, combo, des: plan.test.des, auto: plan.test.auto, degats: describeParts(dmg.degats), violence: describeParts(dmg.violence) }
}

/** Attaques prêtes à lancer : chaque profil de chaque arme, puis les mains nues. */
export function attackSummaries(c: Character, rules: RulesConfig): AttackSummary[] {
  const out: AttackSummary[] = []
  for (const w of c.armes) {
    const lb = longbowProfile(c, w)
    if (lb) {
      const caps = longbowCaps(c, w)!
      const s = summarize(c, w.nom, lb, rules)
      s.longbow = `+1D6 par PE (${caps.boostMax} max) · portée +1 cran : 1 PE · effets ${caps.economie ? 'à −2 PE (min. 1)' : 'à 2 / 3 PE'}${caps.majeurs ? ' et 6 PE' : ''}`
      out.push(s)
      continue
    }
    for (const p of w.profils) out.push(summarize(c, w.profils.length > 1 ? `${w.nom} · ${p.nom}` : w.nom, p, rules))
  }
  out.push(summarize(c, 'Mains nues', unarmedProfile(hasArmor(c)), rules))
  return out
}
