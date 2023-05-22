import { ListTile } from '@automattic/components';
import { useSiteLaunchStatusLabel } from '@automattic/sites';
import { css } from '@emotion/css';
import styled from '@emotion/styled';
import { useI18n } from '@wordpress/react-i18n';
import { memo, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { useSelector } from 'react-redux';
import StatsSparkline from 'calypso/blocks/stats-sparkline';
import TimeSince from 'calypso/components/time-since';
import { getCurrentUserId } from 'calypso/state/current-user/selectors';
import { useCheckSiteTransferStatus } from '../hooks/use-check-site-transfer-status';
import { displaySiteUrl, getDashboardUrl, isStagingSite, MEDIA_QUERIES } from '../utils';
import { SitesEllipsisMenu } from './sites-ellipsis-menu';
import SitesP2Badge from './sites-p2-badge';
import { SiteItemThumbnail } from './sites-site-item-thumbnail';
import { SiteLaunchNag } from './sites-site-launch-nag';
import { SiteName } from './sites-site-name';
import { SitePlan } from './sites-site-plan';
import { SiteUrl, Truncated } from './sites-site-url';
import SitesStagingBadge from './sites-staging-badge';
import { SitesTransferNotice } from './sites-transfer-notice';
import { ThumbnailLink } from './thumbnail-link';
import type { SiteExcerptData } from 'calypso/data/sites/site-excerpt-types';

interface SiteTableRowProps {
	site: SiteExcerptData;
}

const Row = styled.tr`
	line-height: 2em;
	border-block-end: 1px solid #eee;
`;

const Column = styled.td< { mobileHidden?: boolean } >`
	padding-block-start: 12px;
	padding-block-end: 12px;
	padding-inline-end: 24px;
	vertical-align: middle;
	font-size: 14px;
	line-height: 20px;
	letter-spacing: -0.24px;
	color: var( --studio-gray-60 );
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;

	${ MEDIA_QUERIES.mediumOrSmaller } {
		${ ( props ) => props.mobileHidden && 'display: none;' };
		padding-inline-end: 0;
	}

	.stats-sparkline__bar {
		fill: var( --studio-gray-60 );
	}
`;

const SiteListTile = styled( ListTile )`
	margin-inline-end: 0;

	${ MEDIA_QUERIES.mediumOrSmaller } {
		margin-inline-end: 12px;
	}
`;

const ListTileLeading = styled( ThumbnailLink )`
	${ MEDIA_QUERIES.mediumOrSmaller } {
		margin-inline-end: 12px;
	}
`;

const ListTileTitle = styled.div`
	display: flex;
	align-items: center;
	margin-block-end: 8px;
`;

const ListTileSubtitle = styled.div`
	display: flex;
	align-items: center;
`;

export default memo( function SitesTableRow( { site }: SiteTableRowProps ) {
	const { __ } = useI18n();
	const translatedStatus = useSiteLaunchStatusLabel( site );
	const { ref, inView } = useInView( { triggerOnce: true } );
	const userId = useSelector( ( state ) => getCurrentUserId( state ) );

	const isP2Site = site.options?.is_wpforteams_site;
	const isWpcomStagingSite = isStagingSite( site );

	const { isTransferring, isTransferCompleted, isErrored } = useCheckSiteTransferStatus( {
		siteId: site.ID,
	} );
	const [ wasTransferring, setWasTransferring ] = useState( false );
	const dismissTransferNoticeRef = useRef< NodeJS.Timeout >();

	useEffect( () => {
		if ( isTransferring && ! wasTransferring ) {
			setWasTransferring( true );
		} else if ( ! isTransferring && wasTransferring && isTransferCompleted ) {
			dismissTransferNoticeRef.current = setTimeout( () => {
				setWasTransferring( false );
			}, 3000 );
		}

		return () => clearTimeout( dismissTransferNoticeRef.current );
	}, [ isTransferring, isTransferCompleted, wasTransferring, setWasTransferring ] );

	let siteUrl = site.URL;
	if ( site.options?.is_redirect && site.options?.unmapped_url ) {
		siteUrl = site.options?.unmapped_url;
	}

	return (
		<Row ref={ ref }>
			<Column>
				<SiteListTile
					contentClassName={ css`
						min-width: 0;
					` }
					leading={
						<ListTileLeading
							href={ getDashboardUrl( site.slug ) }
							title={ __( 'Visit Dashboard' ) }
						>
							<SiteItemThumbnail displayMode="list" showPlaceholder={ ! inView } site={ site } />
						</ListTileLeading>
					}
					title={
						<ListTileTitle>
							<SiteName href={ getDashboardUrl( site.slug ) } title={ __( 'Visit Dashboard' ) }>
								{ site.title }
							</SiteName>
							{ isP2Site && <SitesP2Badge>P2</SitesP2Badge> }
							{ isWpcomStagingSite && <SitesStagingBadge>{ __( 'Staging' ) }</SitesStagingBadge> }
						</ListTileTitle>
					}
					subtitle={
						<ListTileSubtitle>
							<SiteUrl href={ siteUrl } title={ siteUrl }>
								<Truncated>{ displaySiteUrl( siteUrl ) }</Truncated>
							</SiteUrl>
						</ListTileSubtitle>
					}
				/>
			</Column>
			<Column mobileHidden>
				<SitePlan site={ site } userId={ userId } />
			</Column>
			<Column mobileHidden>
				{ ! wasTransferring && translatedStatus }
				{ ! wasTransferring && <SiteLaunchNag site={ site } /> }
				{ isTransferring && <SitesTransferNotice isTransfering={ true } isCompact={ true } /> }
				{ wasTransferring && ( isTransferCompleted || isErrored ) && (
					<SitesTransferNotice isTransfering={ false } hasError={ isErrored } isCompact={ true } />
				) }
			</Column>
			<Column mobileHidden>
				{ site.options?.updated_at ? <TimeSince date={ site.options.updated_at } /> : '' }
			</Column>
			<Column mobileHidden>
				{ inView && (
					<a href={ `/stats/day/${ site.slug }` }>
						<StatsSparkline siteId={ site.ID } showLoader={ true }></StatsSparkline>
					</a>
				) }
			</Column>
			<Column style={ { width: '24px' } }>{ inView && <SitesEllipsisMenu site={ site } /> }</Column>
		</Row>
	);
} );
