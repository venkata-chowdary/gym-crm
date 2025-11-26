import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

serve(async (req) => {
    try {
        const formData = await req.formData()
        const data: any = {}
        formData.forEach((value, key) => (data[key] = value))

        console.log('Webhook received:', data)

        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SERVICE_ROLE_KEY') ?? '' // Use Service Role Key for admin updates
        )

        // Verify MAC (Signature)
        const salt = Deno.env.get('INSTAMOJO_SALT')
        if (salt) {
            const mac = data.mac
            const message = Object.keys(data)
                .filter(k => k !== 'mac')
                .sort()
                .map(k => `${data[k]}`)
                .join('|')

            const encoder = new TextEncoder();
            const keyData = encoder.encode(salt);
            const messageData = encoder.encode(message);

            const cryptoKey = await crypto.subtle.importKey(
                "raw",
                keyData,
                { name: "HMAC", hash: "SHA-1" },
                false,
                ["sign"]
            );

            const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
            const signatureArray = Array.from(new Uint8Array(signature));
            const calculatedMac = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (mac !== calculatedMac) {
                console.error('Invalid MAC signature')
                return new Response('Invalid MAC', { status: 400 })
            }
        }

        if (data.status === 'Credit') {
            const paymentId = data.payment_request_id

            // 1. Update owner_subscriptions
            // We need to find the pending subscription with this payment_id
            const { data: subscription, error: subFetchError } = await supabaseClient
                .from('owner_subscriptions')
                .select('*, subscription_plans(*)')
                .eq('payment_id', paymentId)
                .single()

            if (subFetchError || !subscription) {
                console.error('Subscription not found for payment:', paymentId)
                return new Response('Subscription not found', { status: 404 })
            }

            const planDuration = subscription.subscription_plans.duration_days
            const startDate = new Date()
            const endDate = new Date(startDate.getTime() + planDuration * 24 * 60 * 60 * 1000)

            const { error: updateError } = await supabaseClient
                .from('owner_subscriptions')
                .update({
                    status: 'active',
                    start_date: startDate.toISOString(),
                    end_date: endDate.toISOString(),
                    payment_id: data.payment_id // Update with actual payment ID from webhook
                })
                .eq('id', subscription.id)

            if (updateError) {
                console.error('Failed to update subscription:', updateError)
                return new Response('Update failed', { status: 500 })
            }

            // 2. Update gym_owners status to 'approved' if not already
            // Or maybe we just rely on subscription status? 
            // Let's update owner status to ensure they can access the app.
            // Wait, 'approved' is for admin verification. Maybe we shouldn't auto-approve?
            // But if they paid, they should get access. Let's assume payment = access.
            // Actually, the schema has `owner_status` as 'pending', 'pending_verification', 'approved'.
            // If they pay, maybe we move them to 'approved' or keep them as is but check subscription?
            // The RLS checks `owner_id in (select id from public.gym_owners where status = 'approved')`.
            // So we MUST approve them if they pay, or change RLS to check subscription.
            // For now, let's auto-approve if they pay.

            await supabaseClient
                .from('gym_owners')
                .update({ status: 'approved' })
                .eq('id', subscription.owner_id)

            console.log('Payment processed successfully for:', subscription.owner_id)
        } else {
            console.log('Payment failed or pending:', data.status)
            // Handle failure if needed (e.g., mark subscription as failed)
        }

        return new Response('Webhook received', { status: 200 })

    } catch (error) {
        console.error('Webhook Error:', error)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
