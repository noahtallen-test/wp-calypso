import * as wpcom from 'calypso/lib/wp';
import * as selectedSite from 'calypso/state/help/selectors';
import { getHappychatAuth } from '../utils';

jest.mock( 'calypso/state/help/selectors', () => ( {
	getHelpSelectedSite: jest.fn(),
} ) );

describe( 'auth promise', () => {
	const state = {
		currentUser: {
			id: 3,
			user: { ID: 123456, localeSlug: 'gl' },
		},
		ui: {
			section: {
				name: 'jetpack-connect',
			},
		},
	};

	describe( 'upon request success', () => {
		beforeEach( () => {
			wpcom.default.request = jest.fn();
			wpcom.default.request.mockImplementation( ( args, callback ) =>
				callback( null, {
					jwt: 'jwt',
					url: 'https://happychat.io/customer',
					geo_location: {
						city: 'Lugo',
					},
				} )
			);

			// mock getHelpSelectedSite to return null
			selectedSite.getHelpSelectedSite.mockReturnValue( null );
		} );

		test( 'should return a fulfilled Promise', () => {
			return expect( getHappychatAuth( state )() ).resolves.toMatchObject( {
				user: {
					signer_user_id: state.currentUser.user.ID,
					skills: { language: [ state.currentUser.user.localeSlug ] },
					groups: [ 'jpop' ],
					jwt: 'jwt',
					geoLocation: { city: 'Lugo' },
				},
			} );
		} );
	} );

	describe( 'upon request failure', () => {
		beforeEach( () => {
			wpcom.default.request = jest.fn();
			wpcom.default.request.mockImplementation( ( args, callback ) =>
				callback( 'failed request', {} )
			);

			// mock getHelpSelectedSite to return null
			selectedSite.getHelpSelectedSite.mockReturnValue( null );
		} );

		test( 'should return a rejected Promise', () => {
			return expect( getHappychatAuth( state )() ).rejects.toMatch(
				'Failed to start an authenticated Happychat session: failed request'
			);
		} );
	} );

	test( 'should return a rejected promise if there is no current user', () => {
		const noUserState = {
			currentUser: {},
			ui: {
				section: {
					name: 'jetpack-connect',
				},
			},
		};
		return expect( getHappychatAuth( noUserState )() ).rejects.toMatch(
			'Failed to start an authenticated Happychat session: No current user found'
		);
	} );
} );
