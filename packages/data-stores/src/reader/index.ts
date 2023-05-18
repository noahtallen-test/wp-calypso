import { useSubscriberEmailAddress, useIsLoggedIn } from './hooks';
import {
	usePostUnsubscribeMutation,
	useSiteDeliveryFrequencyMutation,
	useSiteSubscribeMutation,
	useSiteUnsubscribeMutation,
	useUserSettingsMutation,
	usePendingSiteConfirmMutation,
	usePendingSiteDeleteMutation,
	usePendingPostConfirmMutation,
	usePendingPostDeleteMutation,
	useSiteNotifyMeOfNewPostsMutation,
	useSiteEmailMeNewPostsMutation,
	useSiteEmailMeNewCommentsMutation,
} from './mutations';
import {
	PostSubscriptionsSortBy,
	SiteSubscriptionsSortBy,
	useSiteSubscriptionsQuery,
	usePostSubscriptionsQuery,
	useSubscriptionsCountQuery,
	useUserSettingsQuery,
	usePendingSiteSubscriptionsQuery,
	usePendingPostSubscriptionsQuery,
} from './queries';

export const SubscriptionManager = {
	PostSubscriptionsSortBy,
	SiteSubscriptionsSortBy,
	usePostUnsubscribeMutation,
	useSiteDeliveryFrequencyMutation,
	useSiteSubscriptionsQuery,
	usePostSubscriptionsQuery,
	useSiteSubscribeMutation,
	useSiteUnsubscribeMutation,
	useSubscriptionsCountQuery,
	useSubscriberEmailAddress,
	useUserSettingsQuery,
	useUserSettingsMutation,
	usePendingSiteSubscriptionsQuery,
	usePendingPostSubscriptionsQuery,
	usePendingSiteConfirmMutation,
	usePendingSiteDeleteMutation,
	usePendingPostConfirmMutation,
	usePendingPostDeleteMutation,
	useSiteNotifyMeOfNewPostsMutation,
	useSiteEmailMeNewPostsMutation,
	useSiteEmailMeNewCommentsMutation,
	useIsLoggedIn,
};

export { EmailDeliveryFrequency } from './constants';
export * from './types';
