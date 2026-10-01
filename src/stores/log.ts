import { defineStore } from 'pinia'
import { computed } from 'vue'
import type { LogEntry } from '../rules/types'
import { useCharactersStore } from './characters'
import { newId } from './persistence'

/**
 * Journal des jets et actions du personnage actif.
 * Les entrées sont stockées dans le personnage (sauvegardées et exportées avec lui).
 */
export const useLogStore = defineStore('log', () => {
  const characters = useCharactersStore()

  const entries = computed<LogEntry[]>(() => characters.active?.journal ?? [])

  function add(entry: Omit<LogEntry, 'id' | 'at'>): LogEntry | null {
    const full: LogEntry = { id: newId(), at: new Date().toISOString(), ...entry }
    let added: LogEntry | null = null
    characters.mutateActive((c) => {
      c.journal.unshift(full)
      c.journal.splice(characters.rules.systeme.journalMax)
      added = full
    })
    return added
  }

  function clear(): void {
    characters.mutateActive((c) => {
      c.journal.splice(0)
    })
  }

  return { entries, add, clear }
})
