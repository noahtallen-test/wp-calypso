import { useTranslate } from 'i18n-calypso';
import { FC, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import RedirectWhenLoggedIn from 'calypso/components/redirect-when-logged-in';
import { preventWidows } from 'calypso/lib/formatting/prevent-widows';
import {
	recordPageViewWithClientId as recordPageView,
	enhanceWithSiteType,
} from 'calypso/state/analytics/actions';
import { withEnhancers } from 'calypso/state/utils';

interface Props {
	emailAddress: string;
}

const EmailedLoginLinkSuccessfullyJetpackConnect: FC< Props > = ( { emailAddress } ) => {
	const dispatch = useDispatch();
	const translate = useTranslate();

	useEffect( () => {
		const enhancedRecordPageView = withEnhancers( recordPageView, [ enhanceWithSiteType ] );
		dispatch( enhancedRecordPageView( '/log-in/jetpack/link', 'Login > Link > Emailed' ) );
	}, [] );

	return (
		<div className="magic-login__successfully-jetpack">
			<RedirectWhenLoggedIn
				redirectTo="/help"
				replaceCurrentLocation={ true }
				waitForEmailAddress={ emailAddress }
			/>

			<h1 className="magic-login__form-header">{ translate( 'Check your email!' ) }</h1>

			<p>
				{ emailAddress
					? translate( 'We just emailed a link to {{strong}}%(emailAddress)s{{/strong}}.', {
							args: {
								emailAddress,
							},
							components: {
								strong: <strong />,
							},
					  } )
					: translate( 'We just emailed you a link.' ) }
			</p>
			<p>
				{ preventWidows( translate( 'Please check your inbox and click the link to log in.' ) ) }
			</p>
		</div>
	);
};

export default EmailedLoginLinkSuccessfullyJetpackConnect;
