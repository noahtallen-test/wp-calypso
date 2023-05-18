import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAutomatedTransferStatus } from 'calypso/state/automated-transfer/actions';
import { transferStates } from 'calypso/state/automated-transfer/constants';
import {
	getAutomatedTransferStatus,
	isFetchingAutomatedTransferStatus,
} from 'calypso/state/automated-transfer/selectors';

interface SiteTransferStatusProps {
	siteId: number | null;
	intervalTime?: number;
}

export const useCheckSiteTransferStatus = ( {
	siteId,
	intervalTime = 3000,
}: SiteTransferStatusProps ) => {
	const dispatch = useDispatch();

	const transferStatus = useSelector( ( state ) => getAutomatedTransferStatus( state, siteId ) );
	const isFetchingTransferStatus = useSelector( ( state ) =>
		isFetchingAutomatedTransferStatus( state, siteId )
	);

	const isTransferCompleted = transferStatus === transferStates.COMPLETE;
	const isTransferring =
		transferStatus !== null && transferStatus !== transferStates.NONE && ! isTransferCompleted;

	const intervalRef = useRef< NodeJS.Timeout >();

	useEffect( () => {
		if ( ! siteId || transferStatus === transferStates.COMPLETE ) {
			return;
		}

		if ( ! isFetchingTransferStatus ) {
			intervalRef.current = setInterval( () => {
				dispatch( fetchAutomatedTransferStatus( siteId ) );
			}, intervalTime );
		}

		return () => clearInterval( intervalRef.current );
	}, [ siteId, dispatch, transferStatus, isFetchingTransferStatus, intervalTime ] );

	useEffect( () => {
		if ( siteId ) {
			dispatch( fetchAutomatedTransferStatus( siteId ) );
		}
	}, [ siteId, dispatch ] );

	return { transferStatus, isTransferring, isTransferCompleted };
};
