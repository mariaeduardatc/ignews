import { query as q } from 'faunadb';


export async function saveSubscription(
    subscriptionId: string,
    customerId: string,
){
    // Search for the user in FaunaDB w the ID {customerId}
    // save the data from the subscription into FaunaDB

    const userRef = await fauna.query(
        q.Select(
            "ref",
            q.Get(
                q.Match(
                    q.Index('user_by_stripe_customer_id'),
                    customerId
                )
            )
        )
    )

    const subscription = await stripe.subscription.retrieve(subscription)

    const subscriptionData = {
        id: subscription.id,
        userId: userRef,
        status: subscription.status,
        price_id: subscription.itmes.data[0].price.id,
        createAction: false,
    }

    if (createAction) {
        await fauna.query(
            q.Create(
                q.Colletion('subscriptions'),
                { data: subscriptionData }
            )
        )
    } else{
        await fauna.query(
            q.Replace(
                q.Select(
                    "ref",
                    q.Get(
                        q.Match(
                            q.Index('subscription_by_id'),
                            subscriptionId,
                        )
                    )
                ),
                { data: subscriptionData }
            )
        )
    }
}