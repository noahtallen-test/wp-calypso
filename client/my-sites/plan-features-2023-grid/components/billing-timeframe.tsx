import {
	isWpComFreePlan,
	isWpcomEnterpriseGridPlan,
	PLAN_BIENNIAL_PERIOD,
	PLAN_ANNUAL_PERIOD,
	PlanSlug,
	getPlanSlugForTermVariant,
	TERM_ANNUALLY,
} from '@automattic/calypso-products';
import { formatCurrency } from '@automattic/format-currency';
import { TranslateResult, useTranslate } from 'i18n-calypso';
import { FunctionComponent } from 'react';
import { useSelector } from 'react-redux';
import { getCurrentUserCurrencyCode } from 'calypso/state/currency-code/selectors';
import { usePlanPricesDisplay } from '../hooks/use-plan-prices-display';

interface Props {
	planName: string;
	billingTimeframe: TranslateResult;
	billingPeriod: number | null | undefined;
	isMonthlyPlan: boolean;
	currentSitePlanSlug: string;
	siteId?: number;
}

function usePerMonthDescription( {
	isMonthlyPlan,
	planName,
	billingPeriod,
	currentSitePlanSlug,
	siteId,
}: Omit< Props, 'billingTimeframe' > ) {
	const translate = useTranslate();
	const currencyCode = useSelector( getCurrentUserCurrencyCode );
	const planPrices = usePlanPricesDisplay( {
		planSlug: planName as PlanSlug,
		returnMonthly: isMonthlyPlan,
		currentSitePlanSlug,
		siteId,
	} );

	// We want `planYearlyVariantPricesPerMonth` to be the raw price the user
	// would pay if they choose an annual plan instead of the monthly one. So pro-rated
	// (or site-plan specific) credits should not be taken into account.
	const planYearlyVariantPricesPerMonth = usePlanPricesDisplay( {
		planSlug:
			getPlanSlugForTermVariant( planName as PlanSlug, TERM_ANNUALLY ) ?? ( '' as PlanSlug ),
		returnMonthly: true,
		currentSitePlanSlug,
		siteId,
		withoutProRatedCredits: true,
	} );

	if ( isWpComFreePlan( planName ) || isWpcomEnterpriseGridPlan( planName ) ) {
		return null;
	}

	if ( isMonthlyPlan ) {
		const yearlyVariantMaybeDiscountedPricePerMonth =
			planYearlyVariantPricesPerMonth.discountedPrice ||
			planYearlyVariantPricesPerMonth.originalPrice;

		if ( yearlyVariantMaybeDiscountedPricePerMonth < planPrices.originalPrice ) {
			return translate( `Save %(discountRate)s%% by paying annually`, {
				args: {
					discountRate: Math.floor(
						( 100 * ( planPrices.originalPrice - yearlyVariantMaybeDiscountedPricePerMonth ) ) /
							planPrices.originalPrice
					),
				},
			} );
		}
	}

	if ( ! isMonthlyPlan ) {
		const discountedPrice = planPrices.discountedPrice;
		const fullTermDiscountedPriceText =
			currencyCode && discountedPrice
				? formatCurrency( discountedPrice, currencyCode, { stripZeros: true } )
				: null;
		const rawPrice =
			currencyCode && planPrices.originalPrice
				? formatCurrency( planPrices.originalPrice, currencyCode, { stripZeros: true } )
				: null;
		if ( fullTermDiscountedPriceText ) {
			if ( PLAN_ANNUAL_PERIOD === billingPeriod ) {
				//per month, $96 billed annually $84 for the first year

				return translate(
					'per month, {{discount}} %(rawPrice)s billed annually{{/discount}} %(fullTermDiscountedPriceText)s for the first year',
					{
						args: { fullTermDiscountedPriceText, rawPrice },
						components: {
							discount: (
								<span
									style={ { color: 'var(--studio-gray-20)', textDecoration: 'line-through' } }
								/>
							),
						},
					}
				);
			}

			if ( PLAN_BIENNIAL_PERIOD === billingPeriod ) {
				return translate(
					'per month, {{discount}} %(rawPrice)s billed annually{{/discount}} %(fullTermDiscountedPriceText)s for the first year',
					{
						args: { fullTermDiscountedPriceText, rawPrice },
						components: {
							discount: (
								<span
									style={ { color: 'var(--studio-gray-20)', textDecoration: 'line-through' } }
								/>
							),
						},
					}
				);
			}
		} else if ( rawPrice ) {
			if ( PLAN_ANNUAL_PERIOD === billingPeriod ) {
				return translate( 'per month, %(rawPrice)s billed annually.', {
					args: { rawPrice },
				} );
			}

			if ( PLAN_BIENNIAL_PERIOD === billingPeriod ) {
				return translate( 'per month, %(rawPrice)s billed every two years.', {
					args: { rawPrice },
				} );
			}
		}
	}

	return null;
}

const PlanFeatures2023GridBillingTimeframe: FunctionComponent< Props > = ( props ) => {
	const { planName, billingTimeframe } = props;
	const translate = useTranslate();
	const perMonthDescription = usePerMonthDescription( props ) || billingTimeframe;
	const price = formatCurrency( 25000, 'USD' );

	if ( isWpcomEnterpriseGridPlan( planName ) ) {
		return (
			<div className="plan-features-2023-grid__vip-price">
				{ translate( 'Starts at {{b}}%(price)s{{/b}} yearly.', {
					args: { price },
					components: { b: <b /> },
					comment: 'Translators: the price is in US dollars for all users (US$25,000)',
				} ) }
			</div>
		);
	}

	return <div>{ perMonthDescription }</div>;
};

export default PlanFeatures2023GridBillingTimeframe;
