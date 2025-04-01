// packages/shared/supabase/realtime.ts
import { supabase } from "./client";
import { Conversation, Message } from "../types";

export const subscribeToConversations = (userId: string, callback: (message: Message) => void) => {
    async function getUserConversationsIds(userId: string) {
        const {data} = await supabase
            .from('conversations')
            .select('id')
            .eq('participants', userId);
        return data?.map((conversation: Conversation) => conversation.id) || [];
    }

    return supabase
        .channel('conversations')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=in.(${getUserConversationsIds(userId)})`
            },
            (payload) => callback(payload.new as Message)
        )
        .subscribe();
};