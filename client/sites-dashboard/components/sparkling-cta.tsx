import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { useDebounce } from '@wordpress/compose';
import { HTMLAttributes, ReactNode, useState } from 'react';

const SparkleSVG = ( props: HTMLAttributes< SVGElement > ) => (
	<svg
		width="36"
		height="36"
		viewBox="0 0 36 36"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		{ ...props }
	>
		<path
			d="M24.7008 14.0427C23.508 13.6444 22.5719 12.7084 22.1736 11.5155L18.5195 0.571843C18.3978 0.207422 17.8823 0.207424 17.7607 0.571844L14.1065 11.5157C13.7082 12.7086 12.7721 13.6447 11.5793 14.043L0.636297 17.6968C0.271876 17.8185 0.271876 18.334 0.636297 18.4556L11.5795 22.1096C12.7723 22.5079 13.7084 23.444 14.1067 24.6368L17.7607 35.58C17.8823 35.9444 18.3978 35.9444 18.5195 35.58L22.1733 24.637C22.5716 23.4442 23.5077 22.5081 24.7006 22.1098L35.6445 18.4556C36.0089 18.334 36.0089 17.8185 35.6445 17.6968L24.7008 14.0427Z"
			fill="#F0C930"
		/>
	</svg>
);

const fadeIn = keyframes`
	0% {
		opacity: 0;
	}

	100% {
		opacity: 1;
	}
`;

const fadeOut = keyframes`
	0% {
		opacity: 1;
	}

	100% {
		opacity: 0;
	}
`;

const Sparkle = styled( SparkleSVG )`
	position: absolute;
	opacity: 0;

	&[data-animation='in'] {
		opacity: 0;
		animation: ${ fadeIn } 0.15s ease forwards;
		animation-delay: var( --delay );

		@media ( prefers-reduced-motion ) {
			animation-duration: 0s;
			animation-delay: 0s;
		}
	}

	&[data-animation='out'] {
		opacity: 1;
		animation: ${ fadeOut } 0.15s ease forwards;
		animation-delay: 0.25s;

		@media ( prefers-reduced-motion ) {
			animation-duration: 0s;
			animation-delay: 0s;
		}
	}
`;

const Link = styled.a( {
	boxSizing: 'border-box',
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'center',
	padding: '40px 32px 16px 32px',
	gap: '12px',
	background: '#FFFFFF',
	border: '1px solid #DCDCDE',
	borderRadius: '4px',
	transition: '0.25s',

	fontWeight: 500,
	fontSize: '14px',
	lineHeight: '20px',
	color: 'var(--studio-gray-100)',

	'&:hover, &:visited': {
		color: 'var(--studio-gray-100)',
	},

	'&:hover, &:focus': {
		border: '1px solid #A7AAAD',
		boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.12), 0px 3px 1px rgba(0, 0, 0, 0.04)',
	},
} );

interface SparklingCTAProps {
	target: string;
	icon: ReactNode;
	label: string;
}

export const SparklingCTA = ( { icon, target, label }: SparklingCTAProps ) => {
	const [ animationState, _setAnimationState ] = useState( '' );
	const setAnimationState = useDebounce( _setAnimationState, 500 );

	const spark = () => setAnimationState( 'in' );
	const still = () => setAnimationState( 'out' );

	return (
		<Link
			href={ target }
			onFocus={ spark }
			onMouseEnter={ spark }
			onBlur={ still }
			onMouseLeave={ still }
		>
			<div
				css={ {
					position: 'relative',
					width: 'fit-content',
					height: 'fit-content',
					'> svg': { display: 'block' },
				} }
			>
				{ icon }
				<Sparkle
					data-animation={ animationState }
					css={ {
						top: '5%',
						left: '30%',
						transform: 'scale(0.7)',
					} }
				/>
				<Sparkle
					data-animation={ animationState }
					css={ {
						top: '50%',
						left: '80%',
						transform: 'scale(0.7)',
						'--delay': '0.25s',
					} }
				/>
				<Sparkle
					data-animation={ animationState }
					css={ {
						top: '80%',
						left: '5%',
						'--delay': '0.35s',
					} }
				/>
			</div>

			{ label }
		</Link>
	);
};
