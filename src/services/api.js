import { supabase } from './supabase';

export const createPaymentRequest = async (planId) => {
    try {
        const { data, error } = await supabase.functions.invoke('create-payment', {
            body: { plan_id: planId },
        });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating payment request:', error);
        throw error;
    }
};

export const fetchSubscriptionPlans = async () => {
    try {
        const { data, error } = await supabase
            .from('subscription_plans')
            .select('*')
            .order('price', { ascending: true });

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching plans:', error);
        throw error;
    }
};

export const checkSubscriptionStatus = async (ownerId) => {
    try {
        const { data, error } = await supabase
            .from('owner_subscriptions')
            .select('*, subscription_plans(*)')
            .eq('owner_id', ownerId)
            .eq('status', 'active')
            .gt('end_date', new Date().toISOString())
            .order('end_date', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"
        return data;
    } catch (error) {
        console.error('Error checking subscription:', error);
        return null;
    }
};
