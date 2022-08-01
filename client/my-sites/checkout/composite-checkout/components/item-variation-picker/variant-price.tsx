import { useMobileBreakpoint } from '@automattic/viewport-react';
import { styled } from '@automattic/wpcom-checkout';
import { useTranslate } from 'i18n-calypso';
import { FunctionComponent } from 'react';
import { myFormatCurrency } from 'calypso/my-sites/checkout/composite-checkout/hooks/product-variants';
import type { WPCOMProductVariant } from './types';

const Discount = styled.span`
	color: ${ ( props ) => props.theme.colors.discount };
	margin-right: 8px;

	.rtl & {
		margin-right: 0;
		margin-left: 8px;
	}

	.item-variant-option--selected & {
		color: #b8e6bf;
	}

	@media ( max-width: 660px ) {
		width: 100%;
	}
`;

const Price = styled.span`
	color: #646970;

	.item-variant-option--selected & {
		color: #fff;
	}
`;

const Variant = styled.div`
	align-items: center;
	display: flex;
	font-size: 14px;
	font-weight: 400;
	justify-content: space-between;
	line-height: 20px;
	width: 100%;

	.item-variant-option--selected & {
		color: #fff;
	}
`;

const Label = styled.span`
	display: flex;
	// MOBILE_BREAKPOINT is <480px, used in useMobileBreakpoint
	@media ( max-width: 480px ) {
		flex-direction: column;
	}
`;

const DiscountPercentage: FunctionComponent< { percent: number } > = ( { percent } ) => {
	const translate = useTranslate();
	return (
		<Discount>
			{ translate( 'Save %(percent)s%%', {
				args: {
					percent,
				},
			} ) }
		</Discount>
	);
};

export function getVariantPriceForTerm(
	variant: WPCOMProductVariant,
	termIntervalInMonths: number
): number {
	// This is the price that the compareTo variant would be if it was using the
	// billing term of the variant. For example, if the price of the compareTo
	// variant was 120 per year, and the variant we are displaying here is 5 per
	// month, then `compareToPriceForVariantTerm` would be (120 / 12) * 1,
	// or 10 (per month). In this case, selecting the variant would save the user
	// 50% (5 / 10).
	return variant.pricePerMonth * termIntervalInMonths;
}

export function getDiscountPercentageBetweenVariants(
	variant: WPCOMProductVariant,
	compareTo?: WPCOMProductVariant
): number {
	const compareToPriceForVariantTerm = compareTo
		? getVariantPriceForTerm( compareTo, variant.termIntervalInMonths )
		: undefined;
	// Extremely low "discounts" are possible if the price of the longer term has been rounded
	// if they cannot be rounded to at least a percentage point we should not show them.
	return compareToPriceForVariantTerm
		? Math.floor( 100 - ( variant.price / compareToPriceForVariantTerm ) * 100 )
		: 0;
}

export const ItemVariantPrice: FunctionComponent< {
	variant: WPCOMProductVariant;
	compareTo?: WPCOMProductVariant;
	showPrice?: boolean;
} > = ( { variant, compareTo, showPrice } ) => {
	const translate = useTranslate();
	const isMobile = useMobileBreakpoint();
	const formattedMonthlyPrice = myFormatCurrency( variant.pricePerMonth, variant.currency );
	const discountPercentage = getDiscountPercentageBetweenVariants( variant, compareTo );

	return (
		<Variant>
			<Label>
				{ variant.variantLabel }
				{ showPrice && discountPercentage > 0 && isMobile && (
					<DiscountPercentage percent={ discountPercentage } />
				) }
			</Label>
			<span>
				{ showPrice && discountPercentage > 0 && ! isMobile && (
					<DiscountPercentage percent={ discountPercentage } />
				) }
				{ showPrice && (
					<Price>
						{ translate( '%(monthlyPrice)s/month', {
							args: { monthlyPrice: formattedMonthlyPrice },
						} ) }
					</Price>
				) }
			</span>
		</Variant>
	);
};
