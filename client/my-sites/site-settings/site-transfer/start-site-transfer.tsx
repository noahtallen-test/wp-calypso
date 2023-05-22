import { Button, Gridicon } from '@automattic/components';
import { useLocalizeUrl } from '@automattic/i18n-utils';
import { ToggleControl, TextControl } from '@wordpress/components';
import { localize } from 'i18n-calypso';
import { useState } from 'react';
import { connect } from 'react-redux';
import ActionPanel from 'calypso/components/action-panel';
import ActionPanelBody from 'calypso/components/action-panel/body';
import ActionPanelFooter from 'calypso/components/action-panel/footer';
import ActionPanelTitle from 'calypso/components/action-panel/title';
import HeaderCake from 'calypso/components/header-cake';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import { TRANSFER_SITE } from 'calypso/lib/url/support';
import { getCurrentUserEmail } from 'calypso/state/current-user/selectors';
import { getSelectedSite, getSelectedSiteSlug } from 'calypso/state/ui/selectors';

type Props = {
	currentUserEmail: string;
	selectedSiteSlug: string;
	selectedSiteTitle: string;
	translate: ( text: string, args?: Record< string, unknown > ) => string;
};

const StartSiteTransfer = ( {
	currentUserEmail,
	selectedSiteSlug,
	selectedSiteTitle,
	translate,
}: Props ) => {
	const localizeUrl = useLocalizeUrl();
	const [ confirmFirstToggle, setConfirmFirstToggle ] = useState( false );
	const [ confirmSecondToggle, setConfirmSecondToggle ] = useState( false );
	const [ newOwnerUsername, setNewOwnerUsername ] = useState( '' );
	return (
		<div
			className="main main-column" // eslint-disable-line wpcalypso/jsx-classname-namespace
			role="main"
		>
			<PageViewTracker
				path="/settings/start-site Transfer/:site"
				title="Settings > Start Site Transfer"
			/>
			<HeaderCake backHref={ '/settings/general/' + selectedSiteSlug }>
				<h1>{ translate( 'Start Site Transfer' ) }</h1>
			</HeaderCake>
			<ActionPanel>
				<ActionPanelBody>
					<ActionPanelTitle>{ translate( 'Start Site Transfer' ) }</ActionPanelTitle>
					<p>
						{ translate(
							'Transferring a site cannot be undone. Please read the following actions that will take place when you transfer this site:'
						) }
					</p>
					<ul>
						<li>
							{ translate( 'You will be removed as owner of %(selectedSiteSlug)s', {
								args: { selectedSiteSlug },
							} ) }
						</li>
						<li>
							{ translate(
								'You will not be able to access %(selectedSiteSlug)s unless allowed by the new owner',
								{
									args: { selectedSiteSlug },
								}
							) }
						</li>
						<li>
							{ translate(
								'Your posts on %(selectedSiteSlug)s will be transferred to the new owner and will no longer be authored by your account.',
								{
									args: { selectedSiteSlug },
								}
							) }
						</li>
						<li>
							{ translate(
								'Your paid upgrades on %(selectedSiteSlug)s will be transferred to the new owner, and will remain with the blog',
								{
									args: { selectedSiteSlug },
								}
							) }
						</li>
						<li>
							{ translate(
								'You must authorize the transfer via a confirmation email sent to %(currentUserEmail)s. The transfer will not proceed unless you authorize it.',
								{
									args: { currentUserEmail },
								}
							) }
						</li>
					</ul>
					<p>
						{ translate(
							'Please make sure you understand the changes that will be made and that these changes cannot be undone before you continue:'
						) }
					</p>
					<ToggleControl
						disabled={ false }
						label={ translate(
							'I understand the changes that will be made once I authorize this transfer'
						) }
						checked={ confirmFirstToggle }
						onChange={ () => setConfirmFirstToggle( ! confirmFirstToggle ) }
					/>
					<ToggleControl
						disabled={ false }
						label={ translate(
							'I want to transfer ownership of the site and all my related upgrades'
						) }
						checked={ confirmSecondToggle }
						onChange={ () => setConfirmSecondToggle( ! confirmSecondToggle ) }
					/>
					{ confirmFirstToggle && confirmSecondToggle && (
						<form>
							<p>
								{ translate(
									'Enter the username or email address of the registered WordPress.com user that you want to transfer ownership of %(selectedSiteTitle)s (%(selectedSiteSlug)s) to:',
									{
										args: { selectedSiteTitle, selectedSiteSlug },
									}
								) }
							</p>
							<TextControl
								label={ translate( 'Username or email address of user to receive the blog' ) }
								value={ newOwnerUsername }
								onChange={ ( value ) => setNewOwnerUsername( value ) }
							/>
							<Button
								primary
								onClick={ () => {
									false;
								} }
								disabled={ ! newOwnerUsername }
							>
								{ translate( 'Start site transfer' ) }
							</Button>
						</form>
					) }
				</ActionPanelBody>
				<ActionPanelFooter>
					<Button
						className="action-panel__support-button is-external" // eslint-disable-line wpcalypso/jsx-classname-namespace
						href={ localizeUrl( TRANSFER_SITE ) }
					>
						{ translate( 'Follow the steps' ) }
						<Gridicon icon="external" size={ 48 } />
					</Button>
					<Button
						className="action-panel__support-button" // eslint-disable-line wpcalypso/jsx-classname-namespace
						href="/help/contact"
					>
						{ translate( 'Contact support' ) }
					</Button>
				</ActionPanelFooter>
			</ActionPanel>
		</div>
	);
};

export default connect( ( state ) => ( {
	currentUserEmail: getCurrentUserEmail( state ),
	selectedSiteSlug: getSelectedSiteSlug( state ),
	selectedSiteTitle: getSelectedSite( state )?.title,
} ) )( localize( StartSiteTransfer ) );
