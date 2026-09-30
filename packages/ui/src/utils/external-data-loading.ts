import { computed, ref } from 'vue'

export const createExternalDataLoadingGate = () => {
  const depth = ref(0)

  const isLoading = computed<boolean>({
    get: () => depth.value > 0,
    set: (value) => {
      if (value) {
        depth.value += 1
        return
      }

      depth.value = Math.max(0, depth.value - 1)
    },
  })

  return {
    isLoading,
    depth,
  }
}
