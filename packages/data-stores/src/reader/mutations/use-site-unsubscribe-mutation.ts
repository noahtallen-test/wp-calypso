import { useMutation, useQueryClient } from '@tanstack/react-query';
import { callApi, getSubscriptionMutationParams } from '../helpers';
import { useCacheKey, useIsLoggedIn } from '../hooks';
import { SiteSubscriptionsPages, SubscriptionManagerSubscriptionsCount } from '../types';

type UnsubscribeParams = {
	blog_id: number | string;
	url?: string;
};

type UnsubscribeResponse = {
	success?: boolean;
	subscribed?: boolean;
	subscription?: null;
};

const useSiteUnsubscribeMutation = () => {
	const { isLoggedIn } = useIsLoggedIn();
	const queryClient = useQueryClient();
	const siteSubscriptionsCacheKey = useCacheKey( [ 'read', 'site-subscriptions' ] );
	const subscriptionsCountCacheKey = useCacheKey( [ 'read', 'subscriptions-count' ] );

	return useMutation(
		async ( params: UnsubscribeParams ) => {
			if ( ! params.blog_id ) {
				throw new Error(
					// reminder: translate this string when we add it to the UI
					'Something went wrong while unsubscribing.'
				);
			}

			const { path, apiVersion, body } = getSubscriptionMutationParams(
				'delete',
				isLoggedIn,
				params.blog_id,
				params.url
			);

			const response = await callApi< UnsubscribeResponse >( {
				path,
				method: 'POST',
				isLoggedIn,
				apiVersion,
				body,
			} );
			if (
				'success' in response &&
				response.success === false &&
				'subscribed' in response &&
				response.subscribed === true
			) {
				throw new Error(
					// reminder: translate this string when we add it to the UI
					'Something went wrong while unsubscribing.'
				);
			}

			return response;
		},
		{
			onMutate: async ( params ) => {
				await queryClient.cancelQueries( siteSubscriptionsCacheKey );
				await queryClient.cancelQueries( subscriptionsCountCacheKey );

				const previousSiteSubscriptions =
					queryClient.getQueryData< SiteSubscriptionsPages >( siteSubscriptionsCacheKey );
				// remove blog from site subscriptions
				if ( previousSiteSubscriptions ) {
					queryClient.setQueryData( siteSubscriptionsCacheKey, {
						...previousSiteSubscriptions,
						pages: previousSiteSubscriptions.pages.map( ( page ) => {
							return {
								...page,
								subscriptions: page.subscriptions.filter(
									( siteSubscription ) => siteSubscription.blog_ID !== params.blog_id
								),
								total_subscriptions: page.total_subscriptions - 1,
							};
						} ),
					} );
				}

				const previousSubscriptionsCount =
					queryClient.getQueryData< SubscriptionManagerSubscriptionsCount >(
						subscriptionsCountCacheKey
					);

				// decrement the blog count
				if ( previousSubscriptionsCount ) {
					queryClient.setQueryData< SubscriptionManagerSubscriptionsCount >(
						subscriptionsCountCacheKey,
						{
							...previousSubscriptionsCount,
							blogs: previousSubscriptionsCount?.blogs
								? previousSubscriptionsCount?.blogs - 1
								: null,
						}
					);
				}

				return { previousSiteSubscriptions, previousSubscriptionsCount };
			},
			onError: ( error, variables, context ) => {
				if ( context?.previousSiteSubscriptions ) {
					queryClient.setQueryData( siteSubscriptionsCacheKey, context.previousSiteSubscriptions );
				}
				if ( context?.previousSubscriptionsCount ) {
					queryClient.setQueryData< SubscriptionManagerSubscriptionsCount >(
						subscriptionsCountCacheKey,
						context.previousSubscriptionsCount
					);
				}
			},
			onSettled: () => {
				// pass in more minimal keys, everything to the right will be invalidated
				queryClient.invalidateQueries( siteSubscriptionsCacheKey );
				queryClient.invalidateQueries( subscriptionsCountCacheKey );
			},
		}
	);
};

export default useSiteUnsubscribeMutation;
