import config from '@automattic/calypso-config';
import page from 'page';
import { promoteWidget, promotedPosts } from 'calypso/my-sites/promote-post-i2/controller';
import { getAdvertisingDashboardPath } from 'calypso/my-sites/promote-post-i2/utils';
import { setSelectedSiteId } from 'calypso/state/ui/actions';
import { makeLayout, render as clientRender } from './page-middleware/layout';

import 'calypso/my-sites/promote-post-i2/style.scss';

const siteSelection = ( context, next ) => {
	context.store.dispatch( setSelectedSiteId( config( 'blog_id' ) ) );
	next( context, next );
};

const blazePage = ( url, controller ) => {
	page( url, controller, siteSelection, makeLayout, clientRender );
};

const redirectToReadyToPromote = () => {
	page.redirect( getAdvertisingDashboardPath( `/${ config( 'blog_id' ) }` ) );
};

export default function ( pageBase = '/' ) {
	page.base( pageBase );

	// Redirect this to default /advertising/:site view in order to keep
	// the paths and page view reporting consistent.
	page( '/', getAdvertisingDashboardPath( '/:site' ) );

	blazePage( getAdvertisingDashboardPath( '/:site' ), promotedPosts );

	blazePage( getAdvertisingDashboardPath( '/:site/promote/:item' ), promoteWidget );

	blazePage( getAdvertisingDashboardPath( '/:site/:tab' ), promotedPosts );

	blazePage( getAdvertisingDashboardPath( '/:site/:tab/promote/:item' ), promoteWidget );

	// Anything else should redirect to default advertising dashboard page
	blazePage( '*', redirectToReadyToPromote );

	// Enable hashbang for routing in Jetpack.
	page( { hashbang: true } );
}
