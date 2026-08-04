import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const realtimeService = {
  subscribeToOrders: (callback) => {
    const subscription = supabase
      .from('orders')
      .on('*', (payload) => {
        callback(payload);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  },

  reconnect: async () => {
    const { error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error reconnecting to Supabase:', error);
    }
  },

  handleReconnect: () => {
    window.addEventListener('online', () => {
      realtimeService.reconnect();
    });
  },
};

export default realtimeService;