import { useCallback, useEffect, useState } from 'react';
import { createPublicBooking, getAvailableBookingSlots } from '../services/bookingService';

export function useBookingSlots(date, fallbackSlots) {
  const [state, setState] = useState({ slots: [], loading: false, error: null, source: 'idle' });

  const refetch = useCallback(() => {
    if (!date) {
      setState({ slots: [], loading: false, error: null, source: 'idle' });
      return Promise.resolve([]);
    }

    setState((current) => ({ ...current, loading: true, error: null }));
    return getAvailableBookingSlots(date, fallbackSlots).then((result) => {
      setState({
        slots: result.slots,
        loading: false,
        error: result.error,
        source: result.source
      });
      return result.slots;
    });
  }, [date, fallbackSlots]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}

export function useCreateBooking() {
  const [state, setState] = useState({ loading: false, error: null, booking: null });

  async function submit(payload) {
    if (state.loading) {
      return { ok: false, code: 'duplicate_submit', message: 'Booking is already being submitted.' };
    }

    setState({ loading: true, error: null, booking: null });
    const result = await createPublicBooking(payload);

    setState({
      loading: false,
      error: result.ok ? null : result,
      booking: result.ok ? result.booking : null
    });

    return result;
  }

  return { ...state, submit };
}
