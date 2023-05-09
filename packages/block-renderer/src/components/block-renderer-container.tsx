// The idea of this file is from the Gutenberg file packages/block-editor/src/components/block-preview/auto.js (d50e613).
import {
	__unstableIframe as Iframe,
	__unstableEditorStyles as EditorStyles,
	__unstablePresetDuotoneFilter as PresetDuotoneFilter,
} from '@wordpress/block-editor';
import { useResizeObserver, useRefEffect } from '@wordpress/compose';
import React, { useMemo, useState, useContext } from 'react';
import { BLOCK_MAX_HEIGHT } from '../constants';
import useParsedAssets from '../hooks/use-parsed-assets';
import bubbleEvents from '../utils/bubble-events';
import loadScripts from '../utils/load-scripts';
import loadStyles from '../utils/load-styles';
import BlockRendererContext from './block-renderer-context';
import type { RenderedStyle } from '../types';
import './block-renderer-container.scss';

export interface BlockRendererContainerProps {
	children: React.ReactChild;
	styles?: RenderedStyle[];
	scripts?: string;
	inlineCss?: string;
	viewportWidth?: number;
	viewportHeight?: number;
	maxHeight?: number;
	minHeight?: number;
	disabledPointerEvents?: boolean;
}

interface ScaledBlockRendererContainerProps extends BlockRendererContainerProps {
	containerWidth: number;
}

const ScaledBlockRendererContainer = ( {
	children,
	styles: customStyles,
	scripts: customScripts,
	inlineCss = '',
	viewportWidth = 1200,
	viewportHeight,
	containerWidth,
	maxHeight = BLOCK_MAX_HEIGHT,
	minHeight,
	disabledPointerEvents,
}: ScaledBlockRendererContainerProps ) => {
	const [ isLoaded, setIsLoaded ] = useState( false );
	const [ contentResizeListener, contentSizes ] = useResizeObserver();
	const contentHeight = contentSizes.height || 0;
	const { settings } = useContext( BlockRendererContext );
	const { styles, assets, duotone } = useMemo(
		() => ( {
			styles: settings.styles,
			assets: settings.__unstableResolvedAssets,
			duotone: settings.__experimentalFeatures?.color?.duotone,
		} ),
		[ settings ]
	);

	const styleAssets = useParsedAssets( assets?.styles ) as HTMLLinkElement[];

	const editorStyles = useMemo( () => {
		const mergedStyles = [ ...( styles || [] ), ...( customStyles || [] ) ];

		if ( ! inlineCss ) {
			return mergedStyles;
		}

		return [ ...mergedStyles, { css: inlineCss } ];
	}, [ styles, customStyles, inlineCss ] );

	const scripts = useMemo( () => {
		return [ assets?.scripts, customScripts ].filter( Boolean ).join( '' );
	}, [ assets?.scripts, customScripts ] );

	const scriptAssets = useParsedAssets( scripts );

	const svgFilters = useMemo( () => {
		return [ ...( duotone?.default ?? [] ), ...( duotone?.theme ?? [] ) ];
	}, [ duotone ] );

	const contentRef = useRefEffect< HTMLBodyElement >( ( bodyElement ) => {
		const {
			ownerDocument: { documentElement },
		} = bodyElement;
		documentElement.classList.add( 'block-renderer__iframe' );
		documentElement.style.position = 'absolute';
		documentElement.style.width = '100%';

		// Necessary for contentResizeListener to work.
		bodyElement.style.boxSizing = 'border-box';
		bodyElement.style.position = 'absolute';
		bodyElement.style.width = '100%';

		// Load scripts and styles manually to avoid a flash of unstyled content.
		Promise.all( [
			loadStyles( bodyElement, styleAssets ),
			loadScripts( bodyElement, scriptAssets as HTMLScriptElement[] ),
		] ).then( () => setIsLoaded( true ) );

		// Bubble the events to the owner document
		bubbleEvents( bodyElement, [ 'click' ] );
	}, [] );

	const scale = containerWidth / viewportWidth;
	const containerHeight = contentHeight * scale || minHeight;
	const containerMaxHeight = contentHeight > maxHeight ? maxHeight * scale : undefined;

	return (
		<div
			className="scaled-block-renderer"
			style={ {
				transform: `scale(${ scale })`,
				height: containerHeight,
				maxHeight: containerMaxHeight,
			} }
		>
			<Iframe
				head={ <EditorStyles styles={ editorStyles } /> }
				contentRef={ contentRef }
				aria-hidden
				tabIndex={ -1 }
				loading="lazy"
				style={ {
					position: 'absolute',
					width: viewportWidth,
					height: viewportHeight || contentHeight,
					pointerEvents: disabledPointerEvents ? 'none' : 'auto',
					// This is a catch-all max-height for patterns.
					// See: https://github.com/WordPress/gutenberg/pull/38175.
					maxHeight,
					// Avoid showing the unstyled content
					opacity: isLoaded ? 1 : 0,
				} }
			>
				{ isLoaded ? contentResizeListener : null }
				{
					/* Filters need to be rendered before children to avoid Safari rendering issues. */
					svgFilters.map( ( preset ) => (
						<PresetDuotoneFilter preset={ preset } key={ preset.slug } />
					) )
				}
				{ children }
			</Iframe>
		</div>
	);
};

const BlockRendererContainer = ( { viewportWidth, ...props }: BlockRendererContainerProps ) => {
	const [ containerResizeListener, { width: containerWidth } ] = useResizeObserver();

	return (
		<>
			<div style={ { position: 'relative', width: '100%', height: 0 } }>
				{ containerResizeListener }
			</div>
			<div className="block-renderer">
				{ !! containerWidth && (
					<ScaledBlockRendererContainer
						{ ...props }
						viewportWidth={ viewportWidth || containerWidth }
						containerWidth={ containerWidth }
					/>
				) }
			</div>
		</>
	);
};

export default BlockRendererContainer;
