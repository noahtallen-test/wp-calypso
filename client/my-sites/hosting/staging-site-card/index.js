import { Button, Gridicon } from '@automattic/components';
import styled from '@emotion/styled';
import { useQueryClient } from '@tanstack/react-query';
import { sprintf } from '@wordpress/i18n';
import { useI18n } from '@wordpress/react-i18n';
import { localize } from 'i18n-calypso';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { connect, useDispatch } from 'react-redux';
import SiteIcon from 'calypso/blocks/site-icon';
import InlineSupportLink from 'calypso/components/inline-support-link';
import { LoadingBar } from 'calypso/components/loading-bar';
import Notice from 'calypso/components/notice';
import { USE_SITE_EXCERPTS_QUERY_KEY } from 'calypso/data/sites/use-site-excerpts-query';
import { urlToSlug } from 'calypso/lib/url';
import { CardContentWrapper } from 'calypso/my-sites/hosting/staging-site-card/card-content/card-content-wrapper';
import { NewStagingSiteCardContent } from 'calypso/my-sites/hosting/staging-site-card/card-content/new-staging-site-card-content';
import { LoadingPlaceholder } from 'calypso/my-sites/hosting/staging-site-card/loading-placeholder';
import { useAddStagingSiteMutation } from 'calypso/my-sites/hosting/staging-site-card/use-add-staging-site';
import { useCheckStagingSiteStatus } from 'calypso/my-sites/hosting/staging-site-card/use-check-staging-site-status';
import { useHasValidQuotaQuery } from 'calypso/my-sites/hosting/staging-site-card/use-has-valid-quota';
import { useStagingSite } from 'calypso/my-sites/hosting/staging-site-card/use-staging-site';
import SitesStagingBadge from 'calypso/sites-dashboard/components/sites-staging-badge';
import { recordTracksEvent } from 'calypso/state/analytics/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import { errorNotice, removeNotice, successNotice } from 'calypso/state/notices/actions';
import { getSelectedSiteId, getSelectedSite } from 'calypso/state/ui/selectors';
import { DeleteStagingSite } from './delete-staging-site';
import { useDeleteStagingSite } from './use-delete-staging-site';

const stagingSiteAddSuccessNoticeId = 'staging-site-add-success';
const stagingSiteAddFailureNoticeId = 'staging-site-add-failure';
const stagingSiteDeleteSuccessNoticeId = 'staging-site-remove-success';
const stagingSiteDeleteFailureNoticeId = 'staging-site-remove-failure';

const StyledLoadingBar = styled( LoadingBar )( {
	marginBottom: '1em',
} );

const ActionButtons = styled.div( {
	display: 'flex',
	gap: '1em',

	'@media screen and (max-width: 768px)': {
		gap: '0.5em',
		flexDirection: 'column',
		'.button': { flexGrow: 1 },
	},
} );

const SiteRow = styled.div( {
	display: 'flex',
	alignItems: 'center',
	marginBottom: 24,
	'.site-icon': { flexShrink: 0 },
} );

const SiteInfo = styled.div( {
	display: 'flex',
	flexDirection: 'column',
	marginLeft: 10,
} );

const SiteNameContainer = styled.div( {
	display: 'block',
} );

const SiteName = styled.a( {
	fontWeight: 500,
	marginInlineEnd: '8px',
	'&:hover': {
		textDecoration: 'underline',
	},
	'&, &:hover, &:visited': {
		color: 'var( --studio-gray-100 )',
	},
} );

const StagingSiteLink = styled.div( {
	wordBreak: 'break-word',
} );

export const StagingSiteCard = ( { currentUserId, disabled, siteId, siteOwnerId, translate } ) => {
	const { __ } = useI18n();
	const dispatch = useDispatch();
	const queryClient = useQueryClient();
	const [ loadingError, setLoadingError ] = useState( false );
	const [ isErrorValidQuota, setIsErrorValidQuota ] = useState( false );

	const removeAllNotices = () => {
		dispatch( removeNotice( stagingSiteAddSuccessNoticeId ) );
		dispatch( removeNotice( stagingSiteAddFailureNoticeId ) );
		dispatch( removeNotice( stagingSiteDeleteSuccessNoticeId ) );
		dispatch( removeNotice( stagingSiteDeleteFailureNoticeId ) );
	};

	const { data: hasValidQuota, isLoading: isLoadingQuotaValidation } = useHasValidQuotaQuery(
		siteId,
		{
			enabled: ! disabled,
			onError: () => {
				setIsErrorValidQuota( true );
			},
		}
	);

	const { data: stagingSites, isLoading: isLoadingStagingSites } = useStagingSite( siteId, {
		enabled: ! disabled,
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_load_failure', {
					code: error.code,
				} )
			);
			setLoadingError( error );
		},
	} );

	const stagingSite = useMemo( () => {
		return stagingSites && stagingSites.length ? stagingSites[ 0 ] : [];
	}, [ stagingSites ] );
	const hasSiteAccess = ! stagingSite.id || Boolean( stagingSite?.user_has_permission );

	const showAddStagingSite =
		! isLoadingStagingSites && ! isLoadingQuotaValidation && stagingSites?.length === 0;
	const showManageStagingSite =
		! isLoadingStagingSites && ! isLoadingQuotaValidation && stagingSites?.length > 0;

	const [ wasCreating, setWasCreating ] = useState( false );
	const [ progress, setProgress ] = useState( 0.1 );
	const transferStatus = useCheckStagingSiteStatus( stagingSite.id );
	const { deleteStagingSite, isReverting } = useDeleteStagingSite( {
		siteId,
		stagingSiteId: stagingSite.id,
		transferStatus,
		onMutate: () => {
			removeAllNotices();
		},
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_delete_failure', {
					code: error.code,
				} )
			);
			dispatch(
				errorNotice(
					// translators: "reason" is why deleting the staging site failed.
					sprintf( __( 'Failed to delete staging site: %(reason)s' ), { reason: error.message } ),
					{
						id: stagingSiteDeleteFailureNoticeId,
					}
				)
			);
		},
		onSuccess: useCallback( () => {
			dispatch(
				successNotice( __( 'Staging site deleted.' ), { id: stagingSiteDeleteSuccessNoticeId } )
			);
		}, [ dispatch, __ ] ),
	} );
	const isStagingSiteTransferComplete = transferStatus === transferStates.COMPLETE;
	useEffect( () => {
		if ( wasCreating && isStagingSiteTransferComplete ) {
			queryClient.invalidateQueries( [ USE_SITE_EXCERPTS_QUERY_KEY ] );
			dispatch(
				successNotice( __( 'Staging site added.' ), { id: stagingSiteAddSuccessNoticeId } )
			);
		}
	}, [ dispatch, queryClient, __, isStagingSiteTransferComplete, wasCreating ] );

	useEffect( () => {
		setProgress( ( prevProgress ) => {
			switch ( transferStatus ) {
				case null:
					return 0.1;
				case transferStates.RELOCATING_REVERT:
				case transferStates.ACTIVE:
					return 0.2;
				case transferStates.PROVISIONED:
					return 0.6;
				case transferStates.REVERTED:
				case transferStates.RELOCATING:
					return 0.85;
				default:
					return prevProgress + 0.05;
			}
		} );
	}, [ transferStatus ] );

	const { addStagingSite, isLoading: addingStagingSite } = useAddStagingSiteMutation( siteId, {
		onMutate: () => {
			removeAllNotices();
		},
		onError: ( error ) => {
			dispatch(
				recordTracksEvent( 'calypso_hosting_configuration_staging_site_add_failure', {
					code: error.code,
				} )
			);
			dispatch(
				errorNotice(
					// translators: "reason" is why adding the staging site failed.
					sprintf( __( 'Failed to add staging site: %(reason)s' ), { reason: error.message } ),
					{
						id: stagingSiteAddFailureNoticeId,
					}
				)
			);
		},
	} );

	const isTrasferInProgress =
		addingStagingSite ||
		( showManageStagingSite &&
			! isStagingSiteTransferComplete &&
			( transferStatus !== null || wasCreating ) );

	useEffect( () => {
		// We know that a user has been navigated to an other page and came back if
		// The transfer status is not in a final state (complete or failure)
		// the staging site exists
		// the site is not reverting
		// the user owns the staging site
		// and wasCreating that is set up by the add staging site button is false
		if (
			! wasCreating &&
			! isStagingSiteTransferComplete &&
			stagingSite.id &&
			transferStatus !== transferStates.REVERTED &&
			hasSiteAccess &&
			! isReverting
		) {
			setWasCreating( true );
		}
	}, [
		wasCreating,
		isStagingSiteTransferComplete,
		transferStatus,
		hasSiteAccess,
		isReverting,
		stagingSite,
	] );

	const onAddClick = () => {
		dispatch( recordTracksEvent( 'calypso_hosting_configuration_staging_site_add_click' ) );
		setWasCreating( true );
		setProgress( 0.1 );
		addStagingSite();
	};

	const getManageStagingSiteContent = () => {
		return (
			<>
				<p>
					{ translate(
						'Your staging site lets you preview and troubleshoot changes before updating the production site. {{a}}Learn more{{/a}}.',
						{
							components: {
								a: <InlineSupportLink supportContext="hosting-staging-site" showIcon={ false } />,
							},
						}
					) }
				</p>
				<SiteRow>
					<SiteIcon siteId={ stagingSite.id } size={ 40 } />
					<SiteInfo>
						<SiteNameContainer>
							<SiteName
								href={ `/hosting-config/${ urlToSlug( stagingSite.url ) }` }
								title={ __( 'Visit Dashboard' ) }
							>
								{ stagingSite.name }
							</SiteName>
							<SitesStagingBadge>{ translate( 'Staging' ) }</SitesStagingBadge>
						</SiteNameContainer>
						<StagingSiteLink>
							<a href={ stagingSite.url }>{ stagingSite.url }</a>
						</StagingSiteLink>
					</SiteInfo>
				</SiteRow>
				<ActionButtons>
					<Button
						primary
						href={ `/hosting-config/${ urlToSlug( stagingSite.url ) }` }
						disabled={ disabled }
					>
						<span>{ translate( 'Manage staging site' ) }</span>
					</Button>
					<DeleteStagingSite
						disabled={ disabled }
						onClickDelete={ deleteStagingSite }
						isBusy={ isReverting }
					>
						<Gridicon icon="trash" />
						<span>{ __( 'Delete staging site' ) }</span>
					</DeleteStagingSite>
				</ActionButtons>
			</>
		);
	};

	const getTransferringStagingSiteContent = useCallback( () => {
		if ( isReverting ) {
			return (
				<>
					<StyledLoadingBar key="delete-loading-bar" progress={ progress } />
					<p>{ __( 'We are deleting your staging site.' ) }</p>
				</>
			);
		}

		const message =
			siteOwnerId === currentUserId
				? __( 'We are setting up your staging site. We’ll email you once it is ready.' )
				: __( 'We are setting up the staging site. We’ll email the site owner once it is ready.' );
		return (
			<div data-testid="transferring-staging-content">
				<StyledLoadingBar progress={ progress } />
				<p>{ message }</p>
			</div>
		);
	}, [ progress, __, siteOwnerId, currentUserId, isReverting ] );

	const getLoadingErrorContent = ( message ) => {
		return (
			<Notice status="is-error" showDismiss={ false }>
				{ message }
			</Notice>
		);
	};

	const getAccessError = () => {
		return (
			<Notice status="is-error" showDismiss={ false }>
				<div data-testid="staging-sites-access-message">
					{ translate(
						'Unable to access the staging site {{a}}%(stagingSiteName)s{{/a}}. Please contact the site owner.',
						{
							args: {
								stagingSiteName: stagingSite.url,
							},
							components: {
								a: <a href={ stagingSite.url } />,
							},
						}
					) }
				</div>
			</Notice>
		);
	};

	let stagingSiteCardContent;

	if ( ! isLoadingStagingSites && loadingError ) {
		stagingSiteCardContent = getLoadingErrorContent(
			__(
				'Unable to load staging sites. Please contact support if you believe you are seeing this message in error.'
			)
		);
	} else if ( ! isLoadingQuotaValidation && isErrorValidQuota ) {
		stagingSiteCardContent = getLoadingErrorContent(
			__(
				'Unable to validate your site quota. Please contact support if you believe you are seeing this message in error.'
			)
		);
	} else if ( ! wasCreating && ! hasSiteAccess && transferStatus !== null ) {
		stagingSiteCardContent = getAccessError();
	} else if ( addingStagingSite || isTrasferInProgress || isReverting ) {
		stagingSiteCardContent = getTransferringStagingSiteContent();
	} else if ( showManageStagingSite && isStagingSiteTransferComplete ) {
		stagingSiteCardContent = getManageStagingSiteContent();
	} else if ( showAddStagingSite && ! addingStagingSite ) {
		stagingSiteCardContent = (
			<NewStagingSiteCardContent
				onAddClick={ onAddClick }
				isButtonDisabled={
					disabled || addingStagingSite || isLoadingQuotaValidation || ! hasValidQuota
				}
				showQuotaError={ ! hasValidQuota && ! isLoadingQuotaValidation }
			/>
		);
	} else {
		stagingSiteCardContent = <LoadingPlaceholder />;
	}

	return <CardContentWrapper>{ stagingSiteCardContent }</CardContentWrapper>;
};

export default connect( ( state ) => {
	const currentUserId = getCurrentUserId( state );
	const siteId = getSelectedSiteId( state );
	const siteOwnerId = getSelectedSite( state )?.site_owner;

	return {
		currentUserId,
		siteId,
		siteOwnerId,
	};
} )( localize( StagingSiteCard ) );
