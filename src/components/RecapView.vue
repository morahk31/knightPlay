<script setup lang="ts">
import { computed } from 'vue'
import { useCharactersStore } from '../stores/characters'
import { useRulesStore } from '../stores/rules'
import { ASPECTS, CARAC_LABELS } from '../rules/catalog'
import { armorStatus, effectiveCdf, effectiveOd, hasArmor } from '../rules/armor'
import { computeDerived, gaugeTotals } from '../rules/derived'
import { combatDefenses, findStyle } from '../rules/styles'
import { effectDescription, effectLabel } from '../rules/effects'
import { attackSummaries, recapAlerts, recapEffects } from '../rules/recap'
import { formatDice } from '../data/weapons'
import { OD_EFFECTS } from '../data/overdrives'
import { TOUS_AVANTAGES, TOUS_INCONVENIENTS } from '../data/creation'
import type { CaracId, GaugeId } from '../rules/types'

const emit = defineEmits<{ close: [] }>()

const store = useCharactersStore()
const rulesStore = useRulesStore()
const c = computed(() => store.active)
const rules = computed(() => store.rules)

const totals = computed(() => (c.value ? gaugeTotals(c.value, rules.value) : null))
const derived = computed(() => (c.value ? computeDerived(c.value, rules.value) : null))
const defenses = computed(() => (c.value ? combatDefenses(c.value, rules.value) : null))
const alerts = computed(() => (c.value ? recapAlerts(c.value, rules.value) : []))
const attacks = computed(() => (c.value ? attackSummaries(c.value, rules.value) : []))
const effects = computed(() => recapEffects(attacks.value, rulesStore.catalogs.effets))
const status = computed(() => (c.value ? armorStatus(c.value) : 'aucune'))
const style = computed(() => findStyle(c.value?.combat.style ?? 'standard'))

const GAUGES: { id: GaugeId; label: string; unit: string }[] = [
  { id: 'sante', label: 'Santé', unit: 'PS' },
  { id: 'armure', label: 'Armure', unit: 'PA' },
  { id: 'energie', label: 'Énergie', unit: 'PE' },
  { id: 'espoir', label: 'Espoir', unit: 'PEs' },
  { id: 'heroisme', label: 'Héroïsme', unit: 'pts' },
]

function percent(id: GaugeId): number {
  const total = totals.value?.[id] ?? 0
  return total > 0 ? Math.min(100, Math.round(((c.value?.jauges[id].actuel ?? 0) / total) * 100)) : 0
}

function gaugeLevel(id: GaugeId): string {
  if (id === 'heroisme') return ''
  const p = percent(id)
  if ((totals.value?.[id] ?? 0) === 0) return ''
  return p <= 25 ? 'low' : p <= 50 ? 'mid' : ''
}

/** Capacités de l'armure et modules qui ont un coût en énergie ou une activation. */
const capacites = computed(() => {
  if (!c.value) return []
  const caps = c.value.armure.capacites.map((cap) => ({
    nom: cap.nom, pe: cap.energie, activation: cap.activation, duree: cap.duree, effet: cap.effet, source: 'Armure',
  }))
  const mods = c.value.modules.map((m) => ({
    nom: m.niveau > 1 ? `${m.nom} (niv. ${m.niveau})` : m.nom,
    pe: m.energie === null ? '—' : `${m.energie} PE`,
    activation: m.activation, duree: m.duree, effet: m.effet, source: 'Module',
  }))
  return [...caps, ...mods]
})

/** OD effectifs et effets débloqués. */
const overdrives = computed(() => {
  const ch = c.value
  if (!ch) return []
  return ASPECTS.flatMap((a) => a.caracs)
    .map((k) => ({ carac: k, niveau: effectiveOd(ch, k, rules.value) }))
    .filter((o) => o.niveau > 0)
    .map((o) => ({ ...o, effets: OD_EFFECTS[o.carac].filter(([n]) => n <= o.niveau) }))
})

function norm(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'").toLowerCase().trim()
}
function traitEffet(nom: string, list: readonly { nom: string; effet: string }[]): string {
  return list.find((t) => norm(t.nom) === norm(nom))?.effet ?? ''
}

const nods = computed(() => c.value?.armure.nods ?? { energie: 0, armure: 0, soin: 0 })

function caracLine(k: CaracId): string {
  if (!c.value) return ''
  const od = effectiveOd(c.value, k, rules.value)
  return `${c.value.caracs[k].val}${od ? ` +${od}` : ''}`
}

function imprimer(): void {
  window.print()
}
</script>

<template>
  <article v-if="c && totals && derived && defenses" class="recap" data-testid="recap">
    <!-- En-tête -->
    <header class="recap-hero">
      <div class="recap-id">
        <h2 class="recap-name">{{ c.nom }}<span v-if="c.identite.surnom" class="recap-alias"> « {{ c.identite.surnom }} »</span></h2>
        <p class="recap-sub">
          <span v-if="c.identite.archetype">{{ c.identite.archetype }}</span>
          <span v-if="c.identite.blason"> · Blason {{ c.identite.blason }}</span>
          <span v-if="c.identite.section"> · {{ c.identite.section }}</span>
        </p>
        <p class="recap-badges">
          <span v-if="hasArmor(c)" class="badge" :class="status" data-testid="recap-armor">
            {{ c.armure.nom }} · {{ status === 'deployee' ? 'déployée' : 'repliée (Guardian)' }}
          </span>
          <span class="badge style" :title="style.description">Style {{ style.nom }}</span>
          <span class="badge">CdF {{ effectiveCdf(c, rules) }}</span>
        </p>
        <p v-if="c.motivations.majeure" class="recap-quote">« {{ c.motivations.majeure }} »</p>
      </div>
      <div class="recap-actions">
        <button type="button" data-testid="recap-print" @click="imprimer">🖨 Imprimer</button>
        <button type="button" class="primary" data-testid="recap-close" @click="emit('close')">Retour à la fiche</button>
      </div>
    </header>

    <!-- Alertes -->
    <section v-if="alerts.length" class="recap-alerts" aria-label="Alertes" data-testid="recap-alerts">
      <div v-for="a in alerts" :key="a.titre" class="recap-alert" :class="a.niveau" role="status">
        <strong>{{ a.titre }}</strong> {{ a.texte }}
      </div>
    </section>

    <!-- Jauges et défenses -->
    <section class="recap-vitals" aria-label="Jauges et défenses">
      <div v-for="g in GAUGES" :key="g.id" class="vital" :class="[`vital-${g.id}`, gaugeLevel(g.id)]" :data-testid="`recap-gauge-${g.id}`">
        <span class="vital-label">{{ g.label }}</span>
        <span class="vital-value">{{ c.jauges[g.id].actuel }}<small> / {{ totals[g.id] }}</small></span>
        <span class="vital-bar"><span :style="{ width: `${percent(g.id)}%` }"></span></span>
      </div>
      <div class="vital defense" data-testid="recap-defense">
        <span class="vital-label">Défense</span>
        <span class="vital-value">{{ defenses.defense }}</span>
        <small class="vital-note">contre le contact</small>
      </div>
      <div class="vital defense" data-testid="recap-reaction">
        <span class="vital-label">Réaction</span>
        <span class="vital-value">{{ defenses.reaction }}</span>
        <small class="vital-note">contre le tir</small>
      </div>
      <div class="vital defense">
        <span class="vital-label">Initiative</span>
        <span class="vital-value">{{ derived.initiative.value }}</span>
        <small class="vital-note">3D6 + score</small>
      </div>
      <div class="vital small">
        <span class="vital-label">Nods</span>
        <span class="vital-nods">⚡ {{ nods.energie }} · 🛡 {{ nods.armure }} · ✚ {{ nods.soin }}</span>
        <small class="vital-note">+{{ rules.armure.nodDes }}D6 · 1 action de déplacement</small>
      </div>
      <div class="vital small">
        <span class="vital-label">Contacts</span>
        <span class="vital-value">{{ derived.contactsMax.value }}</span>
      </div>
    </section>

    <!-- Attaques prêtes -->
    <section class="recap-block" aria-labelledby="recap-attacks">
      <h3 id="recap-attacks">⚔ Attaques</h3>
      <p class="hint">Jet pour toucher : base + meilleure combo, à <strong>dépasser</strong> (défense au contact, réaction au tir). Dégâts hors effets conditionnels.</p>
      <div class="attack-cards" data-testid="recap-attacks">
        <div v-for="(a, i) in attacks" :key="i" class="attack-card" :class="a.profil.type">
          <div class="attack-card-head">
            <strong>{{ a.arme }}</strong>
            <span class="chip">{{ a.profil.type === 'contact' ? 'contact' : a.profil.portee }}</span>
          </div>
          <div class="attack-roll">
            <span class="big">{{ a.des }}D</span><span v-if="a.auto" class="big auto">+{{ a.auto }}</span>
            <small>{{ CARAC_LABELS[a.base] }} + {{ CARAC_LABELS[a.combo] }}</small>
          </div>
          <div class="attack-dmg">
            <span class="dmg-label">Dégâts</span> <strong>{{ a.degats }}</strong>
          </div>
          <div class="attack-dmg">
            <span class="dmg-label">Violence</span> <strong>{{ a.violence }}</strong>
          </div>
          <p v-if="a.longbow" class="attack-note">⚡ {{ a.longbow }}</p>
          <div class="attack-effects">
            <span v-for="(e, k) in a.profil.effets" :key="k" class="chip" :title="effectDescription(e, rulesStore.catalogs.effets)">{{ effectLabel(e) }}</span>
          </div>
          <p class="attack-base muted">Arme : {{ formatDice(a.profil.degats) }} / {{ formatDice(a.profil.violence) }}</p>
        </div>
      </div>
    </section>

    <!-- Effets des armes -->
    <section v-if="effects.length" class="recap-block" aria-labelledby="recap-effects">
      <h3 id="recap-effects">📖 Effets des armes</h3>
      <dl class="recap-effects" data-testid="recap-effects">
        <div v-for="e in effects" :key="`${e.id}-${e.label}`" class="recap-effect">
          <dt>
            <strong>{{ e.valeurs.length ? `${e.label} ${e.valeurs.join(' / ')}` : e.label }}</strong>
            <span v-if="e.calcule" class="badge calcule">calculé</span>
            <span class="recap-effect-armes muted">{{ e.armes.join(' · ') }}</span>
          </dt>
          <dd>{{ e.description }}</dd>
        </div>
      </dl>
      <p class="hint">« calculé » : l’outil applique l’effet dans le panneau Attaquer (pas dans les dégâts ci-dessus).</p>
    </section>

    <div class="recap-columns">
      <!-- Capacités et modules -->
      <section class="recap-block" aria-labelledby="recap-caps">
        <h3 id="recap-caps">⚡ Capacités et modules</h3>
        <table class="recap-table" data-testid="recap-capacities">
          <thead><tr><th>Nom</th><th>Coût</th><th>Activation · durée</th></tr></thead>
          <tbody>
            <tr v-for="(cap, i) in capacites" :key="i" :title="cap.effet">
              <td><strong>{{ cap.nom }}</strong><div class="cap-effect">{{ cap.effet }}</div></td>
              <td class="cap-pe">{{ cap.pe }}</td>
              <td class="muted">{{ cap.activation }}<template v-if="cap.duree"> · {{ cap.duree }}</template></td>
            </tr>
            <tr v-if="!capacites.length"><td colspan="3" class="muted">Aucune capacité ni module.</td></tr>
          </tbody>
        </table>
      </section>

      <!-- Caractéristiques et OD -->
      <section class="recap-block" aria-labelledby="recap-caracs">
        <h3 id="recap-caracs">🎲 Caractéristiques</h3>
        <div class="recap-aspects">
          <div v-for="a in ASPECTS" :key="a.id" class="recap-aspect">
            <div class="recap-aspect-head">{{ a.nom }} <strong>{{ c.aspects[a.id] }}</strong></div>
            <div v-for="k in a.caracs" :key="k" class="recap-carac" :class="{ od: effectiveOd(c, k, rules) > 0 }">
              <span>{{ CARAC_LABELS[k] }}</span><strong>{{ caracLine(k) }}</strong>
            </div>
          </div>
        </div>
        <p class="hint">« +N » = overdrives : N réussites automatiques quand la caractéristique est dans le jet.</p>
        <ul v-if="overdrives.length" class="recap-od" data-testid="recap-od">
          <li v-for="o in overdrives" :key="o.carac">
            <strong>{{ CARAC_LABELS[o.carac] }} {{ o.niveau }}</strong>
            <span v-for="[n, e] in o.effets" :key="n" class="od-effect">niv. {{ n }} : {{ e }}</span>
            <span v-if="!o.effets.length" class="muted">réussites automatiques seulement</span>
          </li>
        </ul>
      </section>
    </div>

    <div class="recap-columns">
      <!-- Avantages, inconvénients, motivations -->
      <section class="recap-block" aria-labelledby="recap-traits">
        <h3 id="recap-traits">✦ Avantages et inconvénients</h3>
        <ul class="recap-traits">
          <li v-for="t in c.avantages" :key="`a-${t}`" class="plus"><strong>{{ t }}</strong> {{ traitEffet(t, TOUS_AVANTAGES) }}</li>
          <li v-for="t in c.inconvenients" :key="`i-${t}`" class="minus"><strong>{{ t }}</strong> {{ traitEffet(t, TOUS_INCONVENIENTS) }}</li>
          <li v-if="!c.avantages.length && !c.inconvenients.length" class="muted">Aucun.</li>
        </ul>
        <h4>Motivations</h4>
        <ul class="recap-traits">
          <li v-if="c.motivations.majeure" class="major"><strong>Majeure</strong> {{ c.motivations.majeure }}</li>
          <li v-for="m in c.motivations.mineures" :key="m">{{ m }}</li>
          <li v-if="c.identite.voeu"><strong>Vœu</strong> {{ c.identite.voeu }}</li>
        </ul>
      </section>

      <!-- Rappels de règles -->
      <section class="recap-block rules-memo" aria-labelledby="recap-rules">
        <h3 id="recap-rules">📜 Rappels de règles</h3>
        <div class="memo">
          <h4>Tests</h4>
          <p>Base + combo : <strong>chaque dé pair = 1 réussite</strong>, + OD automatiques. Il faut <strong>dépasser</strong> la difficulté.
            <strong>0 dé pair</strong> : échec critique. <strong>Tous pairs</strong> : exploit, on relance et on ajoute.
            Espoir sous {{ rules.systeme.seuilDesespoir }} : −1 dé par point manquant.</p>
        </div>
        <div class="memo">
          <h4>Difficultés</h4>
          <p class="memo-list"><span v-for="d in rules.systeme.difficultes" :key="d.value">{{ d.label }} <strong>{{ d.value }}</strong></span></p>
        </div>
        <div class="memo">
          <h4>Héroïsme</h4>
          <p><strong>1 pt</strong> : ignorer l’agonie (1 PS) · ignorer le dernier point d’espoir perdu · relancer un jet raté · dégâts ou violence au maximum · +1 caractéristique en combo.
            <strong>3 pts</strong> : carte du destin. <strong>6 pts</strong> : mode héroïque (+{{ rules.combat.modeHeroique === 'des' ? 'D6' : 'points' }} par réussite en trop, +5 PG).</p>
        </div>
        <div class="memo">
          <h4>Encaisser</h4>
          <p>Dégâts − <strong>CdF</strong> → <strong>PA</strong> (−1 PS par tranche de {{ rules.encaissement.tranchePa }} PA perdus) →
            {{ rules.encaissement.excedentApresPa === 'guardian' ? 'à 0 PA, l’armure se replie : reste sur la Guardian, puis les PS' : 'à 0 PA, l’armure se replie : reste sur les PS' }}.
            <em>Ignore armure</em> et <em>perce armure</em> touchent directement les PS.</p>
        </div>
        <div class="memo">
          <h4>Tour de jeu</h4>
          <p>1 action de combat + 1 action de déplacement (10 m), ou 2 déplacements. Initiative : 3D6 + score.
            Changer de style : 1 action de déplacement. Portées : contact &lt; 2 m · courte 15 m · moyenne 50 m · longue 300 m · lointaine au-delà.</p>
        </div>
        <div class="memo">
          <h4>Énergie</h4>
          <p>À 0 PE : plus de modules ni d’OD. Repos : +{{ rules.armure.rechargeParHeure }} PE par heure ; repliée {{ rules.armure.heuresRepliPlein }} h : plein.
            Nods : 3 de chaque par mission, +{{ rules.armure.nodDes }}D6.</p>
        </div>
      </section>
    </div>
  </article>
</template>
