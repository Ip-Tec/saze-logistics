// packages/shared/supabase/calls.ts
import { supabase } from './client';
import { Call } from '../types';

export const initiateCall = async (call: Omit<Call, 'id' | 'startTime' | 'status'>): Promise<Call> => {
    const { data, error } = await supabase
        .from('calls')
        .insert({
            ...call,
            status: 'initiated',
            start_time: new Date().toISOString()
        })
        .select('*')
        .single();

    if (error) throw error;
    return data as Call;
};

export const listenForCalls = (userId: string, callback: (call: Call) => void) => {
    return supabase
        .channel('calls')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'calls',
                filter: `receiver_id=eq.${userId}`
            },
            (payload) => callback(payload.new as Call)
        )
        .subscribe();
};