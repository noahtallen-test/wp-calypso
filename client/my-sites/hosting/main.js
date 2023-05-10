import { isEnabled } from '@automattic/calypso-config';
import {
	FEATURE_SFTP,
	FEATURE_SFTP_DATABASE,
	FEATURE_SITE_STAGING_SITES,
	WPCOM_FEATURES_ATOMIC,
} from '@automattic/calypso-products';
import { englishLocales } from '@automattic/i18n-utils';
import i18n, { localize } from 'i18n-calypso';
import { Component, Fragment, useMemo } from 'react';
import wrapWithClickOutside from 'react-click-outside';
import { connect } from 'react-redux';
import DocumentHead from 'calypso/components/data/document-head';
import QueryKeyringConnections from 'calypso/components/data/query-keyring-connections';
import QueryKeyringServices from 'calypso/components/data/query-keyring-services';
import QueryReaderTeams from 'calypso/components/data/query-reader-teams';
import FeatureExample from 'calypso/components/feature-example';
import FormattedHeader from 'calypso/components/formatted-header';
import Layout from 'calypso/components/layout';
import Column from 'calypso/components/layout/column';
import Main from 'calypso/components/main';
import Notice from 'calypso/components/notice';
import NoticeAction from 'calypso/components/notice/notice-action';
import { ScrollToAnchorOnMount } from 'calypso/components/scroll-to-anchor-on-mount';
import PageViewTracker from 'calypso/lib/analytics/page-view-tracker';
import TrackComponentView from 'calypso/lib/analytics/track-component-view';
import { GitHubCard } from 'calypso/my-sites/hosting/github';
import { isAutomatticTeamMember } from 'calypso/reader/lib/teams';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { fetchAutomatedTransferStatus } from 'calypso/state/automated-transfer/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import {
	getAutomatedTransferStatus,
	isAutomatedTransferActive,
} from 'calypso/state/automated-transfer/selectors';
import { getAtomicHostingIsLoadingSftpData } from 'calypso/state/selectors/get-atomic-hosting-is-loading-sftp-data';
import isSiteAutomatedTransfer from 'calypso/state/selectors/is-site-automated-transfer';
import isSiteWpcomStaging from 'calypso/state/selectors/is-site-wpcom-staging';
import siteHasFeature from 'calypso/state/selectors/site-has-feature';
import { requestSite } from 'calypso/state/sites/actions';
import { isSiteOnECommerceTrial } from 'calypso/state/sites/plans/selectors';
import { getReaderTeams } from 'calypso/state/teams/selectors';
import { getSelectedSiteId, getSelectedSiteSlug } from 'calypso/state/ui/selectors';
import CacheCard from './cache-card';
import { HostingUpsellNudge } from './hosting-upsell-nudge';
import PhpMyAdminCard from './phpmyadmin-card';
import RestorePlanSoftwareCard from './restore-plan-software-card';
import SFTPCard from './sftp-card';
import SiteBackupCard from './site-backup-card';
import StagingSiteCard from './staging-site-card';
import StagingSiteProductionCard from './staging-site-card/staging-site-production-card';
import SupportCard from './support-card';
import WebServerSettingsCard from './web-server-settings-card';
import './style.scss';

const HEADING_OFFSET = 30;

const CardsByEnabledFeatures = ( { availableTypes, cards } ) => {
	const enabledCards = cards.filter(
		( card ) => ! card.type || availableTypes.includes( card.type )
	);
	const disabledCards = cards.filter(
		( card ) => card.type && ! availableTypes.includes( card.type )
	);

	return (
		<>
			{ enabledCards.map( ( card ) => {
				return <Fragment key={ card.feature }>{ card.content }</Fragment>;
			} ) }
			<FeatureExample>
				{ disabledCards.map( ( card ) => {
					return <Fragment key={ card.feature }>{ card.content }</Fragment>;
				} ) }
			</FeatureExample>
		</>
	);
};

const MainCards = ( {
	hasStagingSitesFeature,
	isAdvancedHostingDisabled,
	isBasicHostingDisabled,
	isGithubIntegrationEnabled,
	isWpcomStagingSite,
	siteId,
} ) => {
	const mainCards = useMemo( () => {
		return [
			{
				feature: 'sftp',
				content: <SFTPCard disabled={ isAdvancedHostingDisabled } />,
				type: 'advanced',
			},
			{
				feature: 'phpmyadmin',
				content: <PhpMyAdminCard disabled={ isAdvancedHostingDisabled } />,
				type: 'advanced',
			},
			! isWpcomStagingSite && hasStagingSitesFeature
				? {
						feature: 'staging-site',
						content: <StagingSiteCard disabled={ isAdvancedHostingDisabled } />,
						type: 'advanced',
				  }
				: null,
			isWpcomStagingSite && siteId
				? {
						feature: 'staging-production-site',
						content: (
							<StagingSiteProductionCard siteId={ siteId } disabled={ isAdvancedHostingDisabled } />
						),
						type: 'advanced',
				  }
				: null,
			isGithubIntegrationEnabled
				? {
						feature: 'github',
						content: <GitHubCard />,
						type: 'advanced',
				  }
				: null,
			{
				feature: 'web-server-settings',
				content: <WebServerSettingsCard disabled={ isAdvancedHostingDisabled } />,
				type: 'advanced',
			},
			{
				feature: 'restore-plan-software',
				content: <RestorePlanSoftwareCard disabled={ isBasicHostingDisabled } />,
				type: 'basic',
			},
			{
				feature: 'cache',
				content: <CacheCard disabled={ isBasicHostingDisabled } />,
				type: 'basic',
			},
		].filter( ( card ) => card !== null );
	}, [
		hasStagingSitesFeature,
		isAdvancedHostingDisabled,
		isBasicHostingDisabled,
		isGithubIntegrationEnabled,
		isWpcomStagingSite,
		siteId,
	] );

	const availableTypes = [
		! isAdvancedHostingDisabled ? 'advanced' : null,
		! isBasicHostingDisabled ? 'basic' : null,
	].filter( ( type ) => type !== null );

	return <CardsByEnabledFeatures cards={ mainCards } availableTypes={ availableTypes } />;
};

const SidebarCards = ( { isBasicHostingDisabled } ) => {
	const sidebarCards = useMemo( () => {
		return [
			{
				feature: 'site-backup',
				content: <SiteBackupCard disabled={ isBasicHostingDisabled } />,
				type: 'basic',
			},
			{
				feature: 'support',
				content: <SupportCard />,
			},
		];
	}, [ isBasicHostingDisabled ] );

	const availableTypes = isBasicHostingDisabled ? [] : [ 'basic' ];

	return <CardsByEnabledFeatures cards={ sidebarCards } availableTypes={ availableTypes } />;
};

class Hosting extends Component {
	state = {
		clickOutside: false,
	};

	handleClickOutside( event ) {
		const { COMPLETE } = transferStates;
		const { isTransferring, transferState } = this.props;

		if ( isTransferring && COMPLETE !== transferState ) {
			event.preventDefault();
			event.stopImmediatePropagation();
			this.setState( { clickOutside: true } );
		}
	}

	componentDidMount() {
		const { COMPLETE } = transferStates;
		// Check if a reverted site still has the COMPLETE status
		if ( this.props.transferState === COMPLETE ) {
			// Try to refresh the transfer state
			this.props.fetchAutomatedTransferStatus( this.props.siteId );
		}
	}

	render() {
		const {
			teams,
			clickActivate,
			isAdvancedHostingDisabled,
			isBasicHostingDisabled,
			isECommerceTrial,
			isSiteAtomic,
			isTransferring,
			isWpcomStagingSite,
			locale,
			requestSiteById,
			siteId,
			siteSlug,
			translate,
			transferState,
			isLoadingSftpData,
			hasAtomicFeature,
			hasStagingSitesFeature,
		} = this.props;

		const getUpgradeBanner = () => {
			// The eCommerce Trial requires a different upsell path.
			const targetPlan = ! isECommerceTrial
				? undefined
				: {
						callToAction: translate( 'Upgrade your plan' ),
						feature: FEATURE_SFTP_DATABASE,
						href: `/plans/${ siteSlug }?feature=${ encodeURIComponent( FEATURE_SFTP_DATABASE ) }`,
						title: translate( 'Upgrade your plan to access all hosting features' ),
				  };

			return <HostingUpsellNudge siteId={ siteId } targetPlan={ targetPlan } />;
		};

		const { COMPLETE, FAILURE } = transferStates;

		const isTransferInProgress = () => isTransferring && COMPLETE !== transferState;

		const getAtomicActivationNotice = () => {
			// Transfer in progress
			if ( isTransferInProgress() || ( isBasicHostingDisabled && COMPLETE === transferState ) ) {
				if ( COMPLETE === transferState ) {
					requestSiteById( siteId );
				}

				let activationText = translate( 'Please wait while we activate the hosting features.' );
				if ( this.state.clickOutside ) {
					activationText = translate( "Don't leave quite yet! Just a bit longer." );
				}

				return (
					<>
						<Notice
							className="hosting__activating-notice"
							status="is-info"
							showDismiss={ false }
							text={ activationText }
							icon="sync"
						/>
					</>
				);
			}

			if ( isBasicHostingDisabled && ! isTransferring ) {
				const failureNotice = FAILURE === transferState && (
					<Notice
						status="is-error"
						showDismiss={ false }
						text={ translate( 'There was an error activating hosting features.' ) }
						icon="bug"
					/>
				);

				// Don't imply additional access if site doesn't have the SFTP feature.
				const noticeText =
					isBasicHostingDisabled &&
					( englishLocales.includes( locale ) ||
						i18n.hasTranslation( 'Please activate your hosting access.' ) )
						? translate( 'Please activate your hosting access.' )
						: translate( 'Please activate the hosting access to begin using these features.' );

				return (
					<>
						{ failureNotice }
						<Notice status="is-info" showDismiss={ false } text={ noticeText } icon="globe">
							<TrackComponentView eventName="calypso_hosting_configuration_activate_impression" />
							<NoticeAction
								onClick={ clickActivate }
								href={ `/hosting-config/activate/${ siteSlug }` }
							>
								{ translate( 'Activate' ) }
							</NoticeAction>
						</Notice>
					</>
				);
			}

			return null;
		};

		const getContent = () => {
			const isGithubIntegrationEnabled =
				isEnabled( 'github-integration-i1' ) && isAutomatticTeamMember( teams );

			return (
				<>
					{ isGithubIntegrationEnabled && (
						<>
							<QueryKeyringServices />
							<QueryKeyringConnections />
						</>
					) }
					<Layout className="hosting__layout">
						<Column type="main" className="hosting__main-layout-col">
							<MainCards
								hasStagingSitesFeature={ hasStagingSitesFeature }
								isAdvancedHostingDisabled={ isAdvancedHostingDisabled }
								isBasicHostingDisabled={ isBasicHostingDisabled }
								isGithubIntegrationEnabled={ isGithubIntegrationEnabled }
								isWpcomStagingSite={ isWpcomStagingSite }
								siteId={ siteId }
							/>
						</Column>
						<Column type="sidebar">
							<SidebarCards isBasicHostingDisabled={ isBasicHostingDisabled } />
						</Column>
					</Layout>
				</>
			);
		};

		/* We want to show the upsell banner for the following cases:
		 *  1. The site does not have the Atomic feature.
		 *  2. The site is Atomic, is not transferring, and doesn't have advanced hosting features.
		 * Otherwise, we show the activation notice, which may be empty.
		 */
		const banner =
			! hasAtomicFeature ||
			( isSiteAtomic && ! isTransferInProgress() && isAdvancedHostingDisabled )
				? getUpgradeBanner()
				: getAtomicActivationNotice();

		return (
			<Main wideLayout className="hosting">
				{ ! isLoadingSftpData && <ScrollToAnchorOnMount offset={ HEADING_OFFSET } /> }
				<PageViewTracker path="/hosting-config/:site" title="Hosting Configuration" />
				<DocumentHead title={ translate( 'Hosting Configuration' ) } />
				<FormattedHeader
					brandFont
					headerText={ translate( 'Hosting Configuration' ) }
					subHeaderText={ translate(
						'Access your website’s database and more advanced settings.'
					) }
					align="left"
				/>
				{ banner }
				{ getContent() }
				<QueryReaderTeams />
			</Main>
		);
	}
}

export const clickActivate = () =>
	recordTracksEvent( 'calypso_hosting_configuration_activate_click' );

export default connect(
	( state ) => {
		const siteId = getSelectedSiteId( state );
		const hasAtomicFeature = siteHasFeature( state, siteId, WPCOM_FEATURES_ATOMIC );
		const hasSftpFeature = siteHasFeature( state, siteId, FEATURE_SFTP );
		const hasStagingSitesFeature = siteHasFeature( state, siteId, FEATURE_SITE_STAGING_SITES );
		const isSiteAtomic = isSiteAutomatedTransfer( state, siteId );

		return {
			teams: getReaderTeams( state ),
			isECommerceTrial: isSiteOnECommerceTrial( state, siteId ),
			transferState: getAutomatedTransferStatus( state, siteId ),
			isTransferring: isAutomatedTransferActive( state, siteId ),
			isAdvancedHostingDisabled: ! hasSftpFeature || ! isSiteAtomic,
			isBasicHostingDisabled: ! hasAtomicFeature || ! isSiteAtomic,
			isLoadingSftpData: getAtomicHostingIsLoadingSftpData( state, siteId ),
			isSiteAtomic,
			hasAtomicFeature,
			siteSlug: getSelectedSiteSlug( state ),
			siteId,
			isWpcomStagingSite: isSiteWpcomStaging( state, siteId ),
			hasStagingSitesFeature,
		};
	},
	{
		clickActivate,
		fetchAutomatedTransferStatus,
		requestSiteById: requestSite,
	}
)( localize( wrapWithClickOutside( Hosting ) ) );
