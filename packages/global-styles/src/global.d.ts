declare module '@wordpress/block-editor' {
	interface Props {
		[ key: string ]: unknown;
	}

	export const __unstableIframe: React.ComponentType< Props >;
	export const __unstableEditorStyles: React.ComponentType< Props >;
}

declare module '@wordpress/components' {
	interface Props {
		[ key: string ]: unknown;
	}

	export const __experimentalHStack: React.ComponentType< Props >;
	export const __experimentalVStack: React.ComponentType< Props >;
}

// Note: edit-site doesn't have anything on DefinitelyTyped yet :(
declare module '@wordpress/edit-site/build-module/components/global-styles/context' {
	export const GlobalStylesContext: React.Context< T >;
}
declare module '@wordpress/edit-site/build-module/components/global-styles/global-styles-provider' {
	export function mergeBaseAndUserConfigs< T >( config1: T, config2: T ): T;
}

declare module '@wordpress/edit-site/build-module/components/global-styles/hooks';
declare module '@wordpress/edit-site/build-module/components/global-styles/preview';
declare module '@wordpress/edit-site/build-module/components/global-styles/use-global-styles-output';
