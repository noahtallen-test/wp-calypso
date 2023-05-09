import { getScrollContainer } from '@wordpress/dom';
import { useLayoutEffect, useRef, useCallback, useState, forwardRef } from 'react';
import type { ForwardedRef } from 'react';
import './pattern-overlay.scss';

interface Props {
	referenceElement?: HTMLElement;
	children?: JSX.Element | null;
	stickyContent?: JSX.Element | null;
}

const STICKY_MARGIN = 72;

const useOverlayRect = ( referenceElement?: HTMLElement ) => {
	const [ rect, setRect ] = useState< DOMRect >();
	const referenceRef = useRef< HTMLElement | null >( null );

	const updatePosition = useCallback( () => {
		const rect = referenceRef.current?.getBoundingClientRect();
		if ( ! rect ) {
			return;
		}

		setRect( rect );
	}, [ referenceRef ] );

	referenceRef.current = referenceElement ?? null;

	/**
	 * Recompute the position when resizing or scrolling
	 */
	useLayoutEffect( () => {
		if ( ! referenceRef.current || ! referenceRef.current?.ownerDocument?.defaultView ) {
			return;
		}

		const { defaultView } = referenceRef.current.ownerDocument;
		const scrollContainer = getScrollContainer( referenceRef.current );

		defaultView.addEventListener( 'resize', updatePosition );
		scrollContainer?.addEventListener( 'scroll', updatePosition );

		return () => {
			defaultView.removeEventListener( 'resize', updatePosition );
			scrollContainer?.removeEventListener( 'scroll', updatePosition );
		};
	}, [ referenceRef, updatePosition ] );

	/**
	 * Recompute the position when the attribute of the current reference element is changed.
	 * For example, reordering the pattern will change the position.
	 */
	useLayoutEffect( () => {
		if ( ! referenceElement ) {
			return;
		}
		const observer = new window.MutationObserver( updatePosition );
		observer.observe( referenceElement, { attributes: true } );

		return () => {
			observer.disconnect();
		};
	}, [ referenceElement, updatePosition ] );

	/**
	 * Compute the initial position
	 */
	useLayoutEffect( () => {
		updatePosition();
	}, [ referenceElement, updatePosition ] );

	return rect;
};

const PatternOverlay = (
	{ referenceElement, children, stickyContent }: Props,
	ref: ForwardedRef< any >
) => {
	const overlayRect = useOverlayRect( referenceElement );
	const overlayStyle = {
		width: overlayRect?.width,
		height: overlayRect?.height,
		transform: `translate(${ overlayRect?.x }px, ${ overlayRect?.y }px)`,
	};

	const stickyContentStyle = {
		transform:
			overlayRect && overlayRect.y < 0
				? `translateY(${ -Math.max( overlayRect.y, -overlayRect.height + STICKY_MARGIN ) }px)`
				: 'none',
	};

	if ( ! overlayRect ) {
		return null;
	}

	return (
		<div ref={ ref } className="pattern-overlay" style={ overlayStyle }>
			{ children }
			{ stickyContent && (
				<div className="pattern-overlay__sticky-content" style={ stickyContentStyle }>
					{ stickyContent }
				</div>
			) }
		</div>
	);
};

export default forwardRef( PatternOverlay );
