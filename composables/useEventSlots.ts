export interface SlotDto {
  id: string
  eventDate: string
  startTime: string
  endTime: string
  capacity: number
  remaining: number
}

export function useEventSlots() {
  const { data, refresh, pending } = useFetch<SlotDto[]>('/api/slots', { key: 'slots' })
  return { slots: data, refreshSlots: refresh, pending }
}
