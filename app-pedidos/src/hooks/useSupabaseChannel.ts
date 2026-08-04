import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

const useSupabaseChannel = (channelName: string) => {
    const [messages, setMessages] = useState<any[]>([]);
    
    useEffect(() => {
        const channel = supabase.channel(channelName);

        const subscription = channel.on('broadcast', { event: 'new_message' }, (payload) => {
            setMessages((prevMessages) => [...prevMessages, payload]);
        }).subscribe();

        return () => {
            channel.unsubscribe();
        };
    }, [channelName]);

    return { messages };
};

export default useSupabaseChannel;