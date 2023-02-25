import { Readable } from 'stream'

// chunks -> parts of the string -> every time we receive a value from the requisition it is stored in chunks
// 
async function buffer(readable: Readable){
    const chunks = [];

    for await (const chunk of readable){
        chunks.push(
            typeof chunk === "string" ? Buffer.from(chunk) : chunk 
            );
    }

    return Buffer.concat(chunks);
}

// Next has a default of getting values like json for requisitions
// disabling it to use the strings
export const config = {
    api: {
        bodyParser: false
    }
}

const relevantEvents = new Set([
    'checkout.session.completed',
    'customer.subscription.created',
    'customer.subscription.updated',
    'customer.subscription.deleted'
])

export default async (req: NextApiRequest, res: NextApiResponse) => {
    
    if (req.method === "POST"){
        // the requisition itself
        const buf = await buffer(req)
        const secret = req.headers['stripe-signature']

        let event: Stripe.Event;

        try{
            event = stripe.webhooks.constructEvent(buf, secret, process.env.STRIPE_WEBHOOK_SECRET)
        } catch (err) {
            return res.status(400).send('Webhook error: ${err.message}');
        }

        const type = event.type;

        if (relevantEvents.has(type)) {
            switch(type){
                case 'customer.subscription.created':
                case 'customer.subscription.updated':
                case ' customer.subscription.deleted':
                    const subscription = envent.data.object as Stripe.Subscription;

                    await saveSubscription(
                        subscription.id,
                        subscritpion.customer.toString(),
                        event.type === 'customer.subscription.created'
                    ); 

                    break;
                case 'checkout.session.completed':

                const checkoutSession = event.data.object as Stripe.Checkout.Session
                    await saveSubscription(
                        checkoutSession.subscription.toString(),
                        checkoutSession.customer.toString()
                        true
                    )
                    break;
                default:
                    throw new Error('Unhandled event.')
            } catch (err) {
                return res.json({ error: 'Webhook handler failed.' })
            }

        }

        res.jason({ received: true })

    } else {
        res.setHeader('Allow', "POST")
        res.status(405).end('Method not allowed.')
    }
}