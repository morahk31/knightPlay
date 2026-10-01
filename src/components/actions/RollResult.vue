<script setup lang="ts">
import { computed } from 'vue'
import type { TestResult } from '../../rules/test'

const props = defineProps<{ result: TestResult }>()

const verdict = computed(() => {
  const r = props.result
  if (r.critique) return { cls: 'critique', text: 'ÉCHEC CRITIQUE' }
  if (r.reussi === true) return { cls: 'reussite', text: r.exploit ? 'RÉUSSI · EXPLOIT' : 'RÉUSSI' }
  if (r.reussi === false) return { cls: 'echec', text: r.exploit ? 'RATÉ (malgré l’exploit)' : 'RATÉ' }
  return { cls: 'info', text: r.exploit ? `${r.total} réussites · EXPLOIT` : `${r.total} réussites` }
})
</script>

<template>
  <div class="roll-result" :class="verdict.cls" data-testid="roll-result">
    <div v-if="result.faces" class="faces" data-testid="roll-faces">
      <span v-for="(f, i) in result.faces" :key="i" class="die" :class="{ even: f % 2 === 0 }">{{ f }}</span>
    </div>
    <div v-if="result.facesExploit" class="faces exploit" data-testid="roll-faces-exploit">
      <span class="exploit-label">Exploit</span>
      <span v-for="(f, i) in result.facesExploit" :key="i" class="die" :class="{ even: f % 2 === 0 }">{{ f }}</span>
    </div>
    <p class="sum" data-testid="roll-sum">
      {{ result.reussitesDes }} aux dés
      <template v-if="result.exploit"> + {{ result.reussitesExploit }} (exploit)</template>
      <template v-if="result.plan.auto"> + {{ result.plan.auto }} auto</template>
      = <strong data-testid="roll-total">{{ result.total }}</strong>
      <template v-if="result.plan.input.difficulte !== null"> contre {{ result.plan.input.difficulte }}</template>
    </p>
    <p class="verdict" data-testid="roll-verdict">{{ verdict.text }}</p>
  </div>
</template>
