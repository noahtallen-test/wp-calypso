import { Url } from 'url';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import moment from 'moment';
import wp from 'calypso/lib/wp';
import { SiteId } from 'calypso/types';

export interface BloggingPrompt {
	id: number;
	label: string;
	text: string;
	attribution: string;
	date: string;
	answered: boolean;
	answered_users_count: number;
	answered_users_sample: AnsweredUsersSample[];
	answered_link: Url;
	answered_link_text: string;
}

interface AnsweredUsersSample {
	avatar: Url;
}

export const useBloggingPrompts = (
	siteId: SiteId,
	per_page: number
): UseQueryResult< BloggingPrompt[] | null > => {
	const today = moment().format( '--MM-DD' );

	return useQuery(
		// Blogging prompts are the same for all sites, so can be cached only by date.
		[ 'blogging-prompts', today + '-' + per_page ],
		() =>
			wp.req.get( {
				path: `/sites/${ siteId }/blogging-prompts?per_page=${ per_page }&after=${ today }&order=desc`,
				apiNamespace: 'wpcom/v3',
			} ),
		{
			enabled: !! siteId,
			staleTime: 86400000, // 1 day
		}
	);
};
