import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        const { plan_id } = await req.json()

        // Get the user from the authorization header
        const {
            data: { user },
        } = await supabaseClient.auth.getUser()

        if (!user) {
            throw new Error('User not authenticated')
        }

        // Fetch plan details
        const { data: plan, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('*')
            .eq('id', plan_id)
            .single()

        if (planError || !plan) {
            throw new Error('Plan not found')
        }

        // Get Instamojo credentials
        const API_KEY = Deno.env.get('INSTAMOJO_API_KEY')
        const AUTH_TOKEN = Deno.env.get('INSTAMOJO_AUTH_TOKEN')
        const IS_SANDBOX = Deno.env.get('INSTAMOJO_IS_SANDBOX') === 'true'

        if (!API_KEY || !AUTH_TOKEN) {
            console.error('Missing Instamojo keys');
            throw new Error('Server misconfiguration: Missing Instamojo keys');
        }

        console.log('Using Instamojo Config:', {
            sandbox: IS_SANDBOX,
            apiKeyPresent: !!API_KEY,
            tokenPresent: !!AUTH_TOKEN
        });

        const baseUrl = IS_SANDBOX
            ? 'https://test.instamojo.com/api/1.1/'
            : 'https://www.instamojo.com/api/1.1/';

        // Create Payment Request
        const payload = new URLSearchParams({
            purpose: `Subscription: ${plan.name}`,
            amount: plan.price.toString(),
            buyer_name: user.user_metadata.full_name || 'Gym Owner',
            email: user.email || '',
            phone: user.phone || '',
            redirect_url: 'gymdesk://payment-status', // Deep link to app
            webhook: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-webhook`,
            allow_repeated_payments: 'False',
        })

        console.log('Sending Payload:', payload.toString());

        const response = await fetch(`${baseUrl}payment-requests/`, {
            method: 'POST',
            headers: {
                'X-Api-Key': API_KEY!,
                'X-Auth-Token': AUTH_TOKEN!,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload,
        })

        const responseText = await response.text();
        console.log('Instamojo Response:', responseText);
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error('Invalid JSON response from Instamojo: ' + responseText);
        }

        if (!data.success) {
            console.error('Instamojo Error:', data)
            throw new Error(JSON.stringify(data.message) || 'Failed to create payment request')
        }

        // Create a pending subscription record
        const { error: subError } = await supabaseClient
            .from('owner_subscriptions')
            .insert({
                owner_id: user.id,
                plan_id: plan.id,
                payment_id: data.payment_request.id,
                amount: plan.price,
                status: 'pending',
                end_date: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString(), // Temporary end date
            })

        if (subError) {
            console.error('Database Error:', subError)
            // Don't fail the request if DB insert fails, but log it. 
            // Ideally we should probably fail, but the payment link is generated.
        }

        return new Response(
            JSON.stringify({
                payment_request: data.payment_request,
                url: data.payment_request.longurl
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
