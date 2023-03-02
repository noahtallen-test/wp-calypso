import { Button, Gridicon } from '@automattic/components';
import { ComboboxControl } from '@wordpress/components';
import { useTranslate } from 'i18n-calypso';
import { ReactChild, useCallback, useState, useMemo, ChangeEvent } from 'react';
import FormFieldset from 'calypso/components/forms/form-fieldset';
import FormLabel from 'calypso/components/forms/form-label';
import FormTextInput from 'calypso/components/forms/form-text-input';
import TextPlaceholder from 'calypso/jetpack-cloud/sections/partner-portal/text-placeholder';
import { PartnerDetailsPayload } from 'calypso/state/partner-portal/types';
import SearchableDropdown from './components/searchable-dropdown';
import { Option as CountryOption, useCountriesAndStates } from './hooks/use-countries-and-states';

import './style.scss';

const defaultCountry: CountryOption = {
	value: 'US',
	label: 'United States (US)',
	isLabel: false,
};

interface StateOption {
	value: string;
	label: string;
	isLabel: false;
}

function getCountry( country: string, options: CountryOption[] ): CountryOption {
	if ( options.length < 1 ) {
		return defaultCountry;
	}

	for ( let i = 0; i < options.length; i++ ) {
		if ( options[ i ].value === country ) {
			return options[ i ];
		}
	}

	return options[ 0 ];
}

function getState( state: string, options: StateOption[] ): StateOption {
	return options.find( ( option ) => option.value === state ) ?? options[ 0 ];
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
	const showCountryFields = countryOptions.length > 1;

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
	const stateOptions = stateOptionsMap.hasOwnProperty( country.value )
		? ( stateOptionsMap[ country.value ] as StateOption[] )
		: false;
	const state = stateOptions ? getState( addressState, stateOptions ) : false;

	const payload: PartnerDetailsPayload = useMemo(
		() => ( {
			name,
			contactPerson,
			companyWebsite,
			city,
			line1,
			line2,
			country: country.value,
			postalCode,
			state: addressState,
			...( includeTermsOfService ? { tos: 'consented' } : {} ),
		} ),
		[
			addressState,
			city,
			companyWebsite,
			contactPerson,
			country.value,
			includeTermsOfService,
			line1,
			line2,
			name,
			postalCode,
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

	const options = [
		{
			value: 'small',
			label: 'Small',
		},
		{
			value: 'normal',
			label: 'Normal',
		},
		{
			value: 'large',
			label: 'Large',
		},
	];

	const [ fontSize, setFontSize ] = useState();
	const [ filteredOptions, setFilteredOptions ] = useState( options );

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
						<SearchableDropdown
							className="company-details-form__dropdown"
							value={ country }
							placeholder={ translate( 'Type to find country' ) }
							options={ countryOptions }
							isDisabled={ isLoading }
							onChange={ ( option ) => {
								setCountryValue( option.value );
								// Reset the value of state since it no longer matches with the selected country.
								setAddressState( '' );
							} }
						/>
					) }

					{ ! showCountryFields && <TextPlaceholder /> }
				</FormFieldset>

				{ showCountryFields && stateOptions && state && (
					<FormFieldset>
						<FormLabel>{ translate( 'State' ) }</FormLabel>
						<SearchableDropdown
							className="company-details-form__dropdown"
							value={ state }
							options={ stateOptions }
							onChange={ ( option ) => {
								setAddressState( option.value );
							} }
							isDisabled={ isLoading }
							placeholder={ translate( 'Type to find state' ) }
						/>
					</FormFieldset>
				) }
				<FormLabel>{ translate( 'Country' ) }</FormLabel>
				<ComboboxControl
					value={ fontSize }
					onChange={ setFontSize }
					options={ countryOptions }
					onFilterValueChange={ ( inputValue ) =>
						setFilteredOptions(
							options.filter( ( option ) =>
								option.label.toLowerCase().startsWith( inputValue.toLowerCase() )
							)
						)
					}
				/>

				{ showCountryFields && stateOptions && fontSize && (
					<FormFieldset>
						<FormLabel>{ translate( 'State - New' ) }</FormLabel>
						<ComboboxControl
							value={ state }
							onChange={ setFontSize }
							options={ stateOptions }
							onFilterValueChange={ ( inputValue ) =>
								setFilteredOptions(
									options.filter( ( option ) =>
										option.label.toLowerCase().startsWith( inputValue.toLowerCase() )
									)
								)
							}
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
