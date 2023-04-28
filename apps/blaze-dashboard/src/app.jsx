/**
 * Global polyfills
 */
import './load-config';
import config from '@automattic/calypso-config';
import { QueryClient } from '@tanstack/react-query';
import page from 'page';
import '@automattic/calypso-polyfills';
import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { getAdvertisingDashboardPath } from 'calypso/my-sites/promote-post-i2/utils';
import { getPathWithUpdatedQueryString } from 'calypso/my-sites/stats/utils';
import consoleDispatcher from 'calypso/state/console-dispatch';
import currentUser from 'calypso/state/current-user/reducer';
import wpcomApiMiddleware from 'calypso/state/data-layer/wpcom-api-middleware';
import { setStore } from 'calypso/state/redux-store';
import sites from 'calypso/state/sites/reducer';
import { combineReducers, addReducerEnhancer } from 'calypso/state/utils';
import setLocale from './lib/set-locale';
import { setupContextMiddleware } from './page-middleware/setup-context';
import registerBlazeDashboardPages from './routes';

import 'calypso/assets/stylesheets/style.scss';
import './app.scss';

async function AppBoot() {
	const siteId = config( 'blog_id' );
	const localeSlug = config( 'i18n_locale_slug' ) || config( 'i18n_default_locale_slug' ) || 'en';

	const rootReducer = combineReducers( {
		currentUser,
		sites,
	} );

	let initialState = config( 'intial_state' );
	// Fix missing user.localeSlug in `intial_state`.
	initialState = {
		...initialState,
		currentUser: {
			...initialState.currentUser,
			user: { ...initialState.currentUser.user, localeSlug },
		},
	};

	const queryClient = new QueryClient();

	const store = createStore(
		rootReducer,
		initialState,
		compose(
			consoleDispatcher,
			addReducerEnhancer,
			applyMiddleware( thunkMiddleware, wpcomApiMiddleware )
		)
	);

	setStore( store );
	setupContextMiddleware( store, queryClient );

	if ( ! window.location?.hash ) {
		// Redirect to the default advertising page.
		window.location.hash = '#!' + getAdvertisingDashboardPath( `/${ siteId }` );
	} else {
		// The URL could already gets broken by page.js by the appended `?page=advertising`.
		window.location.hash = `#!${ getPathWithUpdatedQueryString(
			{},
			window.location.hash.substring( 2 )
		) }`;
	}

	// Ensure locale files are loaded before rendering.
	setLocale( localeSlug ).then( () => {
		registerBlazeDashboardPages( window.location.pathname + window.location.search );

		// HACK: getPathWithUpdatedQueryString filters duplicate query parameters added by `page.js`.
		// It has to come after `registerBlazeDashboardPages` because the duplicate string added in the function.
		page.show( `${ getPathWithUpdatedQueryString( {}, window.location.hash.substring( 2 ) ) }` );
	} );
}

AppBoot();
