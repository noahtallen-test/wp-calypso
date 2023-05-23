import { Button, Gridicon } from '@automattic/components';
import { ComboboxControl } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { ReactChild, useCallback, useState, useMemo, ChangeEvent } from 'react';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormLabel from 'calypso/components/forms/form-label';
import FormTextInput from 'calypso/components/forms/form-text-input';
import TextPlaceholder from 'calypso/jetpack-cloud/sections/partner-portal/text-placeholder';
import { PartnerDetailsPayload } from 'calypso/state/partner-portal/types';
import { Option as CountryOption, useCountriesAndStates } from './hooks/use-countries-and-states';

import './style.scss';

function getCountry( country: string, options: CountryOption[] ): string {
	if ( options.length < 1 ) {
		return country;
	}

	for ( let i = 0; i < options.length; i++ ) {
		if ( options[ i ].value === country ) {
			return country;
		}
	}

	return options[ 0 ].value;
}

interface Props {
	includeTermsOfService?: boolean;
	isLoading: boolean;
	onSubmit: ( payload: PartnerDetailsPayload ) => void;
	initialValues?: {
		name?: string;
		contactPerson?: string;
		companyWebsite?: string;
		city?: string;
		line1?: string;
		line2?: string;
		country?: string;
		postalCode?: string;
		state?: string;
	};
	submitLabel: ReactChild;
}

export default function CompanyDetailsForm( {
	includeTermsOfService = false,
	isLoading,
	initialValues = {},
	onSubmit,
	submitLabel,
}: Props ) {
	const translate = useTranslate();
	const { countryOptions, stateOptionsMap } = useCountriesAndStates();
	const showCountryFields = countryOptions.length > 0;

	const [ name, setName ] = useState( initialValues.name ?? '' );
	const [ countryValue, setCountryValue ] = useState( initialValues.country ?? '' );
	const [ city, setCity ] = useState( initialValues.city ?? '' );
	const [ line1, setLine1 ] = useState( initialValues.line1 ?? '' );
	const [ line2, setLine2 ] = useState( initialValues.line2 ?? '' );
	const [ postalCode, setPostalCode ] = useState( initialValues.postalCode ?? '' );
	const [ addressState, setAddressState ] = useState( initialValues.state ?? '' );
	const [ contactPerson, setContactPerson ] = useState( initialValues.contactPerson ?? '' );
	const [ companyWebsite, setCompanyWebsite ] = useState( initialValues.companyWebsite ?? '' );

	const country = getCountry( countryValue, countryOptions );
	const stateOptions = stateOptionsMap[ country ];

	const payload: PartnerDetailsPayload = useMemo(
		() => ( {
			name,
			contactPerson,
			companyWebsite,
			city,
			line1,
			line2,
			country,
			postalCode,
			state: addressState,
			...( includeTermsOfService ? { tos: 'consented' } : {} ),
		} ),
		[
			name,
			contactPerson,
			companyWebsite,
			city,
			line1,
			line2,
			country,
			postalCode,
			addressState,
			includeTermsOfService,
		]
	);

	const handleSubmit = useCallback(
		( e ) => {
			e.preventDefault();

			if ( ! showCountryFields || isLoading ) {
				return;
			}

			onSubmit( payload );
		},
		[ showCountryFields, isLoading, onSubmit, payload ]
	);

	return (
		<div className="company-details-form">
			<form onSubmit={ handleSubmit }>
				<FormFieldset>
					<FormLabel htmlFor="name">{ translate( 'Company name' ) }</FormLabel>
					<FormTextInput
						id="name"
						name="name"
						value={ name }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) => setName( event.target.value ) }
						disabled={ isLoading }
					/>
				</FormFieldset>

				<FormFieldset>
					<FormLabel htmlFor="contactPerson">
						{ translate( 'Contact first and last name' ) }
					</FormLabel>
					<FormTextInput
						id="contactPerson"
						name="contactPerson"
						value={ contactPerson }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
							setContactPerson( event.target.value )
						}
						disabled={ isLoading }
					/>
				</FormFieldset>

				<FormFieldset>
					<FormLabel htmlFor="companyWebsite">{ translate( 'Company website' ) }</FormLabel>
					<FormTextInput
						id="companyWebsite"
						name="companyWebsite"
						value={ companyWebsite }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
							setCompanyWebsite( event.target.value )
						}
						disabled={ isLoading }
					/>
				</FormFieldset>

				<FormFieldset>
					<FormLabel>{ translate( 'Country' ) }</FormLabel>
					{ showCountryFields && (
						<ComboboxControl
							className="company-details-form__combo-box"
							value={ countryValue }
							onChange={ ( value ) => {
								setCountryValue( value ?? '' );
								// Reset the value of state since it no longer matches with the selected country.
								setAddressState( '' );
							} }
							options={ countryOptions }
						/>
					) }

					{ ! showCountryFields && <TextPlaceholder /> }
				</FormFieldset>

				{ showCountryFields && stateOptions && (
					<FormFieldset>
						<FormLabel>{ translate( 'State' ) }</FormLabel>
						<ComboboxControl
							className="company-details-form__combo-box"
							value={ addressState }
							onChange={ ( value ) => setAddressState( value ?? '' ) }
							options={ stateOptions }
						/>
					</FormFieldset>
				) }

				<FormFieldset className="company-details-form__business-address">
					<FormLabel>{ translate( 'Business address' ) }</FormLabel>
					<FormTextInput
						id="line1"
						name="line1"
						placeholder={ translate( 'Street name and house number' ) }
						value={ line1 }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
							setLine1( event.target.value )
						}
						disabled={ isLoading }
					/>
					<FormTextInput
						id="line2"
						name="line2"
						placeholder={ translate( 'Apartment, floor, suite or unit number' ) }
						value={ line2 }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
							setLine2( event.target.value )
						}
						disabled={ isLoading }
					/>
				</FormFieldset>

				<FormFieldset>
					<FormLabel htmlFor="city">{ translate( 'City' ) }</FormLabel>
					<FormTextInput
						id="city"
						name="city"
						value={ city }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) => setCity( event.target.value ) }
						disabled={ isLoading }
					/>
				</FormFieldset>

				<FormFieldset>
					<FormLabel htmlFor="postalCode">{ translate( 'Postal code' ) }</FormLabel>
					<FormTextInput
						id="postalCode"
						name="postalCode"
						value={ postalCode }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) =>
							setPostalCode( event.target.value )
						}
						disabled={ isLoading }
					/>
				</FormFieldset>

				{ includeTermsOfService && (
					<div className="company-details-form__tos">
						<p>
							{ translate(
								'By clicking ‘Continue’, you agree to the{{break}}{{/break}}{{link}}%(link_text)s{{icon}}{{/icon}}{{/link}}.',
								{
									components: {
										break: <br />,
										link: (
											<a
												href="https://jetpack.com/platform-agreement/"
												target="_blank"
												rel="noopener noreferrer"
											></a>
										),
										icon: <Gridicon icon="external" size={ 18 } />,
									},
									args: { link_text: 'Terms of the Jetpack Agency Platform Agreement' },
								}
							) }
						</p>
					</div>
				) }

				<div className="company-details-form__controls">
					<Button
						primary
						type="submit"
						className="company-details-form__submit"
						disabled={ ! showCountryFields || isLoading }
						busy={ isLoading }
					>
						{ submitLabel }
					</Button>
				</div>
			</form>
		</div>
	);
}
