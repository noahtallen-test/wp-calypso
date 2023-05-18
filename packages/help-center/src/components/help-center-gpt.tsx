/* eslint-disable wpcalypso/jsx-classname-namespace */

import { recordTracksEvent } from '@automattic/calypso-analytics';
import { Button, LoadingPlaceholder } from '@automattic/components';
import { HelpCenterSelect, useJetpackSearchAIQuery } from '@automattic/data-stores';
import styled from '@emotion/styled';
import { useSelect } from '@wordpress/data';
import { external, Icon, page } from '@wordpress/icons';
import { useI18n } from '@wordpress/react-i18n';
import { useEffect, useState } from 'react';
import stripTags from 'striptags';
import './help-center-article-content.scss';
import useTyper from '../hooks/use-typer';
import { HELP_CENTER_STORE } from '../stores';

const GPTResponsePlaceholder = styled( LoadingPlaceholder )< { width?: string } >`
	:not( :last-child ) {
		margin-block-end: 0.5rem;
	}
	width: ${ ( { width = '100%' } ) => width };
`;

const GPTResponseDisclaimer = styled.div`
	color: var( --studio-gray-50 );
	font-size: 11px;
	text-align: right;

	@media ( min-width: 600px ) {
		padding: 5px 0;
	}
`;

interface Props {
	loadingMessage: string;
}

const LoadingPlaceholders: React.FC< Props > = ( { loadingMessage } ) => (
	<>
		<p className="help-center-gpt-response__loading">{ loadingMessage }</p>
		<GPTResponsePlaceholder width="80%" />
		<GPTResponsePlaceholder width="80%" />
		<GPTResponsePlaceholder width="55%" />
	</>
);

export function HelpCenterGPT() {
	const { __ } = useI18n();

	const [ feedbackGiven, setFeedbackGiven ] = useState< boolean >( false );

	// Report loading state up.
	const { message } = useSelect( ( select ) => {
		const store = select( HELP_CENTER_STORE ) as HelpCenterSelect;
		const subject = store.getSubject();
		const message = store.getMessage();

		// if the first 50 chars of subject and message match, only show the message (they're probably identical)
		if ( subject && message && subject.slice( 0, 50 ) === message.slice( 0, 50 ) ) {
			return {
				message,
			};
		}

		return {
			message: `${ subject }\n\n${ message }`,
		};
	}, [] );

	const query = message ?? '';

	// First fetch the links
	const { data: links, isError: isLinksError } = useJetpackSearchAIQuery(
		'9619154',
		query,
		'urls'
	);

	// Then fetch the response
	const { data, isError: isResponseError } = useJetpackSearchAIQuery(
		'9619154',
		links?.urls ? query : '',
		'response'
	);

	const allowedTags = [ 'a', 'p', 'ol', 'ul', 'li', 'br', 'b', 'strong', 'i', 'em' ];

	const isGPTError = isLinksError || isResponseError;

	useEffect( () => {
		if ( data?.response ) {
			recordTracksEvent( 'calypso_helpcenter_show_gpt_response', {
				location: 'help-center',
			} );
		}
	}, [ data ] );

	const loadingMessages: string[] = [
		__( 'Finding relevant support documentation…', __i18n_text_domain__ ),
		__( 'Gathering all the data…', __i18n_text_domain__ ),
		__( 'Thanks for your patience, this might take a bit…', __i18n_text_domain__ ),
		__( 'Processing the information found…', __i18n_text_domain__ ),
		__( "I'm still writing, thank you for your patience!", __i18n_text_domain__ ),
		__( 'Any minute now…', __i18n_text_domain__ ),
		__( 'Really, any minute now…', __i18n_text_domain__ ),
	];

	const loadingMessage = useTyper( loadingMessages, true, {
		delayBetweenCharacters: 80,
		delayBetweenWords: 1000,
	} );

	const doThumbsUp = () => {
		setFeedbackGiven( true );
		recordTracksEvent( 'calypso_helpcenter_gpt_response_thumbs_up', {
			location: 'help-center',
		} );
	};

	const doThumbsDown = () => {
		setFeedbackGiven( true );
		recordTracksEvent( 'calypso_helpcenter_gpt_response_thumbs_down', {
			location: 'help-center',
		} );
	};

	// show a "thank you" message if the user has clicked thumbs up or down

	return (
		<div className="help-center-gpt__container">
			<h3 id="help-center--contextual_help_query" className="help-center__section-title">
				{ __( 'Your request:', __i18n_text_domain__ ) }
			</h3>
			<div className="help-center-gpt-query">
				{ query.split( '\n\n' ).map( ( line ) => (
					<p>{ line }</p>
				) ) }
			</div>
			<h3 id="help-center--contextual_help" className="help-center__section-title">
				{ __( 'AI generated response:', __i18n_text_domain__ ) }
			</h3>
			{ isGPTError && (
				<div className="help-center-gpt-error">
					{ __(
						"Sorry, we couldn't load the AI-generated response. Please click the button below to send your message to our support team.",
						__i18n_text_domain__
					) }
				</div>
			) }
			{ ! isGPTError && (
				<>
					<div className="help-center-gpt-response">
						{ ! data?.response && LoadingPlaceholders( { loadingMessage } ) }
						{ data?.response && (
							<>
								<div
									className="help-center-gpt-response__content"
									// eslint-disable-next-line react/no-danger
									dangerouslySetInnerHTML={ {
										__html: stripTags( data.response, allowedTags ),
									} }
								/>
								<div className="help-center-gpt-response__actions">
									{ feedbackGiven ? (
										<div className="help-center-gpt-response__feedback">
											{ __(
												'Thank you for your feedback! We will use it to improve our AI.',
												__i18n_text_domain__
											) }
										</div>
									) : (
										<>
											<Button onClick={ doThumbsUp }>&#128077;</Button>
											<Button onClick={ doThumbsDown }>&#128078;</Button>
										</>
									) }
								</div>
							</>
						) }
						<GPTResponseDisclaimer>
							{ __( "Generated by WordPress.com's Support AI", __i18n_text_domain__ ) }
						</GPTResponseDisclaimer>
					</div>
					<h3 id="help-center--contextual_help" className="help-center__section-title">
						{ __( 'Relevant resources', __i18n_text_domain__ ) }
					</h3>
					<ul className="help-center-articles__list" aria-labelledby="help-center--contextual_help">
						{ links?.urls?.map( ( article ) => {
							return (
								<li key={ article.url }>
									<a href={ article.url } target="_blank" rel="noreferrer noopener">
										<Icon icon={ page } />
										<span>{ article.title }</span>
										<Icon icon={ external } size={ 20 } />
									</a>
								</li>
							);
						} ) }
					</ul>
				</>
			) }
		</div>
	);
}
