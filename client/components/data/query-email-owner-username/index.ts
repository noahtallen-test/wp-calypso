import { isTitanMail, isGoogleWorkspace } from '@automattic/calypso-products';
import { useSelector } from 'react-redux';
import { useQuerySitePurchases } from 'calypso/components/data/query-site-purchases';
import useUsersQuery from 'calypso/data/users/use-users-query';
import { getSitePurchases } from 'calypso/state/purchases/selectors';
import { useGetEmailAccountsQuery } from '../../../data/emails/use-get-email-accounts-query';
import type { SiteDetails } from '@automattic/data-stores';
import type { InfiniteData } from 'react-query';

type User = {
	ID: number;
	linked_user_ID: number;
	login: string;
};

type UsersData = {
	users: User[];
};

type EmailAccountWithActiveField = {
	active: boolean;
};

export function useEmailOwnerUserName(
	selectedSite: SiteDetails | null | undefined,
	domainName: string
): string {
	useQuerySitePurchases( selectedSite?.ID ?? -1 );

	const purchases = useSelector( ( state ) => getSitePurchases( state, selectedSite?.ID ) );

	const { data: emailAccounts = [] as EmailAccountWithActiveField[] } = useGetEmailAccountsQuery(
		selectedSite ? selectedSite.ID : null,
		domainName
	);

	const emailSubscription =
		emailAccounts.length > 0
			? purchases.find(
					( purchase ) =>
						( isTitanMail( purchase ) || isGoogleWorkspace( purchase ) ) &&
						purchase.meta === domainName
			  )
			: null;

	const { data, isLoading } = useUsersQuery(
		selectedSite?.ID,
		{},
		{
			enabled: emailSubscription !== undefined,
		}
	);

	if ( isLoading || ! emailSubscription ) {
		return '';
	}

	const teams = data as InfiniteData< UsersData > & UsersData;
	const ownerUser = teams.users?.find(
		( user ) => ( user.linked_user_ID ?? user.ID ) === emailSubscription?.userId
	);

	return ownerUser?.login ?? '';
}
