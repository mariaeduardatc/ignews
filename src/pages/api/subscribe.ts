import { NextApiRequest, NextApiResponse } from "next";
import { query as q } from 'faunadb'
import {getSession} from 'next-auth/react'
import { fauna } from "../../services/fauna";
import { stripe } from "../../services/stripe";

type User = {
    ref: {
        id: string;
    }
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
    if(req.method === 'POST'){
        // we have to create a 'costumer' inside the stripe database
        // getting cookies
        const session = await getSession({ req })

        // no repeated costumers
        const user = await fauna.query<User>(
            q.Get(
                q.Match(
                    q.Index(
                        'user_by_email'
                    ),
                    q.Casefold(session!.user!.email!)
                )
            )
        )

        const stripeCustomer = await stripe.customers.create({
            email: session!.user!.email!,
            //metadata
        })

        // no repeated costumers
        await fauna.query(
            q.Update(
                q.Ref(q.Collection('users'),user.ref.id),
                {
                    data:{
                        stripe_customer_id: stripeCustomer.id,
                    }
                }
            )
        )

        const stripeCheckoutSession = await stripe.checkout.sessions.create({
            customer:stripeCustomer.id, // id in stripe
            payment_method_types: ['card'],
            billing_address_collection: 'required',
            line_items:[
                {
                    price: 'price_1MT3GNAXNeSejX2wihL6XPF0', quantity: 1
                }
            ],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: process.env.STRIPE_SUCESS_URL!,
            cancel_url:  process.env.STRIPE_CANCEL_URL
        })
        return res.status(200).json({ sessionId: stripeCheckoutSession.id  })
    }else{
        res.setHeader('Allow', "POST")
        res.status(405).end('Method not allowed.')
    }
}